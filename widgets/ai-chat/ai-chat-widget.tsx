'use client'

import dayjs from 'dayjs'
import { type FC, useState } from 'react'
import { toast } from 'sonner'
import { appendAssistantDelta, buildAiMessages, buildCalendarContextText, dropTrailingEmptyAssistant } from '@/entities/ai/context'
import { useAiChatStream, useAiStatus } from '@/entities/ai/query'
import type { AiChatMessage } from '@/entities/ai/types'
import { useCalendarEvents, useCalendarGroups } from '@/entities/calendar/query'
import { AiChatPanel } from '@/features/ai-chat/ai-chat-panel'
import {
    AI_CONTEXT_FUTURE_MONTHS,
    AI_CONTEXT_PAST_MONTHS,
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
    const [width, setWidth] = useState(AI_PANEL_DEFAULT_WIDTH)

    const { data: providers = [] } = useAiStatus()
    const contextStartDate = dayjs(today).subtract(AI_CONTEXT_PAST_MONTHS, 'month').startOf('month').format(DATE_FORMAT)
    const contextEndDate = dayjs(today).add(AI_CONTEXT_FUTURE_MONTHS, 'month').endOf('month').format(DATE_FORMAT)
    const { data: events = [] } = useCalendarEvents(contextStartDate, contextEndDate)
    const { data: groups = [] } = useCalendarGroups()
    const chat = useAiChatStream()

    const connectedProviders = providers.filter((provider) => provider.connected).map((provider) => provider.provider)
    const activeProvider = selectedProvider ?? connectedProviders[0]

    const handleResize = (next: number) => setWidth(Math.min(AI_PANEL_MAX_WIDTH, Math.max(AI_PANEL_MIN_WIDTH, next)))

    const handleSend = async (text: string) => {
        if (!activeProvider) return
        const history: AiChatMessage[] = [...messages, { role: 'user', content: text }]
        setMessages([...history, { role: 'assistant', content: '' }])
        const contextText = buildCalendarContextText(events, groups, today)
        try {
            await chat.send({
                provider: activeProvider,
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
            providers={connectedProviders}
            selectedProvider={activeProvider ?? ''}
            onSelectProvider={setSelectedProvider}
            messages={messages}
            isStreaming={chat.isStreaming}
            onSend={handleSend}
            onCancel={chat.cancel}
            onClose={onClose}
        />
    )
}
