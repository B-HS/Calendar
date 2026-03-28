'use client'

import { COLUMN_WIDTH_PERCENT, MAX_VISIBLE_LANES, POINTER_SENSOR_DISTANCE, TOUCH_SENSOR_DELAY, TOUCH_SENSOR_TOLERANCE } from '@/shared/constant/calendar'
import { DATE_FORMAT } from '@/shared/constant/date'
import { cn } from '@/shared/lib/utils'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { DndContext, DragOverlay, PointerSensor, TouchSensor, pointerWithin, useSensor, useSensors } from '@dnd-kit/core'
import dayjs from 'dayjs'
import { type FC, type MouseEvent, useState } from 'react'
import { formatDate } from '@/shared/lib/calendar-utils'
import type { CalendarEvent, MovePreview, ResizePreview } from '@/entities/calendar/types'
import { useCalendar } from '@/shared/hooks/use-calendar'
import { CalendarCell } from './calendar-cell'
import { CalendarEventContextMenu } from './calendar-context-menu'
import { CalendarDayDrawer } from './calendar-day-drawer'
import { CalendarDeleteDialog } from './calendar-delete-dialog'
import { CalendarEventBar, EVENT_GAP, EVENT_HEIGHT } from './calendar-event'
import { CalendarEventDetail } from './calendar-event-detail'
import { CalendarEventEditPopover } from './calendar-event-edit-popover'
import { CalendarEventForm } from './calendar-event-form'

type CalendarGridProps = {
    className?: string
}

