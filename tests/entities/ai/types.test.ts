import { describe, expect, test } from 'bun:test'
import { aiChatDeltaSchema, aiChatErrorSchema, aiErrorResponseSchema, parseAiModels, parseAiProviders } from '@/entities/ai/types'

describe('parseAiProviders', () => {
    test('successResponse 봉투를 벗겨 프로바이더 배열을 반환한다', () => {
        const raw = { success: true, data: [{ id: 'p1', provider: 'anthropic', status: 'active', displayName: 'Anthropic' }] }
        const providers = parseAiProviders(raw)
        expect(providers).toHaveLength(1)
        expect(providers[0]?.provider).toBe('anthropic')
        expect(providers[0]?.status).toBe('active')
        expect(providers[0]?.displayName).toBe('Anthropic')
    })

    test('봉투 없이 배열로 와도 파싱하고 계약 외 필드는 무시한다', () => {
        const providers = parseAiProviders([{ id: 7, provider: 'codex', status: 'reauth_required', displayName: 'Codex', extra: true }])
        expect(providers[0]?.provider).toBe('codex')
        expect(providers[0]?.status).toBe('reauth_required')
    })

    test('disabled 상태도 파싱한다', () => {
        const providers = parseAiProviders([{ provider: 'ollama', status: 'disabled', displayName: 'Ollama' }])
        expect(providers[0]?.status).toBe('disabled')
    })

    test('계약에 없는 provider 나 status 면 예외를 던진다', () => {
        expect(() => parseAiProviders([{ provider: 'openai', status: 'active', displayName: 'OpenAI' }])).toThrow()
        expect(() => parseAiProviders([{ provider: 'ollama', status: 'connected', displayName: 'Ollama' }])).toThrow()
        expect(() => parseAiProviders({ providers: 'nope' })).toThrow()
    })
})

describe('parseAiModels', () => {
    test('successResponse 봉투를 벗겨 모델 배열을 반환한다', () => {
        const models = parseAiModels({ success: true, data: [{ modelId: 'claude-sonnet-4-5', displayName: 'Claude Sonnet 4.5' }] })
        expect(models).toHaveLength(1)
        expect(models[0]?.modelId).toBe('claude-sonnet-4-5')
        expect(models[0]?.displayName).toBe('Claude Sonnet 4.5')
    })

    test('봉투 없이 배열로 와도 파싱한다', () => {
        const models = parseAiModels([{ modelId: 'llama3', displayName: 'Llama 3', contextWindow: 8192 }])
        expect(models[0]?.modelId).toBe('llama3')
    })

    test('modelId 가 없으면 예외를 던진다', () => {
        expect(() => parseAiModels([{ displayName: '이름만' }])).toThrow()
    })
})

describe('aiChat 스키마', () => {
    test('delta 는 text 를 요구한다', () => {
        expect(aiChatDeltaSchema.safeParse({ text: '안녕' }).success).toBe(true)
        expect(aiChatDeltaSchema.safeParse({}).success).toBe(false)
    })

    test('error 는 code 와 message 를 요구한다', () => {
        expect(aiChatErrorSchema.safeParse({ code: 'X', message: 'm' }).success).toBe(true)
        expect(aiChatErrorSchema.safeParse({ code: 'X' }).success).toBe(false)
    })

    test('errorResponse 봉투를 파싱한다', () => {
        expect(aiErrorResponseSchema.safeParse({ success: false, error: { code: 'X', message: 'm' } }).success).toBe(true)
        expect(aiErrorResponseSchema.safeParse({ success: true, data: [] }).success).toBe(false)
    })
})
