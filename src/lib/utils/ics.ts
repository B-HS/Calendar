import pkg from 'rrule'
const { RRule } = pkg
import dayjs from 'dayjs'
import type { CalendarEvent, RecurrenceRule } from '$widgets/calendar'

const CRLF = '\r\n'
const MAX_LINE_LENGTH = 75

const FREQ_MAP: Record<string, number> = {
    DAILY: RRule.DAILY,
    WEEKLY: RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
    YEARLY: RRule.YEARLY,
}

const WEEKDAY_MAP = {
    MO: RRule.MO,
    TU: RRule.TU,
    WE: RRule.WE,
    TH: RRule.TH,
    FR: RRule.FR,
    SA: RRule.SA,
    SU: RRule.SU,
} as const

const formatDateTimeUTC = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return (
        date.getUTCFullYear().toString() +
        pad(date.getUTCMonth() + 1) +
        pad(date.getUTCDate()) +
        'T' +
        pad(date.getUTCHours()) +
        pad(date.getUTCMinutes()) +
        pad(date.getUTCSeconds()) +
        'Z'
    )
}


const foldLine = (line: string): string => {
    if (line.length <= MAX_LINE_LENGTH) return line

    const result: string[] = []
    let remaining = line

    while (remaining.length > MAX_LINE_LENGTH) {
        result.push(remaining.slice(0, MAX_LINE_LENGTH))
        remaining = ' ' + remaining.slice(MAX_LINE_LENGTH)
    }

    if (remaining) result.push(remaining)

    return result.join(CRLF)
}

const escapeText = (text: string) =>
    text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

export const recurrenceRuleToRRule = (rrule: RecurrenceRule, dtstart: Date): typeof RRule.prototype =>
    new RRule({
        freq: FREQ_MAP[rrule.freq],
        interval: rrule.interval,
        count: rrule.count,
        until: rrule.until,
        byweekday: rrule.byDay?.map((day) => WEEKDAY_MAP[day as keyof typeof WEEKDAY_MAP]).filter(Boolean),
        bymonth: rrule.byMonth,
        bymonthday: rrule.byMonthDay,
        dtstart,
    })

const formatRRule = (rrule: RecurrenceRule, dtstart: Date): string => {
    const rule = recurrenceRuleToRRule(rrule, dtstart)
    const str = rule.toString()
    const rruleLine = str.split('\n').find((line) => line.startsWith('RRULE:'))
    return rruleLine ? rruleLine.replace('RRULE:', '') : ''
}

export const eventToVEvent = (event: CalendarEvent, domain: string): string => {
    const lines: string[] = []

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.uid}@${domain}`)
    lines.push(`DTSTAMP:${formatDateTimeUTC(event.lastModified ?? new Date())}`)

    if (event.isAllDay) {
        const startDate = dayjs(event.dtstart).startOf('day')
        const endDate = dayjs(event.dtend).startOf('day')
        const dtendExclusive = endDate.add(1, 'day')
        lines.push(`DTSTART;VALUE=DATE:${startDate.format('YYYYMMDD')}`)
        lines.push(`DTEND;VALUE=DATE:${dtendExclusive.format('YYYYMMDD')}`)
    } else {
        lines.push(`DTSTART:${formatDateTimeUTC(event.dtstart)}`)
        lines.push(`DTEND:${formatDateTimeUTC(event.dtend)}`)
    }

    lines.push(`SUMMARY:${escapeText(event.summary)}`)

    if (event.description) {
        lines.push(`DESCRIPTION:${escapeText(event.description)}`)
    }

    if (event.location) {
        lines.push(`LOCATION:${escapeText(event.location)}`)
    }

    if (event.status) {
        lines.push(`STATUS:${event.status}`)
    }

    if (event.transp) {
        lines.push(`TRANSP:${event.transp}`)
    }

    if (event.priority !== undefined && event.priority >= 0 && event.priority <= 9) {
        lines.push(`PRIORITY:${event.priority}`)
    }

    if (event.categories && event.categories.length > 0) {
        lines.push(`CATEGORIES:${event.categories.map(escapeText).join(',')}`)
    }

    if (event.rrule) {
        lines.push(`RRULE:${formatRRule(event.rrule, event.dtstart)}`)
    }

    if (event.color) {
        lines.push(`X-APPLE-CALENDAR-COLOR:${event.color}`)
    }

    if (event.created) {
        lines.push(`CREATED:${formatDateTimeUTC(event.created)}`)
    }

    if (event.lastModified) {
        lines.push(`LAST-MODIFIED:${formatDateTimeUTC(event.lastModified)}`)
    }

    lines.push('END:VEVENT')

    return lines.map(foldLine).join(CRLF)
}

export const eventsToICS = (events: CalendarEvent[], calendarName: string, domain: string): string => {
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:-//${domain}//Global Calendar//EN`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeText(calendarName)}`,
    ]

    for (const event of events) {
        lines.push(eventToVEvent(event, domain))
    }

    lines.push('END:VCALENDAR')

    return lines.join(CRLF)
}

export const generateIcsUid = () => crypto.randomUUID()

export const generateSubscriptionToken = () => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

export const getRecurrenceOccurrences = (rrule: RecurrenceRule, dtstart: Date, rangeStart: Date, rangeEnd: Date): Date[] => {
    const rule = recurrenceRuleToRRule(rrule, dtstart)
    return rule.between(rangeStart, rangeEnd, true)
}

export const parseRRuleString = (rruleString: string): RecurrenceRule | null => {
    try {
        const rule = RRule.fromString(rruleString)
        const options = rule.options

        const FREQ_REVERSE: Record<number, RecurrenceRule['freq']> = {
            [RRule.DAILY]: 'DAILY',
            [RRule.WEEKLY]: 'WEEKLY',
            [RRule.MONTHLY]: 'MONTHLY',
            [RRule.YEARLY]: 'YEARLY',
        }

        const WEEKDAY_REVERSE: Record<number, string> = {
            0: 'MO',
            1: 'TU',
            2: 'WE',
            3: 'TH',
            4: 'FR',
            5: 'SA',
            6: 'SU',
        }

        return {
            freq: FREQ_REVERSE[options.freq],
            interval: options.interval,
            count: options.count ?? undefined,
            until: options.until ?? undefined,
            byDay: options.byweekday?.map((w) => (typeof w === 'number' ? WEEKDAY_REVERSE[w] : WEEKDAY_REVERSE[(w as { weekday: number }).weekday])),
            byMonth: options.bymonth ?? undefined,
            byMonthDay: options.bymonthday ?? undefined,
        }
    } catch {
        return null
    }
}
