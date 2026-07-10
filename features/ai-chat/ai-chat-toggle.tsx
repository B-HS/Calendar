'use client'

import { AiChat02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { FC } from 'react'
import { AI_LABEL } from '@/shared/constant/ai'
import { Button } from '@/shared/ui/button'

type AiChatToggleProps = {
    isOpen: boolean
    onToggle: () => void
}

export const AiChatToggle: FC<AiChatToggleProps> = ({ isOpen, onToggle }) => (
    <Button
        variant='ghost'
        size='icon-sm'
        onClick={onToggle}
        aria-label={AI_LABEL.title}
        aria-pressed={isOpen}
        className={isOpen ? 'bg-muted text-foreground' : undefined}>
        <HugeiconsIcon icon={AiChat02Icon} size={16} />
    </Button>
)
