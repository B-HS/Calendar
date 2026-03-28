'use client'

import { cn } from '@/shared/lib/utils'
import type { FC } from 'react'
import { EVENT_COLORS, type EventColor } from '@/shared/constant/color'

type ColorPickerProps = {
    value?: string
    onChange: (color: EventColor) => void
    label?: string
}

export const ColorPicker: FC<ColorPickerProps> = ({ value, onChange, label }) => {
    return (
        <div className='flex flex-wrap gap-1.5' role='radiogroup' aria-label={label}>
            {EVENT_COLORS.map((color) => (
                <button
                    key={color}
                    type='button'
                    role='radio'
                    aria-checked={value === color}
                    aria-label={color.replace('bg-', '').replace('-500', '')}
                    className={cn('h-6 w-6 rounded-full transition-shadow', color, value === color && 'ring-2 ring-offset-2 ring-foreground')}
                    onClick={() => onChange(color)}
                />
            ))}
        </div>
    )
}
