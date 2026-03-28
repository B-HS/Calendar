'use client'

import { cn } from '@/shared/lib/utils'
import type { FC, PropsWithChildren } from 'react'
import type { CalendarEvent, CalendarGroup, CalendarLocale } from '@/entities/calendar/types'
import { CalendarContext, useCalendarProvider } from '@/shared/hooks/use-calendar'
import { CalendarErrorBoundary } from './calendar-error-boundary'

type CalendarProviderProps = PropsWithChildren<{
    events: CalendarEvent[]
    groups: CalendarGroup[]
    locale?: CalendarLocale
    today?: string
    onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void
    onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void
    onDeleteEvent: (id: string) => void
    onToggleGroupVisibility: (groupId: string) => void
    onMoveEventToGroup: (eventId: string, groupId: string) => void
    onMonthChange?: (date: Date) => void
    className?: string
}>

export const Calendar: FC<CalendarProviderProps> = ({
    children,
    events,
    groups,
    locale,
    today,
    onAddEvent,
    onUpdateEvent,
    onDeleteEvent,
    onToggleGroupVisibility,
    onMoveEventToGroup,
    onMonthChange,
    className,
}) => {
    const value = useCalendarProvider({
        events,
        groups,
        locale,
        today,
        onAddEvent,
        onUpdateEvent,
        onDeleteEvent,
        onToggleGroupVisibility,
        onMoveEventToGroup,
        onMonthChange,
    })

    return (
        <CalendarContext value={value}>
            <CalendarErrorBoundary>
                <div className={cn('flex h-full w-full overflow-hidden', className)}>{children}</div>
            </CalendarErrorBoundary>
        </CalendarContext>
    )
}
