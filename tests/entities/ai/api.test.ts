import { afterEach, describe, expect, test } from 'bun:test'
import { createAiChatError, getAiModels, getAiProviders, parseSseFrame, refreshAiModels, streamAiChat } from '@/entities/ai/api'

const originalFetch = globalThis.fetch

type FetchCall = { url: string; init?: RequestInit }

const stubFetch = (respond: () => Response) => {
    const calls: FetchCall[] = []
    const fetchStub = async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: input.toString(), init })
        return respond()
    }
    globalThis.fetch = fetchStub as typeof fetch
    return calls
}

const jsonResponse = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })

const sseResponse = (frames: string[]) =>
    new Response(
        new ReadableStream<Uint8Array>({
            start: (controller) => {
                const encoder = new TextEncoder()
                for (const frame of frames) controller.enqueue(encoder.encode(frame))
                controller.close()
            },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } },
    )

afterEach(() => {
    globalThis.fetch = originalFetch
})

describe('parseSseFrame', () => {
    test('event 와 data 를 분리한다', () => {
        const frame = 'event: delta\ndata: {"text":"hi"}'
        expect(parseSseFrame(frame)).toEqual({ event: 'delta', data: '{"text":"hi"}' })
    })

    test('event 가 없으면 message 로 본다', () => {
        expect(parseSseFrame('data: {"text":"hi"}')).toEqual({ event: 'message', data: '{"text":"hi"}' })
    })

    test('여러 data 줄은 개행으로 합친다', () => {
        expect(parseSseFrame('event: delta\ndata: a\ndata: b')).toEqual({ event: 'delta', data: 'a\nb' })
    })

    test('data 가 없으면 null 을 반환한다', () => {
        expect(parseSseFrame(': keep-alive comment')).toBeNull()
    })
})

describe('createAiChatError', () => {
    test('code 를 담은 Error 를 만든다', () => {
        const error = createAiChatError('AI_STREAM_ERROR', '오류')
        expect(error).toBeInstanceOf(Error)
        expect(error.code).toBe('AI_STREAM_ERROR')
        expect(error.message).toBe('오류')
        expect(error.name).toBe('AiChatError')
    })
})

describe('getAiProviders', () => {
    test('providers 경로를 세션 쿠키와 함께 조회해 파싱한다', async () => {
        const calls = stubFetch(() => jsonResponse({ success: true, data: [{ provider: 'ollama', status: 'active', displayName: 'Ollama' }] }))
        const providers = await getAiProviders()
        expect(calls[0]?.url.endsWith('/api/ai/providers')).toBe(true)
        expect(calls[0]?.init?.credentials).toBe('include')
        expect(providers[0]?.provider).toBe('ollama')
        expect(providers[0]?.status).toBe('active')
    })

    test('응답이 실패면 AI_PROVIDERS_FAILED 를 던진다', async () => {
        stubFetch(() => new Response('nope', { status: 500 }))
        await expect(getAiProviders()).rejects.toMatchObject({ code: 'AI_PROVIDERS_FAILED' })
    })
})

describe('getAiModels · refreshAiModels', () => {
    test('provider 별 models 경로를 조회해 파싱한다', async () => {
        const calls = stubFetch(() => jsonResponse([{ modelId: 'llama3', displayName: 'Llama 3' }]))
        const models = await getAiModels('ollama')
        expect(calls[0]?.url.endsWith('/api/ai/ollama/models')).toBe(true)
        expect(calls[0]?.init?.credentials).toBe('include')
        expect(models[0]?.modelId).toBe('llama3')
    })

    test('refresh 는 models/refresh 경로에 POST 로 호출한다', async () => {
        const calls = stubFetch(() => jsonResponse({ success: true, data: [] }))
        await refreshAiModels('codex')
        expect(calls[0]?.url.endsWith('/api/ai/codex/models/refresh')).toBe(true)
        expect(calls[0]?.init?.method).toBe('POST')
    })

    test('refresh 실패면 AI_MODELS_REFRESH_FAILED 를 던진다', async () => {
        stubFetch(() => new Response('nope', { status: 500 }))
        await expect(refreshAiModels('codex')).rejects.toMatchObject({ code: 'AI_MODELS_REFRESH_FAILED' })
    })
})

describe('streamAiChat', () => {
    const baseParams = {
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-5',
        messages: [{ role: 'user' as const, content: '내일 일정 알려줘' }],
        featureKey: 'calendar',
    }

    test('completions/stream 에 provider·modelId·messages·featureKey 를 POST 한다', async () => {
        const calls = stubFetch(() => sseResponse(['event: done\ndata: {"content":"","modelId":"claude-sonnet-4-5"}\n\n']))
        await streamAiChat(baseParams, { signal: new AbortController().signal, onDelta: () => {} })
        expect(calls[0]?.url.endsWith('/api/ai/completions/stream')).toBe(true)
        expect(calls[0]?.init?.method).toBe('POST')
        expect(calls[0]?.init?.credentials).toBe('include')
        expect(JSON.parse(String(calls[0]?.init?.body))).toEqual(baseParams)
    })

    test('delta 이벤트의 text 를 순서대로 전달하고 done 에서 종료한다', async () => {
        stubFetch(() =>
            sseResponse([
                'event: delta\ndata: {"text":"안"}\n\n',
                'event: delta\ndata: {"text":"녕"}\n\nevent: done\ndata: {"content":"안녕","modelId":"m","inputTokens":1,"outputTokens":2,"durationMs":3}\n\n',
                'event: delta\ndata: {"text":"done 이후는 무시"}\n\n',
            ]),
        )
        const received: string[] = []
        await streamAiChat(baseParams, { signal: new AbortController().signal, onDelta: (text) => received.push(text) })
        expect(received).toEqual(['안', '녕'])
    })

    test('error 이벤트면 code 와 message 를 담아 던진다', async () => {
        stubFetch(() => sseResponse(['event: error\ndata: {"code":"AI_UPSTREAM_ERROR","message":"업스트림 오류"}\n\n']))
        await expect(streamAiChat(baseParams, { signal: new AbortController().signal, onDelta: () => {} })).rejects.toMatchObject({
            code: 'AI_UPSTREAM_ERROR',
            message: '업스트림 오류',
        })
    })

    test('content-type 이 application/json 이면 스트림 전 오류로 던진다', async () => {
        stubFetch(() => jsonResponse({ success: false, error: { code: 'AI_PROVIDER_NOT_CONNECTED', message: '연결된 프로바이더가 없습니다.' } }, 400))
        await expect(streamAiChat(baseParams, { signal: new AbortController().signal, onDelta: () => {} })).rejects.toMatchObject({
            code: 'AI_PROVIDER_NOT_CONNECTED',
        })
    })

    test('JSON 오류 형식이 아니면 AI_REQUEST_FAILED 를 던진다', async () => {
        stubFetch(() => new Response('server exploded', { status: 500, headers: { 'Content-Type': 'text/plain' } }))
        await expect(streamAiChat(baseParams, { signal: new AbortController().signal, onDelta: () => {} })).rejects.toMatchObject({
            code: 'AI_REQUEST_FAILED',
        })
    })
})
