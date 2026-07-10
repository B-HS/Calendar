'use client'

import type { AiChatMessage } from './types'
import { aiChatDeltaSchema, aiChatErrorSchema, aiErrorResponseSchema, parseAiProviders } from './types'
import { AI_API_PATH, AI_BASE_URL } from '@/shared/constant/ai'

export type AiChatError = Error & { code: string }

export const createAiChatError = (code: string, message: string): AiChatError => Object.assign(new Error(message), { code, name: 'AiChatError' })

const safeJsonParse = (raw: string): unknown => {
    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}

type SseEvent = { event: string; data: string }

export const parseSseFrame = (frame: string): SseEvent | null => {
    const lines = frame.split('\n')
    const dataLines: string[] = []
    let event = 'message'
    for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice('event:'.length).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice('data:'.length).replace(/^ /, ''))
    }
    if (dataLines.length === 0) return null
    return { event, data: dataLines.join('\n') }
}

export const getAiStatus = async () => {
    const res = await fetch(`${AI_BASE_URL}${AI_API_PATH.STATUS}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw createAiChatError('AI_STATUS_FAILED', 'AI 상태를 확인할 수 없습니다.')
    const raw: unknown = await res.json()
    return parseAiProviders(raw)
}

type AiChatStreamParams = {
    provider: string
    model?: string
    messages: AiChatMessage[]
}

type AiChatStreamCallbacks = {
    signal: AbortSignal
    onDelta: (text: string) => void
}

export const streamAiChat = async (params: AiChatStreamParams, { signal, onDelta }: AiChatStreamCallbacks) => {
    const res = await fetch(`${AI_BASE_URL}${AI_API_PATH.CHAT}`, {
        method: 'POST',
        credentials: 'include',
        signal,
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify(params),
    })

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/event-stream')) {
        const parsed = aiErrorResponseSchema.safeParse(safeJsonParse(await res.text()))
        if (parsed.success) throw createAiChatError(parsed.data.error.code, parsed.data.error.message)
        throw createAiChatError('AI_REQUEST_FAILED', 'AI 요청에 실패했습니다.')
    }

    if (!res.body) throw createAiChatError('AI_NO_STREAM', 'AI 응답 스트림을 열 수 없습니다.')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const frames = buffer.split('\n\n')
        buffer = frames.pop() ?? ''
        for (const frame of frames) {
            const parsed = parseSseFrame(frame)
            if (!parsed) continue
            if (parsed.event === 'done' || parsed.data === '[DONE]') return
            if (parsed.event === 'error') {
                const errorPayload = aiChatErrorSchema.safeParse(safeJsonParse(parsed.data))
                throw errorPayload.success
                    ? createAiChatError(errorPayload.data.code, errorPayload.data.message)
                    : createAiChatError('AI_STREAM_ERROR', 'AI 응답 중 오류가 발생했습니다.')
            }
            if (parsed.event === 'delta') {
                const delta = aiChatDeltaSchema.safeParse(safeJsonParse(parsed.data))
                if (delta.success) onDelta(delta.data.text)
            }
        }
    }
}
