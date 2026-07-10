'use client'

import { useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import type { AiChatMessage } from './types'
import { getAiStatus, streamAiChat } from './api'

export const AI_QUERY_KEY = {
    STATUS: ['ai', 'status'] as const,
} as const

export const useAiStatus = () =>
    useQuery({
        queryKey: AI_QUERY_KEY.STATUS,
        queryFn: getAiStatus,
        retry: false,
    })

type AiChatSendParams = {
    provider: string
    model?: string
    messages: AiChatMessage[]
    onDelta: (text: string) => void
}

export const useAiChatStream = () => {
    const abortRef = useRef<AbortController | null>(null)
    const [isStreaming, setIsStreaming] = useState(false)

    const send = async ({ provider, model, messages, onDelta }: AiChatSendParams) => {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        setIsStreaming(true)
        try {
            await streamAiChat({ provider, model, messages }, { signal: controller.signal, onDelta })
        } finally {
            if (abortRef.current === controller) abortRef.current = null
            setIsStreaming(false)
        }
    }

    const cancel = () => abortRef.current?.abort()

    return { send, cancel, isStreaming }
}
