import dayjs, { type Dayjs } from 'dayjs'
import type { CalendarDay, CalendarEvent, EventPosition, MonthData } from './types'
import { getTranslations, type Locale } from './i18n'

export const isSameDay = (date1: Date | Dayjs, date2: Date | Dayjs) =>
	dayjs(date1).isSame(dayjs(date2), 'day')

export const isDateInRange = (date: Date | Dayjs, start: Date | Dayjs, end: Date | Dayjs) => {
	const d = dayjs(date).startOf('day')
	const s = dayjs(start).startOf('day')
	const e = dayjs(end).startOf('day')
	return (d.isSame(s) || d.isAfter(s)) && (d.isSame(e) || d.isBefore(e))
}

export const getDaysBetween = (start: Date | Dayjs, end: Date | Dayjs) =>
	dayjs(end).startOf('day').diff(dayjs(start).startOf('day'), 'day')

export const addDays = (date: Date | Dayjs, days: number) => dayjs(date).add(days, 'day').toDate()

export const getMonthData = (year: number, month: number): MonthData => {
	const firstDay = dayjs().year(year).month(month).startOf('month')
	const lastDay = firstDay.endOf('month')
	const today = dayjs()

	const startDate = firstDay.startOf('week')
	const weeks: CalendarDay[][] = []
	let currentDate = startDate

	while (currentDate.isBefore(lastDay) || currentDate.isSame(lastDay, 'day') || weeks.length < 6) {
		const week: CalendarDay[] = []
		for (let i = 0; i < 7; i++) {
			week.push({
				date: currentDate.toDate(),
				isCurrentMonth: currentDate.month() === month,
				isToday: currentDate.isSame(today, 'day'),
				isWeekend: currentDate.day() === 0 || currentDate.day() === 6,
				events: []
			})
			currentDate = currentDate.add(1, 'day')
		}
		weeks.push(week)
		if (weeks.length >= 6) break
	}

	return { year, month, weeks }
}