export const CalendarGrid: FC<CalendarGridProps> = ({ className }) => {
    const { weekRows, locale, getGroupById, selectedEventId, selectEvent, selectedDate, selectDate, deleteEvent, updateEvent, events } = useCalendar()

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: POINTER_SENSOR_DISTANCE } }),
        useSensor(TouchSensor, { activationConstraint: { delay: TOUCH_SENSOR_DELAY, tolerance: TOUCH_SENSOR_TOLERANCE } }),
    )

    const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
    const [resizePreview, setResizePreview] = useState<ResizePreview>(null)
    const [movePreview, setMovePreview] = useState<MovePreview>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [formDate, setFormDate] = useState<string>('')
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
    const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null)
    const [detailAnchor, setDetailAnchor] = useState<{ x: number; y: number } | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [drawerDate, setDrawerDate] = useState<string>('')
    const [drawerEvents, setDrawerEvents] = useState<CalendarEvent[]>([])
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; event: CalendarEvent } | null>(null)
    const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
    const [editAnchor, setEditAnchor] = useState<{ x: number; y: number } | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deletingEventId, setDeletingEventId] = useState<string | null>(null)

    const getResizePreviewForWeek = (weekIndex: number): { startCol: number; span: number; lane: number } | null => {
        if (!resizePreview) return null
        const { edge, originalLane, sourceWeekIndex, sourceStartCol, sourceSpan, targetWeekIndex, targetDayIndex } = resizePreview
        const origEndCol = sourceStartCol + sourceSpan - 1
        const weekOffset = targetWeekIndex - sourceWeekIndex
        const targetAbsoluteDay = targetDayIndex + weekOffset * 7
        let newStartCol = edge === 'start' ? targetAbsoluteDay : sourceStartCol
        let newEndCol = edge === 'start' ? origEndCol : targetAbsoluteDay
        if (newStartCol > newEndCol) [newStartCol, newEndCol] = [newEndCol, newStartCol]
        const weekStartAbsolute = (weekIndex - sourceWeekIndex) * 7
        if (newEndCol < weekStartAbsolute || newStartCol > weekStartAbsolute + 6) return null
        const clampedStart = Math.max(0, newStartCol - weekStartAbsolute)
        const clampedEnd = Math.min(6, newEndCol - weekStartAbsolute)
        return { startCol: clampedStart, span: clampedEnd - clampedStart + 1, lane: originalLane }
    }

    const getMinHeight = (weekIndex: number) => {
        const row = weekRows[weekIndex]
        if (!row) return 100
        let maxLane = 0
        for (const layout of row.layouts) maxLane = Math.max(maxLane, layout.lane)
        const hasOverflow = Object.values(row.overflowByDay).some((v) => v.length > 0)
        if (hasOverflow) maxLane = Math.max(maxLane, MAX_VISIBLE_LANES - 1)
        return Math.max(100, 28 + (maxLane + 1) * (EVENT_HEIGHT + EVENT_GAP))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEventId) {
            e.preventDefault()
            setDeletingEventId(selectedEventId)
            setDeleteDialogOpen(true)
        }
        if (e.key === 'Escape') {
            selectEvent(null)
            setDetailEvent(null)
        }
        if (selectedDate && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault()
            const d = dayjs(selectedDate)
            const next =
                e.key === 'ArrowLeft'
                    ? d.subtract(1, 'day')
                    : e.key === 'ArrowRight'
                      ? d.add(1, 'day')
                      : e.key === 'ArrowUp'
                        ? d.subtract(7, 'day')
                        : d.add(7, 'day')
            selectDate(next.format(DATE_FORMAT))
        }
        if (e.key === 'Enter' && selectedDate && !selectedEventId) {
            e.preventDefault()
            setEditingEvent(null)
            setFormDate(selectedDate)
            setFormOpen(true)
        }
    }

    const handleCellDoubleClick = (date: string) => {
        setEditingEvent(null)
        setFormDate(date)
        setFormOpen(true)
    }

    const handleEventDoubleClick = (e: MouseEvent, event: CalendarEvent) => {
        e.stopPropagation()
        setDetailAnchor({ x: e.clientX, y: e.clientY })
        setDetailEvent(event)
    }

    const handleEventContextMenu = (e: MouseEvent, event: CalendarEvent) => {
        e.preventDefault()
        e.stopPropagation()
        selectEvent(event.id)
        setContextMenu({ x: e.clientX, y: e.clientY, event })
    }

    const handleShowMore = (date: string, evts: CalendarEvent[]) => {
        setDrawerDate(date)
        setDrawerEvents(evts)
        setDrawerOpen(true)
    }

    const handleConfirmDelete = () => {
        if (deletingEventId) {
            deleteEvent(deletingEventId)
            setDeletingEventId(null)
        }
        setDeleteDialogOpen(false)
    }

    const handleDragStart = (e: DragStartEvent) => {
        const data = e.active.data.current as Record<string, unknown> | undefined
        if (!data) return
        const event = data.event as CalendarEvent
        const dragType = data.dragType as 'move' | 'resize'
        selectEvent(event.id)

        if (dragType === 'resize') {
            const edge = data.edge as 'start' | 'end'
            const weekIndex = data.weekIndex as number
            const startCol = data.startCol as number
            const span = data.span as number
            const lane = data.lane as number
            setResizePreview({
                event,
                edge,
                originalLane: lane,
                sourceWeekIndex: weekIndex,
                sourceStartCol: startCol,
                sourceSpan: span,
                targetWeekIndex: weekIndex,
                targetDayIndex: edge === 'start' ? startCol : startCol + span - 1,
            })
        } else {
            const startCol = data.startCol as number
            const weekIndex = data.weekIndex as number
            const eventTotalDays = dayjs(event.endDate).diff(dayjs(event.startDate), 'day') + 1
            const activatorEvt = e.activatorEvent as PointerEvent
            const weekRow = (activatorEvt.target as HTMLElement).closest('[data-week-row]')
            let grabOffset = 0
            if (weekRow) {
                const gridRect = weekRow.getBoundingClientRect()
                const cellWidth = gridRect.width / 7
                const clickedCol = Math.floor((activatorEvt.clientX - gridRect.left) / cellWidth)
                grabOffset = Math.max(0, Math.min(clickedCol - startCol, eventTotalDays - 1))
            }
            setDraggedEvent(event)
            setMovePreview({ event, eventTotalDays, grabOffset, targetWeekIndex: weekIndex, targetDayIndex: startCol + grabOffset })
        }
    }

    const handleDragOver = (e: DragOverEvent) => {
        const target = e.over?.data.current as { dayIndex: number; weekIndex: number } | undefined
        if (!target) return
        if (resizePreview) {
            setResizePreview((prev) => (prev ? { ...prev, targetWeekIndex: target.weekIndex, targetDayIndex: target.dayIndex } : null))
        }
        if (movePreview) {
            setMovePreview((prev) => (prev ? { ...prev, targetWeekIndex: target.weekIndex, targetDayIndex: target.dayIndex } : null))
        }
    }

    const handleDragEnd = (e: DragEndEvent) => {
        const { over, active } = e
        const sourceData = active.data.current as Record<string, unknown> | undefined
        const targetData = over?.data.current as { dayIndex: number; weekIndex: number; date: string } | undefined

        if (sourceData && targetData) {
            const sourceEvent = sourceData.event as CalendarEvent
            const dragType = sourceData.dragType as 'move' | 'resize'
            const sourceWeekIndex = sourceData.weekIndex as number
            const clickedCol = sourceData.startCol as number
            const targetDayIndex = targetData.dayIndex
            const targetWeekIndex = targetData.weekIndex

            if (dragType === 'resize') {
                const edge = sourceData.edge as 'start' | 'end'
                const position = { startCol: sourceData.startCol as number, span: sourceData.span as number }
                const edgeCol = edge === 'start' ? position.startCol : position.startCol + position.span - 1
                const resizeOffset = targetDayIndex - edgeCol + (targetWeekIndex - sourceWeekIndex) * 7
                if (resizeOffset !== 0) {
                    if (edge === 'start') {
                        const newStart = dayjs(sourceEvent.startDate).add(resizeOffset, 'day').format(DATE_FORMAT)
                        if (newStart <= sourceEvent.endDate) updateEvent(sourceEvent.id, { startDate: newStart })
                    } else {
                        const newEnd = dayjs(sourceEvent.endDate).add(resizeOffset, 'day').format(DATE_FORMAT)
                        if (newEnd >= sourceEvent.startDate) updateEvent(sourceEvent.id, { endDate: newEnd })
                    }
                }
            } else {
                const grabOffset = movePreview?.grabOffset ?? 0
                const dropAbsoluteStart = targetDayIndex - grabOffset + (targetWeekIndex - sourceWeekIndex) * 7
                const dayDelta = dropAbsoluteStart - clickedCol
                if (dayDelta !== 0) {
                    const newStart = dayjs(sourceEvent.startDate).add(dayDelta, 'day').format(DATE_FORMAT)
                    const newEnd = dayjs(sourceEvent.endDate).add(dayDelta, 'day').format(DATE_FORMAT)
                    updateEvent(sourceEvent.id, { startDate: newStart, endDate: newEnd })
                }
            }
        }

        setDraggedEvent(null)
        setMovePreview(null)
        setResizePreview(null)
    }

    const handleDragCancel = () => {
        setDraggedEvent(null)
        setMovePreview(null)
        setResizePreview(null)
    }

    return (
        <DndContext
            id='calendar-dnd'
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}>
            <div
                role='grid'
                aria-label='Calendar'
                className={cn('flex flex-1 flex-col overflow-auto outline-none', className)}
                tabIndex={0}
                onKeyDown={handleKeyDown}>
                <div className='grid grid-cols-7 border-b'>
                    {locale.weekdays.map((day, i) => (
                        <div
                            key={day}
                            className={cn(
                                'border-r px-2 py-1.5 text-center text-xs font-medium text-muted-foreground',
                                i === 0 && 'text-red-500',
                                i === 6 && 'text-blue-500',
                            )}>
                            {day}
                        </div>
                    ))}
                </div>

                <div className='flex flex-1 flex-col'>
                    {weekRows.map((row, wi) => (
                        <div key={wi} role='row' data-week-row className='relative grid grid-cols-7' style={{ minHeight: `${getMinHeight(wi)}px` }}>
                            {row.days.map((date, di) => (
                                <CalendarCell
                                    key={di}
                                    date={date}
                                    dayIndex={di}
                                    weekIndex={wi}
                                    onDoubleClick={handleCellDoubleClick}
                                    onShowMore={handleShowMore}
                                    overflowEvents={row.overflowByDay[di] ?? []}
                                />
                            ))}

                            <div className='pointer-events-none absolute inset-x-0 top-7 bottom-0 overflow-hidden'>
                                {row.layouts.map((layout) => (
                                    <div key={`${layout.event.id}-${wi}`} className='pointer-events-auto'>
                                        <CalendarEventBar
                                            event={layout.event}
                                            group={getGroupById(layout.event.groupId)}
                                            startCol={layout.startCol}
                                            span={layout.span}
                                            lane={layout.lane}
                                            isStart={layout.isStart}
                                            isEnd={layout.isEnd}
                                            weekIndex={wi}
                                            onContextMenu={handleEventContextMenu}
                                            onDoubleClick={handleEventDoubleClick}
                                        />
                                    </div>
                                ))}

                                {row.days.map((date, di) => {
                                    const overflow = row.overflowByDay[di]
                                    if (!overflow || overflow.length === 0) return null
                                    const dateStr = formatDate(date)
                                    return (
                                        <button
                                            key={`more-${di}`}
                                            className='pointer-events-auto absolute z-20 rounded-xs px-1.5 text-left text-xs font-semibold text-muted-foreground hover:bg-accent'
                                            style={{
                                                top: `${(MAX_VISIBLE_LANES - 1) * (EVENT_HEIGHT + EVENT_GAP)}px`,
                                                left: `calc(${di} * ${COLUMN_WIDTH_PERCENT}% + 1px)`,
                                                width: `calc(${COLUMN_WIDTH_PERCENT}% - 2px)`,
                                                height: `${EVENT_HEIGHT}px`,
                                                lineHeight: `${EVENT_HEIGHT}px`,
                                            }}
                                            onClick={() => {
                                                const allDayEvents = events.filter((ev) => ev.startDate <= dateStr && ev.endDate >= dateStr)
                                                handleShowMore(dateStr, allDayEvents)
                                            }}>
                                            {locale.more(overflow.length)}
                                        </button>
                                    )
                                })}

                                {resizePreview &&
                                    (() => {
                                        const previewPos = getResizePreviewForWeek(wi)
                                        if (!previewPos) return null
                                        const colorClass = getGroupById(resizePreview.event.groupId)?.color ?? 'bg-slate-400'
                                        return (
                                            <div
                                                className={cn('absolute rounded-xs opacity-60', colorClass)}
                                                style={{
                                                    top: `${previewPos.lane * (EVENT_HEIGHT + EVENT_GAP)}px`,
                                                    left: `calc(${previewPos.startCol} * ${COLUMN_WIDTH_PERCENT}% + 1px)`,
                                                    width: `calc(${previewPos.span} * ${COLUMN_WIDTH_PERCENT}% - 2px)`,
                                                    height: `${EVENT_HEIGHT}px`,
                                                }}
                                            />
                                        )
                                    })()}
                            </div>
                        </div>
                    ))}
                </div>

                <DragOverlay dropAnimation={null}>
                    {draggedEvent ? (
                        <div
                            className={cn(
                                'flex cursor-grabbing items-center rounded-xs px-1.5 text-xs font-semibold text-white shadow-lg',
                                getGroupById(draggedEvent.groupId)?.color ?? 'bg-slate-400',
                            )}
                            style={{ height: `${EVENT_HEIGHT}px`, minWidth: '120px' }}>
                            <span className='truncate'>{draggedEvent.title}</span>
                        </div>
                    ) : null}
                </DragOverlay>

                <CalendarEventForm open={formOpen} onOpenChange={setFormOpen} defaultDate={formDate} editingEvent={editingEvent} />
                <CalendarEventDetail event={detailEvent} anchor={detailAnchor} onClose={() => setDetailEvent(null)} />
                <CalendarDayDrawer open={drawerOpen} onOpenChange={setDrawerOpen} date={drawerDate} events={drawerEvents} />
                <CalendarEventContextMenu
                    contextMenu={contextMenu}
                    onClose={() => setContextMenu(null)}
                    onEdit={(event, anchor) => {
                        setEditEvent(event)
                        setEditAnchor(anchor)
                    }}
                    onDelete={(id) => {
                        setDeletingEventId(id)
                        setDeleteDialogOpen(true)
                    }}
                />
                <CalendarEventEditPopover
                    event={editEvent}
                    anchor={editAnchor}
                    onClose={() => {
                        setEditEvent(null)
                        setEditAnchor(null)
                    }}
                />
                <CalendarDeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleConfirmDelete} />
            </div>
        </DndContext>
    )
}
