'use client'

import type { FC } from 'react'

import { Button } from '@/shared/ui/button'

import { useCalendar } from '@/shared/hooks/use-calendar'

export const CalendarError: FC<{ message?: string; onRetry?: () => void }> = ({ message, onRetry }) => {
    const { locale } = useCalendar()
    return (
        <div className='flex h-full flex-col items-center justify-center gap-3'>
            <p className='text-sm text-muted-foreground'>{message ?? locale.dataLoadError}</p>
            {onRetry && (
                <Button variant='outline' size='sm' onClick={onRetry}>
                    {locale.retry}
                </Button>
            )}
        </div>
    )
}
