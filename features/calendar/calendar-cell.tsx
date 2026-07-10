'use client'

import { cn } from '@/shared/lib/utils'
import { useDroppable } from '@dnd-kit/core'
import type { FC, MouseEvent } from 'react'
import { formatDate, isSameMonth, isToday } from '@/shared/lib/calendar-utils'
import type { CalendarDropData, CalendarEvent } from '@/entities/calendar/types'
import { useCalendar } from '@/shared/hooks/use-calendar'

type CalendarCellProps = {
    date: Date
    dayIndex: number
    weekIndex: number
    onDoubleClick: (date: string) => void
    onShowMore: (date: string, events: CalendarEvent[]) => void
    overflowEvents: CalendarEvent[]
}

export const CalendarCell: FC<CalendarCellProps> = ({ date, dayIndex, weekIndex, onDoubleClick }) => {
    const { currentDate, selectedDate, selectDate } = useCalendar()
    const dateStr = formatDate(date)
    const isCurrentMonth = isSameMonth(date, currentDate)
    const isTodayDate = isToday(date)
    const isSelected = selectedDate === dateStr

    const { setNodeRef, isOver } = useDroppable({
        id: `cell-${dateStr}`,
        data: { date: dateStr, dayIndex, weekIndex } satisfies CalendarDropData,
    })

    const handleDoubleClick = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('[role="button"]')) return
        onDoubleClick(dateStr)
    }

    return (
        <div
            ref={setNodeRef}
            role='gridcell'
            aria-label={dateStr}
            aria-selected={isSelected}
            className={cn(
                'relative min-h-[120px] border-b border-r p-0.5',
                !isCurrentMonth && 'bg-muted/30',
                isOver && 'bg-primary/10',
                isSelected && 'bg-primary/5',
                dayIndex === 0 && 'text-red-500',
                dayIndex === 6 && 'text-blue-500',
            )}
            onClick={() => selectDate(dateStr)}
            onDoubleClick={handleDoubleClick}>
            <div className={cn('flex h-6 items-center justify-end px-1 text-xs', !isCurrentMonth && 'text-muted-foreground/50')}>
                <span
                    className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full',
                        isTodayDate && 'bg-primary text-primary-foreground font-semibold',
                    )}>
                    {date.getDate()}
                </span>
            </div>
        </div>
    )
}
