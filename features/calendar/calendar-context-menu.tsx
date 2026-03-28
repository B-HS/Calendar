'use client'

import { cn } from '@/shared/lib/utils'
import { type FC, useEffect, useRef } from 'react'
import type { CalendarEvent } from '@/entities/calendar/types'
import { useCalendar } from '@/shared/hooks/use-calendar'

type CalendarEventContextMenuProps = {
    contextMenu: { x: number; y: number; event: CalendarEvent } | null
    onClose: () => void
    onEdit: (event: CalendarEvent, anchor: { x: number; y: number }) => void
    onDelete: (id: string) => void
}

export const CalendarEventContextMenu: FC<CalendarEventContextMenuProps> = ({ contextMenu, onClose, onEdit, onDelete }) => {
    const { locale, groups, moveEventToGroup } = useCalendar()
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!contextMenu) return

        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose()
            }
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
    }, [contextMenu, onClose])

    if (!contextMenu) return null

    const { x, y, event } = contextMenu

    return (
        <div
            ref={ref}
            role='menu'
            className='fixed z-50 min-w-[180px] rounded-xs border bg-popover p-1 shadow-lg'
            style={{
                left: `${Math.min(x, window.innerWidth - 200)}px`,
                top: `${Math.min(y, window.innerHeight - 300)}px`,
            }}>
            <div className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>{locale.moveToGroup}</div>
            {groups.map((group) => (
                <button
                    key={group.id}
                    role='menuitem'
                    className='flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-50'
                    disabled={group.id === event.groupId}
                    onClick={() => {
                        moveEventToGroup(event.id, group.id)
                        onClose()
                    }}>
                    <div className={cn('h-2.5 w-2.5 rounded-full', group.color)} />
                    <span>{group.name}</span>
                    {group.id === event.groupId && <span className='ml-auto text-xs text-muted-foreground'>✓</span>}
                </button>
            ))}
            <div className='my-1 h-px bg-border' />
            <button
                role='menuitem'
                className='flex w-full items-center rounded-xs px-2 py-1.5 text-sm hover:bg-accent'
                onClick={() => {
                    onEdit(event, { x, y })
                    onClose()
                }}>
                {locale.editEvent}
            </button>
            <button
                role='menuitem'
                className='flex w-full items-center rounded-xs px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10'
                onClick={() => {
                    onDelete(event.id)
                    onClose()
                }}>
                {locale.deleteEvent}
            </button>
        </div>
    )
}
