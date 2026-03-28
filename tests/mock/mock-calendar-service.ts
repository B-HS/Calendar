import type { CalendarEvent, CalendarGroup } from '@/entities/calendar/types'
import type { CalendarService, CalendarServiceResult } from './calendar-service'

const ok = <T>(data: T): CalendarServiceResult<T> => ({ success: true, data })
const err = (code: string, message: string): CalendarServiceResult<never> => ({ success: false, error: { code, message } })

export const createMockCalendarService = (initialEvents: CalendarEvent[] = [], initialGroups: CalendarGroup[] = []): CalendarService => {
    let events = [...initialEvents]
    let groups = [...initialGroups]

    return {
        getEvents: async ({ startDate, endDate }) => {
            const filtered = events.filter((e) => e.startDate <= endDate && e.endDate >= startDate)
            return ok(filtered)
        },

        getEvent: async (id) => {
            const event = events.find((e) => e.id === id)
            if (!event) return err('EVENT_NOT_FOUND', 'Event not found')
            return ok(event)
        },

        createEvent: async (input) => {
            const event: CalendarEvent = { ...input, id: crypto.randomUUID() }
            events = [...events, event]
            return ok(event)
        },

        updateEvent: async (id, updates) => {
            const index = events.findIndex((e) => e.id === id)
            if (index === -1) return err('EVENT_NOT_FOUND', 'Event not found')
            const updated = { ...events[index], ...updates }
            events = events.map((e) => (e.id === id ? updated : e))
            return ok(updated)
        },

        deleteEvent: async (id) => {
            const index = events.findIndex((e) => e.id === id)
            if (index === -1) return err('EVENT_NOT_FOUND', 'Event not found')
            events = events.filter((e) => e.id !== id)
            return ok(undefined as void)
        },

        getGroups: async () => ok(groups),

        createGroup: async (input) => {
            const group: CalendarGroup = { ...input, id: crypto.randomUUID() }
            groups = [...groups, group]
            return ok(group)
        },

        updateGroup: async (id, updates) => {
            const index = groups.findIndex((g) => g.id === id)
            if (index === -1) return err('GROUP_NOT_FOUND', 'Group not found')
            const updated = { ...groups[index], ...updates }
            groups = groups.map((g) => (g.id === id ? updated : g))
            return ok(updated)
        },

        deleteGroup: async (id) => {
            const index = groups.findIndex((g) => g.id === id)
            if (index === -1) return err('GROUP_NOT_FOUND', 'Group not found')
            groups = groups.filter((g) => g.id !== id)
            return ok(undefined as void)
        },
    }
}
