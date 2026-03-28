'use client'

import { DATE_DISPLAY_FORMAT } from '@/shared/constant/date'
import { cn } from '@/shared/lib/utils'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer'
import dayjs from 'dayjs'
import type { FC } from 'react'

import type { CalendarEvent } from '@/entities/calendar/types'
import { useCalendar } from '@/shared/hooks/use-calendar'

type CalendarDayDrawerProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    date: string
    events: CalendarEvent[]
}

export const CalendarDayDrawer: FC<CalendarDayDrawerProps> = ({ open, onOpenChange, date, events }) => {
    const { getGroupById, locale } = useCalendar()

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>{dayjs(date).format(DATE_DISPLAY_FORMAT)}</DrawerTitle>
                </DrawerHeader>
                <div className='px-4 pb-6'>
                    <div className='space-y-2'>
                        {events.map((event) => {
                            const group = getGroupById(event.groupId)
                            return (
                                <div key={event.id} className='flex items-center gap-2 rounded-xs border px-3 py-2'>
                                    <div className={cn('h-3 w-3 shrink-0 rounded-xs', group?.color ?? 'bg-slate-400')} />
                                    <span className='text-sm'>{event.title}</span>
                                    {group && <span className='ml-auto text-xs text-muted-foreground'>{group.name}</span>}
                                </div>
                            )
                        })}
                        {events.length === 0 && <p className='text-center text-sm text-muted-foreground'>{locale.noEvents}</p>}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