const getEventDisplayDates = (event: CalendarEvent) => {
	if (event.isAllDay) {
		const start = new Date(event.dtstart)
		const end = new Date(event.dtend)
		const startStr = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`
		const endMinusOne = new Date(end.getTime() - 24 * 60 * 60 * 1000)
		const endStr = `${endMinusOne.getUTCFullYear()}-${String(endMinusOne.getUTCMonth() + 1).padStart(2, '0')}-${String(endMinusOne.getUTCDate()).padStart(2, '0')}`
		return {
			start: dayjs(startStr).startOf('day'),
			end: dayjs(endStr).startOf('day')
		}
	}
	return {
		start: dayjs(event.dtstart).startOf('day'),
		end: dayjs(event.dtend).startOf('day')
	}
}

export const assignEventsToWeek = (
	week: CalendarDay[],
	events: CalendarEvent[]
): Map<string, EventPosition[]> => {
	const eventPositions = new Map<string, EventPosition[]>()
	const rowOccupancy: boolean[][] = []

	const weekStart = dayjs(week[0].date)
	const weekEnd = dayjs(week[6].date)

	const relevantEvents = events
		.filter((event) => {
			const { start: eventStart, end: eventEnd } = getEventDisplayDates(event)
			return (
				(eventStart.isBefore(weekEnd) || eventStart.isSame(weekEnd, 'day')) &&
				(eventEnd.isAfter(weekStart) || eventEnd.isSame(weekStart, 'day'))
			)
		})
		.sort((a, b) => {
			const { start: startA, end: endA } = getEventDisplayDates(a)
			const { start: startB, end: endB } = getEventDisplayDates(b)
			const durationA = endA.diff(startA, 'day')
			const durationB = endB.diff(startB, 'day')
			if (durationB !== durationA) return durationB - durationA
			return startA.valueOf() - startB.valueOf()
		})

	for (const event of relevantEvents) {
		const { start: eventStart, end: eventEnd } = getEventDisplayDates(event)

		const startCol = Math.max(0, getDaysBetween(weekStart, eventStart))
		const endCol = Math.min(6, getDaysBetween(weekStart, eventEnd))
		const span = endCol - startCol + 1

		const isStart = eventStart.isSame(weekStart, 'day') || eventStart.isAfter(weekStart)
		const isEnd = eventEnd.isSame(weekEnd, 'day') || eventEnd.isBefore(weekEnd)

		let row = 0
		while (true) {
			if (!rowOccupancy[row]) rowOccupancy[row] = new Array(7).fill(false)
			let canPlace = true
			for (let col = startCol; col <= endCol; col++) {
				if (rowOccupancy[row][col]) {
					canPlace = false
					break
				}
			}
			if (canPlace) {
				for (let col = startCol; col <= endCol; col++) {
					rowOccupancy[row][col] = true
				}
				break
			}
			row++
		}

		const positions = eventPositions.get(event.uid) || []
		positions.push({ row, startCol, span, isStart, isEnd })
		eventPositions.set(event.uid, positions)
	}

	return eventPositions
}

export const formatTime = (date: Date | Dayjs, locale: Locale = 'ko') => {
	const d = dayjs(date)
	const t = getTranslations(locale)
	const hours = d.hour()
	const minutes = d.minute()
	const period = hours >= 12 ? t.pm : t.am
	const displayHours = hours % 12 || 12

	if (locale === 'en') {
		return minutes === 0 ? `${displayHours} ${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
	}

	return minutes === 0
		? `${period} ${displayHours}${t.hour}`
		: `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`
}

export const formatDateRange = (
	start: Date | Dayjs,
	end: Date | Dayjs,
	isAllDay: boolean,
	locale: Locale = 'ko'
) => {
	const t = getTranslations(locale)

	if (isAllDay) {
		const startDate = new Date(dayjs(start).valueOf())
		const endDate = new Date(dayjs(end).valueOf())
		const startStr = `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, '0')}-${String(startDate.getUTCDate()).padStart(2, '0')}`
		const endMinusOne = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
		const endStr = `${endMinusOne.getUTCFullYear()}-${String(endMinusOne.getUTCMonth() + 1).padStart(2, '0')}-${String(endMinusOne.getUTCDate()).padStart(2, '0')}`
		const s = dayjs(startStr)
		const e = dayjs(endStr)

		if (s.isSame(e, 'day')) {
			return `${t.months.short[s.month()]} ${s.date()}`
		}
		return `${t.months.short[s.month()]} ${s.date()} - ${t.months.short[e.month()]} ${e.date()}`
	}

	const s = dayjs(start)
	const e = dayjs(end)

	if (s.isSame(e, 'day')) {
		return `${t.months.short[s.month()]} ${s.date()} ${formatTime(s, locale)} - ${formatTime(e, locale)}`
	}
	return `${t.months.short[s.month()]} ${s.date()} ${formatTime(s, locale)} - ${t.months.short[e.month()]} ${e.date()} ${formatTime(e, locale)}`
}

export const formatDayHeader = (day: CalendarDay, locale: Locale = 'ko') => {
	const d = dayjs(day.date)
	const t = getTranslations(locale)
	return `${t.months.short[d.month()]} ${d.date()} ${t.weekdays.long[d.day()]}`
}

export const moveEvent = (event: CalendarEvent, newStartDate: Date): CalendarEvent => {
	const duration = dayjs(event.dtend).diff(dayjs(event.dtstart))
	let newStart = dayjs(newStartDate)
	if (!event.isAllDay) {
		newStart = newStart.hour(dayjs(event.dtstart).hour()).minute(dayjs(event.dtstart).minute())
	}
	const newEnd = newStart.add(duration)
	return { ...event, dtstart: newStart.toDate(), dtend: newEnd.toDate() }
}

export const resizeEvent = (
	event: CalendarEvent,
	edge: 'start' | 'end',
	dayOffset: number
): CalendarEvent => {
	if (dayOffset === 0) return event

	const originalStart = dayjs(event.dtstart)
	const originalEnd = dayjs(event.dtend)

	if (edge === 'start') {
		let newStart = originalStart.add(dayOffset, 'day')
		if (!event.isAllDay) {
			newStart = newStart.hour(originalStart.hour()).minute(originalStart.minute())
		}
		if (newStart.isAfter(originalEnd) || newStart.isSame(originalEnd, 'day') && !event.isAllDay) {
			newStart = event.isAllDay ? originalEnd : originalEnd.subtract(1, 'hour')
		}
		return { ...event, dtstart: newStart.toDate() }
	} else {
		let newEnd = originalEnd.add(dayOffset, 'day')
		if (!event.isAllDay) {
			newEnd = newEnd.hour(originalEnd.hour()).minute(originalEnd.minute())
		}
		if (newEnd.isBefore(originalStart) || newEnd.isSame(originalStart, 'day') && !event.isAllDay) {
			newEnd = event.isAllDay ? originalStart : originalStart.add(1, 'hour')
		}
		return { ...event, dtend: newEnd.toDate() }
	}
}

export const generateEventColor = (seed: string) => {
	const colors = [
		'bg-red-500',
		'bg-orange-500',
		'bg-amber-500',
		'bg-yellow-500',
		'bg-lime-500',
		'bg-green-500',
		'bg-emerald-500',
		'bg-teal-500',
		'bg-cyan-500',
		'bg-sky-500',
		'bg-blue-500',
		'bg-indigo-500',
		'bg-violet-500',
		'bg-purple-500',
		'bg-fuchsia-500',
		'bg-pink-500',
		'bg-rose-500'
	]
	let hash = 0
	for (let i = 0; i < seed.length; i++) {
		hash = seed.charCodeAt(i) + ((hash << 5) - hash)
	}
	return colors[Math.abs(hash) % colors.length]
}
