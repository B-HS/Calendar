import pkg from 'rrule'
const { RRule } = pkg
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

const pad = (n: number) => n.toString().padStart(2, '0')

const getDatePartsInTimezone = (date: Date, timezone: string) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
    const parts = formatter.formatToParts(date)
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
    return {
        year: Number(get('year')),
        month: Number(get('month')),
        day: Number(get('day')),
        hour: Number(get('hour')),
        minute: Number(get('minute')),
        second: Number(get('second')),
    }
}

const formatDateOnly = (date: Date, timezone: string) => {
    const p = getDatePartsInTimezone(date, timezone)
    return `${p.year}${pad(p.month)}${pad(p.day)}`
}

const formatDateTimeLocal = (date: Date, timezone: string) => {
    const p = getDatePartsInTimezone(date, timezone)
    return `${p.year}${pad(p.month)}${pad(p.day)}T${pad(p.hour)}${pad(p.minute)}${pad(p.second)}`
}

const formatDateTimeUTC = (date: Date) => {
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

const generateVTimezone = (timezone: string): string => {
    const lines: string[] = []
    lines.push('BEGIN:VTIMEZONE')
    lines.push(`TZID:${timezone}`)
    lines.push('BEGIN:STANDARD')
    lines.push('DTSTART:19700101T000000')
    lines.push(`TZNAME:${timezone}`)

    const now = new Date()

    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' })
    const parts = formatter.formatToParts(now)
    const offsetStr = parts.find(p => p.type === 'timeZoneName')?.value ?? '+0000'

    const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/)
    let offsetFormatted = '+0000'
    if (match) {
        const sign = match[1]
        const hours = match[2].padStart(2, '0')
        const minutes = match[3] ?? '00'
        offsetFormatted = `${sign}${hours}${minutes}`
    }

    lines.push(`TZOFFSETFROM:${offsetFormatted}`)
    lines.push(`TZOFFSETTO:${offsetFormatted}`)
    lines.push('END:STANDARD')
    lines.push('END:VTIMEZONE')

    return lines.join(CRLF)
}

export const eventToVEvent = (event: CalendarEvent, domain: string, timezone: string): string => {
    const lines: string[] = []

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.uid}@${domain}`)
    lines.push(`DTSTAMP:${formatDateTimeUTC(event.lastModified ?? new Date())}`)

    if (event.isAllDay) {
        const startDateStr = formatDateOnly(event.dtstart, timezone)
        const endParts = getDatePartsInTimezone(event.dtend, timezone)
        const endDateObj = new Date(Date.UTC(endParts.year, endParts.month - 1, endParts.day + 1))
        const endDateStr = `${endDateObj.getUTCFullYear()}${pad(endDateObj.getUTCMonth() + 1)}${pad(endDateObj.getUTCDate())}`

        lines.push(`DTSTART;VALUE=DATE:${startDateStr}`)
        lines.push(`DTEND;VALUE=DATE:${endDateStr}`)
    } else {
        lines.push(`DTSTART;TZID=${timezone}:${formatDateTimeLocal(event.dtstart, timezone)}`)
        lines.push(`DTEND;TZID=${timezone}:${formatDateTimeLocal(event.dtend, timezone)}`)
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

export const eventsToICS = (events: CalendarEvent[], calendarName: string, domain: string, timezone: string): string => {
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:-//${domain}//Global Calendar//EN`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeText(calendarName)}`,
        `X-WR-TIMEZONE:${timezone}`,
    ]

    const hasTimedEvents = events.some((e) => !e.isAllDay)
    if (hasTimedEvents) {
        lines.push(generateVTimezone(timezone))
    }

    for (const event of events) {
        lines.push(eventToVEvent(event, domain, timezone))
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
