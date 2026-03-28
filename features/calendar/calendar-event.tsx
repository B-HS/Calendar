'use client'

import { COLUMN_WIDTH_PERCENT, EVENT_GAP, EVENT_HEIGHT } from '@/shared/constant/calendar'
import { cn } from '@/shared/lib/utils'
import { useDraggable } from '@dnd-kit/core'
import { type FC, type MouseEvent, useState } from 'react'
import type { CalendarEvent as CalendarEventType, CalendarGroup } from '@/entities/calendar/types'
import { useCalendar } from '@/shared/hooks/use-calendar'

type CalendarEventBarProps = {
    event: CalendarEventType
    group: CalendarGroup | undefined
    startCol: number
    span: number
    lane: number
    isStart: boolean
    isEnd: boolean
    weekIndex: number
    onContextMenu: (e: MouseEvent, event: CalendarEventType) => void
    onDoubleClick: (e: MouseEvent, event: CalendarEventType) => void
}

export { EVENT_GAP, EVENT_HEIGHT } from '@/shared/constant/calendar'

export const CalendarEventBar: FC<CalendarEventBarProps> = ({
    event,
    group,
    startCol,
    span,
    lane,
    isStart,
    isEnd,
    weekIndex,
    onContextMenu,
    onDoubleClick,
}) => {
    const { selectEvent } = useCalendar()
    const color = group?.color ?? 'bg-slate-400'
    const [isOverResizeHandle, setIsOverResizeHandle] = useState(false)

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `event-${event.id}-${weekIndex}-${startCol}`,
        data: { type: 'move', event, startCol, span, weekIndex, dragType: 'move' },
        disabled: isOverResizeHandle,
    })

    const handleMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return
        selectEvent(event.id)
    }

    const style: React.CSSProperties = {
        top: `${lane * (EVENT_HEIGHT + EVENT_GAP)}px`,
        left: `calc(${startCol} * ${COLUMN_WIDTH_PERCENT}% + 1px)`,
        width: `calc(${span} * ${COLUMN_WIDTH_PERCENT}% - 2px)`,
        height: `${EVENT_HEIGHT}px`,
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            role='button'
            tabIndex={0}
            aria-label={`${event.title}, ${event.startDate}${event.startDate !== event.endDate ? ` - ${event.endDate}` : ''}`}
            className={cn(
                'group absolute z-10 flex cursor-grab items-center px-1.5 text-xs font-semibold text-white transition-opacity outline-none select-none',
                color,
                isStart && 'rounded-l-xs',
                isEnd && 'rounded-r-xs',
                isDragging && 'cursor-grabbing',
            )}
            style={style}
            onMouseDown={handleMouseDown}
            onContextMenu={(e) => onContextMenu(e, event)}
            onDoubleClick={(e) => onDoubleClick(e, event)}>
            {isStart && (
                <ResizeHandle
                    eventId={event.id}
                    weekIndex={weekIndex}
                    startCol={startCol}
                    span={span}
                    lane={lane}
                    type='resize-start'
                    event={event}
                    onHoverChange={setIsOverResizeHandle}
                />
            )}
            {isStart && (
                <span className='truncate'>
                    {!event.isAllDay && event.startTime && <span className='mr-1 shrink-0 text-white/70 hidden min-[900px]:inline'>{event.startTime}</span>}
                    {event.title}
                </span>
            )}
            {isEnd && (
                <ResizeHandle
                    eventId={event.id}
                    weekIndex={weekIndex}
                    startCol={startCol}
                    span={span}
                    lane={lane}
                    type='resize-end'
                    event={event}
                    onHoverChange={setIsOverResizeHandle}
                />
            )}
        </div>
    )
}

type ResizeHandleProps = {
    eventId: string
    weekIndex: number
    startCol: number
    span: number
    lane: number
    type: 'resize-start' | 'resize-end'
    event: CalendarEventType
    onHoverChange: (isOver: boolean) => void
}

const ResizeHandle: FC<ResizeHandleProps> = ({ eventId, weekIndex, startCol, span, lane, type, event, onHoverChange }) => {
    const { setNodeRef, listeners, attributes } = useDraggable({
        id: `${type}-${eventId}-${weekIndex}-${startCol}`,
        data: { type, event, weekIndex, startCol, span, lane, edge: type === 'resize-start' ? 'start' : 'end', dragType: 'resize' },
    })

    const isStartEdge = type === 'resize-start'

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'absolute top-0 bottom-0 z-20 w-2 cursor-ew-resize opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-50',
                isStartEdge ? 'left-0' : 'right-0',
            )}
            {...listeners}
            {...attributes}
            aria-label={isStartEdge ? 'Resize start' : 'Resize end'}
            onClick={(e) => e.stopPropagation()}
            onPointerEnter={() => onHoverChange(true)}
            onPointerLeave={() => onHoverChange(false)}>
            <div className={cn('absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-white/80', isStartEdge ? 'left-0.5' : 'right-0.5')} />
        </div>
    )
}
