'use client'

import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { type FC, type PointerEvent, useEffect, useRef } from 'react'
import type { AiChatMessage as AiChatMessageType } from '@/entities/ai/types'
import { AI_LABEL } from '@/shared/constant/ai'
import { Button } from '@/shared/ui/button'
import { AiChatInput } from './ai-chat-input'
import { AiChatMessage } from './ai-chat-message'
import { AiChatProviderSelect } from './ai-chat-provider-select'

type AiChatPanelProps = {
    width: number
    onResize: (width: number) => void
    providers: string[]
    selectedProvider: string
    onSelectProvider: (provider: string) => void
    messages: AiChatMessageType[]
    isStreaming: boolean
    onSend: (text: string) => void
    onCancel: () => void
    onClose: () => void
}

export const AiChatPanel: FC<AiChatPanelProps> = ({
    width,
    onResize,
    providers,
    selectedProvider,
    onSelectProvider,
    messages,
    isStreaming,
    onSend,
    onCancel,
    onClose,
}) => {
    const draggingRef = useRef(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        draggingRef.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!draggingRef.current) return
        onResize(window.innerWidth - event.clientX)
    }

    const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
        draggingRef.current = false
        event.currentTarget.releasePointerCapture(event.pointerId)
    }

    useEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [messages])

    return (
        <aside className='relative flex h-full shrink-0 flex-col border-l bg-background' style={{ width }} aria-label={AI_LABEL.title}>
            <div
                role='separator'
                aria-label={AI_LABEL.resize}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className='absolute top-0 left-0 h-full w-1 -translate-x-1/2 cursor-col-resize hover:bg-primary/40'
            />
            <div className='flex items-center justify-between gap-2 border-b px-3 py-2'>
                <span className='text-sm font-semibold'>{AI_LABEL.title}</span>
                <div className='flex items-center gap-1'>
                    {providers.length > 1 && <AiChatProviderSelect providers={providers} selected={selectedProvider} onSelect={onSelectProvider} />}
                    <Button variant='ghost' size='icon-sm' onClick={onClose} aria-label={AI_LABEL.close}>
                        <HugeiconsIcon icon={Cancel01Icon} size={16} />
                    </Button>
                </div>
            </div>
            <div ref={scrollRef} className='flex-1 space-y-2 overflow-y-auto p-3'>
                {messages.length === 0 ? (
                    <p className='mt-8 text-center text-sm text-muted-foreground'>{AI_LABEL.empty}</p>
                ) : (
                    messages.map((message, index) => <AiChatMessage key={index} message={message} />)
                )}
            </div>
            <AiChatInput isStreaming={isStreaming} onSend={onSend} onCancel={onCancel} />
        </aside>
    )
}
