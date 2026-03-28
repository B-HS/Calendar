'use client'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Separator } from '@/shared/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { ColorPicker } from '@/shared/ui/color-picker'
import { ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon, Add01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import dayjs from 'dayjs'
import { type FC, type MouseEvent, useEffect, useRef, useState } from 'react'
import { getMonthDays, isSameMonth, isToday } from '@/shared/lib/calendar-utils'
import { useCalendar } from '@/shared/hooks/use-calendar'
import { EVENT_COLORS, type EventColor } from '@/shared/constant/color'
import type { CalendarGroup } from '@/entities/calendar/types'

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

type GroupFormState = {
    mode: 'create' | 'edit'
    group?: CalendarGroup
} | null

type GroupContextMenuState = {
    x: number
    y: number
    group: CalendarGroup
} | null

const GroupContextMenu: FC<{ menu: GroupContextMenuState; onClose: () => void; onEdit: (group: CalendarGroup) => void; onDelete: (group: CalendarGroup) => void }> = ({
    menu,
    onClose,
    onEdit,
    onDelete,
}) => {
    const { locale } = useCalendar()
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!menu) return
        const handleClickOutside = (e: globalThis.MouseEvent) => {
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
    }, [menu, onClose])

    if (!menu) return null

    return (
        <div
            ref={ref}
            role='menu'
            className='fixed z-50 min-w-[140px] rounded-xs border bg-popover p-1 shadow-lg'
            style={{
                left: `${Math.min(menu.x, window.innerWidth - 160)}px`,
                top: `${Math.min(menu.y, window.innerHeight - 100)}px`,
            }}>
            <button
                role='menuitem'
                className='flex w-full items-center rounded-xs px-2 py-1.5 text-sm hover:bg-accent'
                onClick={() => {
                    onEdit(menu.group)
                    onClose()
                }}>
                {locale.editGroup}
            </button>
            <button
                role='menuitem'
                className='flex w-full items-center rounded-xs px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10'
                onClick={() => {
                    onDelete(menu.group)
                    onClose()
                }}>
                {locale.deleteGroup}
            </button>
        </div>
    )
}

export const CalendarSidebar: FC<CalendarSidebarProps> = ({ className, children }) => {
    const { groups, locale, toggleGroupVisibility, createGroup, updateGroup, deleteGroup } = useCalendar()

    const [formState, setFormState] = useState<GroupFormState>(null)
    const [formName, setFormName] = useState('')
    const [formColor, setFormColor] = useState<EventColor>(EVENT_COLORS[5])
    const [contextMenu, setContextMenu] = useState<GroupContextMenuState>(null)
    const [deleteTarget, setDeleteTarget] = useState<CalendarGroup | null>(null)

    const handleOpenCreate = () => {
        setFormState({ mode: 'create' })
        setFormName('')
        setFormColor(EVENT_COLORS[5])
    }

    const handleOpenEdit = (group: CalendarGroup) => {
        setFormState({ mode: 'edit', group })
        setFormName(group.name)
        setFormColor(group.color as EventColor)
    }

    const handleFormSubmit = () => {
        const name = formName.trim()
        if (!name) return

        if (formState?.mode === 'create') {
            createGroup({ name, color: formColor })
        } else if (formState?.mode === 'edit' && formState.group) {
            updateGroup(formState.group.id, { name, color: formColor })
        }
        setFormState(null)
    }

    const handleConfirmDelete = () => {
        if (deleteTarget) {
            deleteGroup(deleteTarget.id)
            setDeleteTarget(null)
        }
    }

    const handleContextMenu = (e: MouseEvent, group: CalendarGroup) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, group })
    }

    return (
        <div className={cn('flex w-56 shrink-0 flex-col border-r', className)}>
            <CalendarMini />
            <Separator />
            <ScrollArea className='flex-1 p-3'>
                <div className='mb-2 flex items-center justify-between'>
                    <span className='text-xs font-medium text-muted-foreground'>{locale.group}</span>
                    <Button variant='ghost' size='icon-sm' className='h-5 w-5' onClick={handleOpenCreate}>
                        <HugeiconsIcon icon={Add01Icon} size={12} />
                    </Button>
                </div>
                <div className='space-y-1'>
                    {groups.map((group) => (
                        <button
                            key={group.id}
                            role='checkbox'
                            aria-checked={group.visible}
                            aria-label={group.name}
                            onClick={() => toggleGroupVisibility(group.id)}
                            onContextMenu={(e) => handleContextMenu(e, group)}
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

            <GroupContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} onEdit={handleOpenEdit} onDelete={setDeleteTarget} />

            <Dialog open={formState !== null} onOpenChange={(open) => !open && setFormState(null)}>
                <DialogContent className='sm:max-w-sm'>
                    <DialogHeader>
                        <DialogTitle>{formState?.mode === 'edit' ? locale.editGroup : locale.newGroup}</DialogTitle>
                    </DialogHeader>
                    <div className='grid gap-4 py-2'>
                        <div className='grid gap-2'>
                            <Input
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder={locale.groupName}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleFormSubmit()}
                            />
                        </div>
                        <div className='grid gap-2'>
                            <ColorPicker value={formColor} onChange={setFormColor} label={locale.colorPicker} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setFormState(null)}>
                            {locale.cancel}
                        </Button>
                        <Button onClick={handleFormSubmit}>{locale.save}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className='sm:max-w-sm'>
                    <DialogHeader>
                        <DialogTitle>{locale.deleteGroupConfirmTitle}</DialogTitle>
                        <DialogDescription>{locale.deleteGroupConfirmDescription}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setDeleteTarget(null)}>
                            {locale.cancel}
                        </Button>
                        <Button variant='destructive' onClick={handleConfirmDelete}>
                            {locale.delete}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {children}
        </div>
    )
}
