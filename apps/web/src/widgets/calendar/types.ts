export type EventStatus = 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED'

export type EventTransparency = 'TRANSPARENT' | 'OPAQUE'

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurrenceRule {
	freq: RecurrenceFrequency
	interval?: number
	count?: number
	until?: Date
	byDay?: string[]
	byMonth?: number[]
	byMonthDay?: number[]
}

export interface CalendarEvent {
	uid: string
	summary: string
	description?: string
	location?: string
	dtstart: Date
	dtend: Date
	isAllDay: boolean
	rrule?: RecurrenceRule
	categories?: string[]
	priority?: number
	status?: EventStatus
	transp?: EventTransparency
	color?: string
	created?: Date
	lastModified?: Date
}

export interface CalendarDay {
	date: Date
	isCurrentMonth: boolean
	isToday: boolean
	isWeekend: boolean
	events: CalendarEvent[]
}

export interface DraggedEvent {
	event: CalendarEvent
	sourceDate: Date
	offsetDays: number
}

export interface EventPosition {
	row: number
	startCol: number
	span: number
	isStart: boolean
	isEnd: boolean
}

export interface MonthData {
	year: number
	month: number
	weeks: CalendarDay[][]
}

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

export const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
