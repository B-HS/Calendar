'use client'

import { DATE_DISPLAY_FORMAT } from '@/shared/constant/date'
import { cn } from '@/shared/lib/utils'
import dayjs from 'dayjs'
import { type FC, useEffect, useRef } from 'react'
import type { CalendarEvent } from '@/entities/calendar/types'
import { useCalendar } from '@/shared/hooks/use-calendar'

type CalendarEventDetailProps = {
    event: CalendarEvent | null
    anchor: { x: number; y: number } | null
    onClose: () => void
}

export const CalendarEventDetail: FC<CalendarEventDetailProps> = ({ event, anchor, onClose }) => {
    const { getGroupById, locale } = useCalendar()
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!event) return

        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [event, onClose])

    if (!event || !anchor) return null

    const group = getGroupById(event.groupId)
    const colorClass = event.color ?? group?.color ?? 'bg-slate-400'
    const isSingleDay = event.startDate === event.endDate

    const dateDisplay = isSingleDay
        ? dayjs(event.startDate).format(DATE_DISPLAY_FORMAT)
        : `${dayjs(event.startDate).format(DATE_DISPLAY_FORMAT)} - ${dayjs(event.endDate).format(DATE_DISPLAY_FORMAT)}`

    const timeDisplay =
        !event.isAllDay && event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.isAllDay ? locale.allDay : null

    const statusLabel = event.status ? { confirmed: locale.confirmed, tentative: locale.tentative, cancelled: locale.cancelled }[event.status] : null

    return (
        <div
            ref={ref}
            className='fixed z-50 w-64 rounded-xs border bg-popover p-4 shadow-lg'
            style={{
                left: `${Math.min(anchor.x, window.innerWidth - 280)}px`,
                top: `${Math.min(anchor.y + 8, window.innerHeight - 250)}px`,
            }}>
            <div className='flex items-start gap-2'>
                <div className={cn('mt-1 h-3 w-3 shrink-0 rounded-xs', colorClass)} />
                <div className='min-w-0 space-y-1'>
                    <p className='text-sm font-semibold'>{event.title}</p>
                    <p className='text-xs text-muted-foreground'>{dateDisplay}</p>
                    {timeDisplay && <p className='text-xs text-muted-foreground'>{timeDisplay}</p>}
                    {group && <p className='text-xs text-muted-foreground'>{group.name}</p>}
                    {event.location && <p className='text-xs text-muted-foreground'>{event.location}</p>}
                    {event.description && <p className='mt-1 text-xs text-muted-foreground'>{event.description}</p>}
                    {statusLabel && <p className='text-xs text-muted-foreground'>{statusLabel}</p>}
                </div>
            </div>
        </div>
    )
}
