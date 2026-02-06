export interface RRule {
	freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
	interval?: number
	count?: number
	until?: string
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
	rrule?: RRule
	exdate?: string[]
	status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED'
	transp?: 'TRANSPARENT' | 'OPAQUE'
	priority?: number
	categories?: string[]
	color?: string
	sequence?: number
	created?: Date
	lastModified?: Date
}

export interface CalendarEventResponse {
	uid: string
	summary: string
	description?: string
	location?: string
	dtstart: string
	dtend: string
	isAllDay: boolean
	rrule?: RRule
	exdate?: string[]
	status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED'
	transp?: 'TRANSPARENT' | 'OPAQUE'
	priority?: number
	categories?: string[]
	color?: string
	sequence?: number
	created?: string
	lastModified?: string
}

export interface CreateEventInput {
	summary: string
	description?: string
	location?: string
	dtstart: string
	dtend: string
	isAllDay?: boolean
	rrule?: RRule
	exdate?: string[]
	status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED'
	transp?: 'TRANSPARENT' | 'OPAQUE'
	priority?: number
	categories?: string[]
	color?: string
}

export interface UpdateEventInput {
	summary?: string
	description?: string | null
	location?: string | null
	dtstart?: string
	dtend?: string
	isAllDay?: boolean
	rrule?: RRule | null
	exdate?: string[] | null
	status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED' | null
	transp?: 'TRANSPARENT' | 'OPAQUE' | null
	priority?: number | null
	categories?: string[] | null
	color?: string | null
}

export interface MonthQuery {
	year: number
	month: number
}
