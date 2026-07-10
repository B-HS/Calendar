'use client'

import { SentIcon, StopIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { type FC, type KeyboardEvent, useState } from 'react'
import { AI_LABEL } from '@/shared/constant/ai'
import { Button } from '@/shared/ui/button'

type AiChatInputProps = {
    isStreaming: boolean
    onSend: (text: string) => void
    onCancel: () => void
}

export const AiChatInput: FC<AiChatInputProps> = ({ isStreaming, onSend, onCancel }) => {
    const [value, setValue] = useState('')

    const submit = () => {
        const text = value.trim()
        if (!text || isStreaming) return
        onSend(text)
        setValue('')
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
        }
    }

    return (
        <div className='flex items-end gap-2 border-t p-2'>
            <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={AI_LABEL.placeholder}
                aria-label={AI_LABEL.placeholder}
                className='max-h-32 min-h-8 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none'
            />
            {isStreaming ? (
                <Button variant='outline' size='icon-sm' onClick={onCancel} aria-label={AI_LABEL.stop}>
                    <HugeiconsIcon icon={StopIcon} size={16} />
                </Button>
            ) : (
                <Button size='icon-sm' onClick={submit} disabled={!value.trim()} aria-label={AI_LABEL.send}>
                    <HugeiconsIcon icon={SentIcon} size={16} />
                </Button>
            )}
        </div>
    )
}
