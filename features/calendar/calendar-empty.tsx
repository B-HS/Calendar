'use client'

import type { FC } from 'react'

import { useCalendar } from '@/shared/hooks/use-calendar'

export const CalendarEmpty: FC<{ message?: string }> = ({ message }) => {
    const { locale } = useCalendar()
    return (
        <div className='flex h-full items-center justify-center'>
            <p className='text-sm text-muted-foreground'>{message ?? locale.noEvents}</p>
        </div>
    )
}
