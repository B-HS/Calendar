'use client'

import type { FC } from 'react'
import type { AiChatMessage as AiChatMessageType } from '@/entities/ai/types'
import { AI_LABEL } from '@/shared/constant/ai'
import { cn } from '@/shared/lib/utils'

type AiChatMessageProps = {
    message: AiChatMessageType
}

export const AiChatMessage: FC<AiChatMessageProps> = ({ message }) => {
    const isUser = message.role === 'user'
    const isPending = !isUser && message.content === ''

    return (
        <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[85%] px-3 py-2 text-sm break-words whitespace-pre-wrap',
                    isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                    isPending && 'text-muted-foreground',
                )}>
                {isPending ? `${AI_LABEL.thinking}…` : message.content}
            </div>
        </div>
    )
}
