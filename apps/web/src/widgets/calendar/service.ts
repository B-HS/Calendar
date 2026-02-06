import type { CalendarEvent } from './types'

export interface CalendarService {
	getEvents: (year: number, month: number) => Promise<CalendarEvent[]>
	createEvent: (event: Omit<CalendarEvent, 'uid' | 'created' | 'lastModified'>) => Promise<CalendarEvent>
	updateEvent: (event: CalendarEvent) => Promise<CalendarEvent>
	deleteEvent: (uid: string) => Promise<void>
}

const generateUid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

const mockEvents: CalendarEvent[] = [
	{
		uid: 'event-1',
		summary: 'Team Meeting',
		description: 'Weekly team sync',
		location: 'Conference Room A',
		dtstart: new Date(2026, 0, 15, 10, 0),
		dtend: new Date(2026, 0, 15, 11, 0),
		isAllDay: false,
		status: 'CONFIRMED',
		color: 'bg-blue-500',
		created: new Date(),
		lastModified: new Date()
	},
	{
		uid: 'event-2',
		summary: 'Project Deadline',
		description: 'Submit final deliverables',
		dtstart: new Date(2026, 0, 20, 0, 0),
		dtend: new Date(2026, 0, 20, 23, 59),
		isAllDay: true,
		status: 'CONFIRMED',
		color: 'bg-red-500',
		created: new Date(),
		lastModified: new Date()
	},
	{
		uid: 'event-3',
		summary: 'Vacation',
		description: 'Annual leave',
		dtstart: new Date(2026, 0, 22, 0, 0),
		dtend: new Date(2026, 0, 25, 23, 59),
		isAllDay: true,
		status: 'CONFIRMED',
		color: 'bg-green-500',
		created: new Date(),
		lastModified: new Date()
	},
	{
		uid: 'event-3.5',
		summary: 'Lunch with Client',
		location: 'Downtown Restaurant',
		dtstart: new Date(2026, 0, 17, 12, 0),
		dtend: new Date(2026, 0, 17, 13, 30),
		isAllDay: false,
		status: 'TENTATIVE',
		color: 'bg-orange-500',
		created: new Date(),
		lastModified: new Date()
	},
	{
		uid: 'event-5',
		summary: 'Code Review',
		dtstart: new Date(2026, 0, 16, 14, 0),
		dtend: new Date(2026, 0, 16, 15, 0),
		isAllDay: false,
		status: 'CONFIRMED',
		color: 'bg-purple-500',
		created: new Date(),
		lastModified: new Date()
	}
]

let localEvents = [...mockEvents]

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const createMockCalendarService = (): CalendarService => ({
	getEvents: async (_year: number, _month: number) => {
		await delay(300)
		return [...localEvents]
	},

	createEvent: async (eventData) => {
		await delay(200)
		const newEvent: CalendarEvent = {
			...eventData,
			uid: generateUid(),
			created: new Date(),
			lastModified: new Date()
		}
		localEvents = [...localEvents, newEvent]
		return newEvent
	},

	updateEvent: async (event) => {
		await delay(200)
		const updatedEvent = { ...event, lastModified: new Date() }
		localEvents = localEvents.map((e) => (e.uid === event.uid ? updatedEvent : e))
		return updatedEvent
	},

	deleteEvent: async (uid) => {
		await delay(200)
		localEvents = localEvents.filter((e) => e.uid !== uid)
	}
})

export const createApiCalendarService = (baseUrl: string): CalendarService => ({
	getEvents: async (year, month) => {
		const response = await fetch(`${baseUrl}/events?year=${year}&month=${month}`)
		if (!response.ok) throw new Error('Failed to fetch events')
		return response.json()
	},

	createEvent: async (eventData) => {
		const response = await fetch(`${baseUrl}/events`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(eventData)
		})
		if (!response.ok) throw new Error('Failed to create event')
		return response.json()
	},

	updateEvent: async (event) => {
		const response = await fetch(`${baseUrl}/events/${event.uid}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(event)
		})
		if (!response.ok) throw new Error('Failed to update event')
		return response.json()
	},

	deleteEvent: async (uid) => {
		const response = await fetch(`${baseUrl}/events/${uid}`, {
			method: 'DELETE'
		})
		if (!response.ok) throw new Error('Failed to delete event')
	}
})
