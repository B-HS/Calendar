'use client'

import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { type FC, useState } from 'react'
import { AI_LABEL } from '@/shared/constant/ai'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

type AiChatProviderSelectProps = {
    providers: string[]
    selected: string
    onSelect: (provider: string) => void
}

export const AiChatProviderSelect: FC<AiChatProviderSelectProps> = ({ providers, selected, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false)

    const handleSelect = (provider: string) => {
        onSelect(provider)
        setIsOpen(false)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant='outline' size='xs' aria-label={AI_LABEL.provider}>
                    {selected}
                    <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
                </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-40 gap-0.5 p-1'>
                {providers.map((provider) => (
                    <button
                        key={provider}
                        onClick={() => handleSelect(provider)}
                        className='flex w-full items-center justify-between px-2 py-1.5 text-sm hover:bg-accent'>
                        {provider}
                        {provider === selected && <HugeiconsIcon icon={Tick02Icon} size={12} />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    )
}
