'use client'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useCalendar } from '@/shared/hooks/use-calendar'

type CalendarHeaderProps = {
    className?: string
    onToggleSidebar?: () => void
}

export const CalendarHeader: FC<CalendarHeaderProps> = ({ className, onToggleSidebar }) => {
    const { currentDate, locale, goToPrevMonth, goToNextMonth, goToToday } = useCalendar()

    const d = dayjs(currentDate)
    const title = `${locale.monthNames[d.month()]} ${d.year()}`

    return (
        <div className={cn('flex items-center justify-between border-b px-4 py-2', className)} role='toolbar' aria-label='Calendar navigation'>
            <div className='flex items-center gap-2'>
                {onToggleSidebar && (
                    <Button variant='ghost' size='icon-sm' onClick={onToggleSidebar} className='md:hidden' aria-label='Toggle sidebar'>
                        <svg width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='2'>
                            <path d='M2 4h12M2 8h12M2 12h12' />
                        </svg>
                    </Button>
                )}
                <h1 className='text-xl font-semibold' aria-live='polite'>
                    {title}
                </h1>
            </div>
            <div className='flex items-center gap-1'>
                <Button variant='outline' size='sm' onClick={goToToday} aria-label={locale.today}>
                    {locale.today}
                </Button>
                <Button variant='ghost' size='icon-sm' onClick={goToPrevMonth} aria-label='Previous month'>
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                </Button>
                <Button variant='ghost' size='icon-sm' onClick={goToNextMonth} aria-label='Next month'>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Button>
            </div>
        </div>
    )
}
