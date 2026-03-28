import dayjs from 'dayjs'

import { DATE_FORMAT } from '@/shared/constant/date'
import { WEEKS_IN_GRID, DAYS_IN_WEEK, MAX_VISIBLE_LANES } from '@/shared/constant/calendar'
import type { CalendarEvent, EventLayout, WeekRow } from '@/entities/calendar/types'

export const formatDate = (date: Date): string => dayjs(date).format(DATE_FORMAT)
export const parseDate = (str: string): Date => dayjs(str).toDate()
export const isSameDay = (a: Date, b: Date): boolean => dayjs(a).isSame(b, 'day')
export const isToday = (date: Date): boolean => dayjs(date).isSame(dayjs(), 'day')
export const isSameMonth = (date: Date, referenceDate: Date): boolean => dayjs(date).isSame(referenceDate, 'month')
export const addMonths = (date: Date, count: number): Date => dayjs(date).add(count, 'month').toDate()
export const generateId = (): string => crypto.randomUUID()

export const getMonthDays = (year: number, month: number): Date[][] => {
    const firstDay = dayjs().year(year).month(month).startOf('month')
    const startOfGrid = firstDay.startOf('week')

    const weeks: Date[][] = []
    let current = startOfGrid

    for (let w = 0; w < WEEKS_IN_GRID; w++) {
        const week: Date[] = []
        for (let d = 0; d < DAYS_IN_WEEK; d++) {
            week.push(current.toDate())
            current = current.add(1, 'day')
        }
        weeks.push(week)
    }

    return weeks
}

export const computeWeekLayouts = (weekDays: Date[], events: CalendarEvent[]): WeekRow => {
    const weekStart = dayjs(weekDays[0])
    const weekEnd = dayjs(weekDays[6])

    const relevant = events
        .filter((e) => {
            const eStart = dayjs(e.startDate)
            const eEnd = dayjs(e.endDate)
            return eStart.isBefore(weekEnd.add(1, 'day')) && eEnd.isAfter(weekStart.subtract(1, 'day'))
        })
        .sort((a, b) => {
            const diff = dayjs(a.startDate).diff(dayjs(b.startDate))
            if (diff !== 0) return diff
            const aDuration = dayjs(a.endDate).diff(dayjs(a.startDate))
            const bDuration = dayjs(b.endDate).diff(dayjs(b.startDate))
            return bDuration - aDuration
        })

    const lanes: { eventId: string; startCol: number; endCol: number }[][] = []
    const layouts: EventLayout[] = []
    const overflowByDay: Record<number, CalendarEvent[]> = {}

    for (const event of relevant) {
        const eStart = dayjs(event.startDate)
        const eEnd = dayjs(event.endDate)

        const startCol = Math.max(0, eStart.diff(weekStart, 'day'))
        const endCol = Math.min(6, eEnd.diff(weekStart, 'day'))
        const span = endCol - startCol + 1
        const isStart = eStart.isSame(weekStart, 'day') || eStart.isAfter(weekStart)
        const isEnd = eEnd.isSame(weekEnd, 'day') || eEnd.isBefore(weekEnd)

        let assignedLane = -1
        for (let l = 0; l < lanes.length; l++) {
            const occupied = lanes[l].some((slot) => !(endCol < slot.startCol || startCol > slot.endCol))
            if (!occupied) {
                assignedLane = l
                break
            }
        }

        if (assignedLane === -1) {
            assignedLane = lanes.length
            lanes.push([])
        }

        lanes[assignedLane].push({ eventId: event.id, startCol, endCol })

        if (assignedLane < MAX_VISIBLE_LANES) {
            layouts.push({ event, lane: assignedLane, startCol, span, isStart, isEnd })
        } else {
            for (let col = startCol; col <= endCol; col++) {
                if (!overflowByDay[col]) overflowByDay[col] = []
                overflowByDay[col].push(event)
            }
        }
    }

    for (const col of Object.keys(overflowByDay).map(Number)) {
        const bumped = layouts.filter((l) => l.lane === MAX_VISIBLE_LANES - 1 && col >= l.startCol && col < l.startCol + l.span)
        for (const layout of bumped) {
            for (let c = layout.startCol; c < layout.startCol + layout.span; c++) {
                if (!overflowByDay[c]) overflowByDay[c] = []
                overflowByDay[c].push(layout.event)
            }
        }
    }
    const bumpedIds = new Set<string>()
    for (const evts of Object.values(overflowByDay)) {
        for (const ev of evts) bumpedIds.add(ev.id)
    }
    const finalLayouts = layouts.filter((l) => !bumpedIds.has(l.event.id) || l.lane < MAX_VISIBLE_LANES - 1)

    return { days: weekDays, layouts: finalLayouts, overflowByDay }
}
