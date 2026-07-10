'use client'

import dayjs from 'dayjs'
import { type FC, useState } from 'react'
import { toast } from 'sonner'
import { appendAssistantDelta, buildAiMessages, buildCalendarContextText, dropTrailingEmptyAssistant } from '@/entities/ai/context'
import { useAiChatStream, useAiModels, useAiProviders, useRefreshAiModels } from '@/entities/ai/query'
import type { AiChatMessage } from '@/entities/ai/types'
import { useCalendarEvents, useCalendarGroups } from '@/entities/calendar/query'
import { AiChatPanel } from '@/features/ai-chat/ai-chat-panel'
import {
    AI_CONTEXT_FUTURE_MONTHS,
    AI_CONTEXT_PAST_MONTHS,
    AI_FEATURE_KEY,
    AI_LABEL,
    AI_PANEL_DEFAULT_WIDTH,
    AI_PANEL_MAX_WIDTH,
    AI_PANEL_MIN_WIDTH,
} from '@/shared/constant/ai'
import { DATE_FORMAT } from '@/shared/constant/date'

type AiChatWidgetProps = {
    today: string
    onClose: () => void
}

export const AiChatWidget: FC<AiChatWidgetProps> = ({ today, onClose }) => {
    const [messages, setMessages] = useState<AiChatMessage[]>([])
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
    const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
    const [width, setWidth] = useState(AI_PANEL_DEFAULT_WIDTH)

    const { data: providers = [] } = useAiProviders()
    const contextStartDate = dayjs(today).subtract(AI_CONTEXT_PAST_MONTHS, 'month').startOf('month').format(DATE_FORMAT)
    const contextEndDate = dayjs(today).add(AI_CONTEXT_FUTURE_MONTHS, 'month').endOf('month').format(DATE_FORMAT)
    const { data: events = [] } = useCalendarEvents(contextStartDate, contextEndDate)
    const { data: groups = [] } = useCalendarGroups()
    const chat = useAiChatStream()

    const activeProviders = providers.filter((provider) => provider.status === 'active')
    const activeProvider =
        selectedProvider && activeProviders.some((provider) => provider.provider === selectedProvider)
            ? selectedProvider
            : activeProviders[0]?.provider

    const { data: models = [], isLoading: isModelsLoading } = useAiModels(activeProvider)
    const refreshModels = useRefreshAiModels()
    const activeModelId = selectedModelId && models.some((model) => model.modelId === selectedModelId) ? selectedModelId : models[0]?.modelId

    const handleResize = (next: number) => setWidth(Math.min(AI_PANEL_MAX_WIDTH, Math.max(AI_PANEL_MIN_WIDTH, next)))

    const handleSelectProvider = (provider: string) => {
        setSelectedProvider(provider)
        setSelectedModelId(null)
    }

    const handleRefreshModels = () => {
        if (!activeProvider) return
        refreshModels.mutate(activeProvider)
    }

    const handleSend = async (text: string) => {
        if (!activeProvider || !activeModelId) return
        const history: AiChatMessage[] = [...messages, { role: 'user', content: text }]
        setMessages([...history, { role: 'assistant', content: '' }])
        const contextText = buildCalendarContextText(events, groups, today)
        try {
            await chat.send({
                provider: activeProvider,
                modelId: activeModelId,
                featureKey: AI_FEATURE_KEY,
                messages: buildAiMessages({ contextText, history }),
                onDelta: (delta) => setMessages((prev) => appendAssistantDelta(prev, delta)),
            })
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return
            setMessages((prev) => dropTrailingEmptyAssistant(prev))
            toast.error(error instanceof Error ? error.message : AI_LABEL.errorGeneric)
        }
    }

    return (
        <AiChatPanel
            width={width}
            onResize={handleResize}
            providers={activeProviders}
            selectedProvider={activeProvider ?? ''}
            onSelectProvider={handleSelectProvider}
            models={models}
            selectedModelId={activeModelId ?? ''}
            onSelectModel={setSelectedModelId}
            canRefreshModels={Boolean(activeProvider) && !isModelsLoading}
            isRefreshingModels={refreshModels.isPending}
            onRefreshModels={handleRefreshModels}
            messages={messages}
            isStreaming={chat.isStreaming}
            onSend={handleSend}
            onCancel={chat.cancel}
            onClose={onClose}
        />
    )
}
