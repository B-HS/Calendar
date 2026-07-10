'use client'

import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { type FC, useState } from 'react'
import type { AiModel } from '@/entities/ai/types'
import { AI_LABEL } from '@/shared/constant/ai'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

type AiChatModelSelectProps = {
    models: AiModel[]
    selectedModelId: string
    onSelect: (modelId: string) => void
}

export const AiChatModelSelect: FC<AiChatModelSelectProps> = ({ models, selectedModelId, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false)

    const handleSelect = (modelId: string) => {
        onSelect(modelId)
        setIsOpen(false)
    }

    const selectedLabel = models.find((model) => model.modelId === selectedModelId)?.displayName ?? selectedModelId

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant='outline' size='xs' aria-label={AI_LABEL.model}>
                    {selectedLabel}
                    <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
                </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-56 gap-0.5 p-1'>
                {models.map((model) => (
                    <button
                        key={model.modelId}
                        onClick={() => handleSelect(model.modelId)}
                        className='flex w-full items-center justify-between px-2 py-1.5 text-sm hover:bg-accent'>
                        {model.displayName}
                        {model.modelId === selectedModelId && <HugeiconsIcon icon={Tick02Icon} size={12} />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    )
}
