import type { CalendarEvent, CalendarGroup } from '@/entities/calendar/types'

export type CalendarServiceResult<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } }

export type CalendarService = {
    getEvents: (params: { startDate: string; endDate: string }) => Promise<CalendarServiceResult<CalendarEvent[]>>
    getEvent: (id: string) => Promise<CalendarServiceResult<CalendarEvent>>
    createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarServiceResult<CalendarEvent>>
    updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<CalendarServiceResult<CalendarEvent>>
    deleteEvent: (id: string) => Promise<CalendarServiceResult<void>>
    getGroups: () => Promise<CalendarServiceResult<CalendarGroup[]>>
    createGroup: (group: Omit<CalendarGroup, 'id'>) => Promise<CalendarServiceResult<CalendarGroup>>
    updateGroup: (id: string, updates: Partial<CalendarGroup>) => Promise<CalendarServiceResult<CalendarGroup>>
    deleteGroup: (id: string) => Promise<CalendarServiceResult<void>>
}
