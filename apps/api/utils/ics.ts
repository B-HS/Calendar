import { RRule, Frequency } from 'rrule'
import type { RecurrenceRule, CalendarEvent } from '@service/calendar'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export const generateIcsUid = () => `${crypto.randomUUID()}@b-calendar`

export const generateSubscriptionToken = () => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const freqMap: Record<string, Frequency> = {
    DAILY: RRule.DAILY,
    WEEKLY: RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
    YEARLY: RRule.YEARLY,
}

export const getRecurrenceOccurrences = (rrule: RecurrenceRule, dtstart: Date, rangeStart: Date, rangeEnd: Date): Date[] => {
    const rule = new RRule({
        freq: freqMap[rrule.freq],
        interval: rrule.interval ?? 1,
        count: rrule.count,
        until: rrule.until,
        byweekday: rrule.byDay?.map((day) => {
            const dayMap: Record<string, number> = { SU: 6, MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5 }
            return dayMap[day]
        }),
        bymonth: rrule.byMonth,
        bymonthday: rrule.byMonthDay,
        dtstart,
    })

    return rule.between(rangeStart, rangeEnd, true)
}

const formatDateTimeICS = (date: Date, isAllDay: boolean, tz?: string) => {
    if (isAllDay) {
        const year = date.getUTCFullYear()
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const day = String(date.getUTCDate()).padStart(2, '0')
        return `${year}${month}${day}`
    }

    if (tz) {
        const d = dayjs.utc(date).tz(tz)
        return `${d.year()}${String(d.month() + 1).padStart(2, '0')}${String(d.date()).padStart(2, '0')}T${String(d.hour()).padStart(2, '0')}${String(d.minute()).padStart(2, '0')}${String(d.second()).padStart(2, '0')}`
    }

    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const seconds = String(date.getUTCSeconds()).padStart(2, '0')
    return `${year}${month}${day}T${hours}${minutes}${seconds}`
}

const escapeICSText = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

const formatRRule = (rrule: RecurrenceRule): string => {
    const parts = [`FREQ=${rrule.freq}`]
    if (rrule.interval && rrule.interval > 1) parts.push(`INTERVAL=${rrule.interval}`)
    if (rrule.count) parts.push(`COUNT=${rrule.count}`)
    if (rrule.until) parts.push(`UNTIL=${formatDateTimeICS(rrule.until, false)}Z`)
    if (rrule.byDay?.length) parts.push(`BYDAY=${rrule.byDay.join(',')}`)
    if (rrule.byMonth?.length) parts.push(`BYMONTH=${rrule.byMonth.join(',')}`)
    if (rrule.byMonthDay?.length) parts.push(`BYMONTHDAY=${rrule.byMonthDay.join(',')}`)
    return parts.join(';')
}

export const eventsToICS = (events: CalendarEvent[], calendarName: string, domain: string, timezone: string): string => {
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:-//${domain}//B-Calendar//EN`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeICSText(calendarName)}`,
        `X-WR-TIMEZONE:${timezone}`,
    ]

    for (const event of events) {
        lines.push('BEGIN:VEVENT')
        lines.push(`UID:${event.uid}`)

        if (event.isAllDay) {
            lines.push(`DTSTART;VALUE=DATE:${formatDateTimeICS(event.dtstart, true)}`)
            lines.push(`DTEND;VALUE=DATE:${formatDateTimeICS(event.dtend, true)}`)
        } else {
            lines.push(`DTSTART;TZID=${timezone}:${formatDateTimeICS(event.dtstart, false, timezone)}`)
            lines.push(`DTEND;TZID=${timezone}:${formatDateTimeICS(event.dtend, false, timezone)}`)
        }

        lines.push(`SUMMARY:${escapeICSText(event.summary)}`)

        if (event.description) {
            lines.push(`DESCRIPTION:${escapeICSText(event.description)}`)
        }

        if (event.location) {
            lines.push(`LOCATION:${escapeICSText(event.location)}`)
        }

        if (event.rrule) {
            lines.push(`RRULE:${formatRRule(event.rrule)}`)
        }

        if (event.exdate?.length) {
            for (const exdate of event.exdate) {
                lines.push(`EXDATE:${exdate}`)
            }
        }

        if (event.sequence !== undefined) {
            lines.push(`SEQUENCE:${event.sequence}`)
        }

        if (event.status) {
            lines.push(`STATUS:${event.status}`)
        }

        if (event.transp) {
            lines.push(`TRANSP:${event.transp}`)
        }

        if (event.priority !== undefined) {
            lines.push(`PRIORITY:${event.priority}`)
        }

        if (event.categories?.length) {
            lines.push(`CATEGORIES:${event.categories.map(escapeICSText).join(',')}`)
        }

        if (event.created) {
            lines.push(`CREATED:${formatDateTimeICS(event.created, false)}Z`)
        }

        if (event.lastModified) {
            lines.push(`LAST-MODIFIED:${formatDateTimeICS(event.lastModified, false)}Z`)
        }

        lines.push(`DTSTAMP:${formatDateTimeICS(new Date(), false)}Z`)
        lines.push('END:VEVENT')
    }

    lines.push('END:VCALENDAR')
    return lines.join('\r\n')
}
