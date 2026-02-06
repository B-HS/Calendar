import { apiClient } from '$lib/api/client'
import type {
	CalendarEvent,
	CalendarEventResponse,
	CreateEventInput,
	UpdateEventInput,
	MonthQuery
} from './event.types'

const parseEventResponse = (event: CalendarEventResponse): CalendarEvent => ({
	...event,
	dtstart: new Date(event.dtstart),
	dtend: new Date(event.dtend),
	created: event.created ? new Date(event.created) : undefined,
	lastModified: event.lastModified ? new Date(event.lastModified) : undefined
})

export const eventApi = {
	getEvents: async ({ year, month }: MonthQuery) => {
		const events = await apiClient.get<CalendarEventResponse[]>(
			`/api/events?year=${year}&month=${month}`
		)
		return events.map(parseEventResponse)
	},

	createEvent: async (data: CreateEventInput) => {
		const event = await apiClient.post<CalendarEventResponse, CreateEventInput>(
			'/api/events',
			data
		)
		return parseEventResponse(event)
	},

	updateEvent: async (uid: string, data: UpdateEventInput) => {
		const event = await apiClient.put<CalendarEventResponse, UpdateEventInput>(
			`/api/events/${uid}`,
			data
		)
		return parseEventResponse(event)
	},

	deleteEvent: async (uid: string) => {
		await apiClient.delete<void>(`/api/events/${uid}`)
	}
}
