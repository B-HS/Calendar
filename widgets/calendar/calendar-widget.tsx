'use client'

import {
    useCalendarEvents,
    useCalendarGroups,
    useCalendarSubscription,
    useCreateEvent,
    useCreateGroup,
    useDeleteEvent,
    useDeleteGroup,
    useUpdateEvent,
    useUpdateGroup,
} from '@/entities/calendar/query'
import type { CalendarEvent, CalendarGroup } from '@/entities/calendar/types'
import { Calendar } from '@/features/calendar/calendar'
import { CalendarGrid } from '@/features/calendar/calendar-grid'
import { CalendarHeader } from '@/features/calendar/calendar-header'
import { CalendarSidebar } from '@/features/calendar/calendar-sidebar'
import { ko } from '@/shared/lib/i18n'
import { formatDate, getMonthGridRange } from '@/shared/lib/calendar-utils'
import { CalendarExport } from '@/features/calendar/calendar-export'
import { Drawer, DrawerContent } from '@/shared/ui/drawer'
import { type FC, useState } from 'react'

type CalendarWidgetProps = {
    today: string
    initialEvents: CalendarEvent[]
    initialGroups: CalendarGroup[]
}

export const CalendarWidget: FC<CalendarWidgetProps> = ({ today, initialEvents, initialGroups }) => {
    const [currentMonth, setCurrentMonth] = useState(today)
    const { startDate, endDate } = getMonthGridRange(currentMonth)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const { data: events = initialEvents } = useCalendarEvents(startDate, endDate)
    const { data: groups = initialGroups } = useCalendarGroups()
    const { data: subscription } = useCalendarSubscription()
    const createEvent = useCreateEvent()
    const updateEvent = useUpdateEvent()
    const deleteEvent = useDeleteEvent()
    const createGroup = useCreateGroup()
    const updateGroup = useUpdateGroup()
    const deleteGroup = useDeleteGroup()
    const handleAddEvent = (event: Omit<CalendarEvent, 'id'>) => {
        createEvent.mutate(event)
    }

    const handleUpdateEvent = (id: string, updates: Partial<CalendarEvent>) => {
        updateEvent.mutate({ uid: id, input: updates })
    }

    const handleDeleteEvent = (id: string) => {
        deleteEvent.mutate(id)
    }

    const handleToggleGroupVisibility = (groupId: string) => {
        const group = groups.find((g) => g.id === groupId)
        if (group) {
            updateGroup.mutate({ id: groupId, input: { isVisible: !group.visible } })
        }
    }

    const handleMoveEventToGroup = (eventId: string, groupId: string) => {
        updateEvent.mutate({ uid: eventId, input: { groupId } })
    }

    const handleCreateGroup = (input: { name: string; color: string }) => {
        createGroup.mutate(input)
    }

    const handleUpdateGroup = (id: string, input: { name?: string; color?: string }) => {
        updateGroup.mutate({ id, input })
    }

    const handleDeleteGroup = (id: string) => {
        deleteGroup.mutate(id)
    }

    const handleMonthChange = (date: Date) => {
        setCurrentMonth(formatDate(date))
    }

    return (
        <Calendar
            events={events}
            groups={groups}
            locale={ko}
            today={today}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onToggleGroupVisibility={handleToggleGroupVisibility}
            onMoveEventToGroup={handleMoveEventToGroup}
            onCreateGroup={handleCreateGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            onMonthChange={handleMonthChange}
            className='h-screen'>
            <CalendarSidebar className='hidden md:flex'>
                {subscription && (
                    <CalendarExport
                        icsUrl={subscription.icsUrl}
                        caldavUrl={subscription.caldavUrl}
                        caldavToken={subscription.token}
                        subscriptionName={subscription.name}
                    />
                )}
            </CalendarSidebar>

            <Drawer open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <DrawerContent className='md:hidden'>
                    <CalendarSidebar className='w-full border-r-0' />
                </DrawerContent>
            </Drawer>

            <div className='flex flex-1 flex-col overflow-hidden'>
                <CalendarHeader onToggleSidebar={() => setIsSidebarOpen(true)} />
                <CalendarGrid />
            </div>
        </Calendar>
    )
}
