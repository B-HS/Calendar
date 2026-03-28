'use client'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Separator } from '@/shared/ui/separator'
import { ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { getMonthDays, isSameMonth, isToday } from '@/shared/lib/calendar-utils'
import { useCalendar } from '@/shared/hooks/use-calendar'

type CalendarSidebarProps = {
    className?: string
    children?: React.ReactNode
}

const CalendarMini: FC = () => {
    const { currentDate, goToPrevMonth, goToNextMonth, locale } = useCalendar()
    const d = dayjs(currentDate)
    const weeks = getMonthDays(d.year(), d.month())
    const title = `${locale.monthNames[d.month()]} ${d.year()}`

    return (
        <div className='p-3'>
            <div className='mb-2 flex items-center justify-between'>
                <span className='text-sm font-medium'>{title}</span>
                <div className='flex'>
                    <Button variant='ghost' size='icon-sm' onClick={goToPrevMonth} className='h-6 w-6'>
                        <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
                    </Button>
                    <Button variant='ghost' size='icon-sm' onClick={goToNextMonth} className='h-6 w-6'>
                        <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                    </Button>
                </div>
            </div>
            <div className='grid grid-cols-7 text-center text-[10px] text-muted-foreground'>
                {locale.weekdays.map((day) => (
                    <div key={day} className='py-0.5'>
                        {day}
                    </div>
                ))}
            </div>
            {weeks.map((week, wi) => (
                <div key={wi} className='grid grid-cols-7 text-center text-[11px]'>
                    {week.map((date, di) => {
                        const isCurrentMonth = isSameMonth(date, currentDate)
                        const isTodayDate = isToday(date)
                        return (
                            <div
                                key={di}
                                className={cn(
                                    'flex h-5 w-5 items-center justify-center rounded-full mx-auto',
                                    !isCurrentMonth && 'text-muted-foreground/40',
                                    isTodayDate && 'bg-primary text-primary-foreground font-semibold',
                                )}>
                                {date.getDate()}
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}

export const CalendarSidebar: FC<CalendarSidebarProps> = ({ className, children }) => {
    const { groups, toggleGroupVisibility } = useCalendar()

    return (
        <div className={cn('flex w-56 shrink-0 flex-col border-r', className)}>
            <CalendarMini />
            <Separator />
            <ScrollArea className='flex-1 p-3'>
                <div className='space-y-1'>
                    {groups.map((group) => (
                        <button
                            key={group.id}
                            role='checkbox'
                            aria-checked={group.visible}
                            aria-label={group.name}
                            onClick={() => toggleGroupVisibility(group.id)}
                            className='flex w-full cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-sm hover:bg-accent'>
                            <div
                                className={cn(
                                    'flex size-4 shrink-0 items-center justify-center rounded-xs',
                                    group.visible ? `${group.color} text-white` : 'border border-border',
                                )}>
                                {group.visible && <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={3} />}
                            </div>
                            <span className='truncate'>{group.name}</span>
                        </button>
                    ))}
                </div>
            </ScrollArea>
            {children}
        </div>
    )
}
