'use client'

import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import type { AiChatMessage } from './types'
import { getAiModels, getAiProviders, refreshAiModels, streamAiChat } from './api'

export const AI_QUERY_KEY = {
    PROVIDERS: ['ai', 'providers'] as const,
    MODELS: (provider: string) => ['ai', 'models', provider] as const,
} as const

export const useAiProviders = () =>
    useQuery({
        queryKey: AI_QUERY_KEY.PROVIDERS,
        queryFn: getAiProviders,
        retry: false,
    })

export const useAiModels = (provider?: string) =>
    useQuery({
        queryKey: AI_QUERY_KEY.MODELS(provider ?? ''),
        queryFn: provider ? () => getAiModels(provider) : skipToken,
        retry: false,
    })

export const useRefreshAiModels = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (provider: string) => refreshAiModels(provider),
        onSuccess: (_, provider) => {
            queryClient.invalidateQueries({ queryKey: AI_QUERY_KEY.MODELS(provider) })
        },
        onError: (error) => toast.error(error.message),
    })
}

type AiChatSendParams = {
    provider: string
    modelId: string
    messages: AiChatMessage[]
    featureKey?: string
    onDelta: (text: string) => void
}

export const useAiChatStream = () => {
    const abortRef = useRef<AbortController | null>(null)
    const [isStreaming, setIsStreaming] = useState(false)

    const send = async ({ provider, modelId, messages, featureKey, onDelta }: AiChatSendParams) => {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        setIsStreaming(true)
        try {
            await streamAiChat({ provider, modelId, messages, featureKey }, { signal: controller.signal, onDelta })
        } finally {
            if (abortRef.current === controller) abortRef.current = null
            setIsStreaming(false)
        }
    }

    const cancel = () => abortRef.current?.abort()

    return { send, cancel, isStreaming }
}
