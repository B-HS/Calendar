import { describe, it, expect } from 'bun:test'
import { generateIcsUid, generateSubscriptionToken, getRecurrenceOccurrences, eventsToICS } from './ics'
import type { CalendarEvent, RecurrenceRule } from '@service/calendar'

describe('generateIcsUid', () => {
    it('should generate uid with @b-calendar suffix', () => {
        const uid = generateIcsUid()

        expect(uid).toContain('@b-calendar')
    })

    it('should generate unique uids', () => {
        const uid1 = generateIcsUid()
        const uid2 = generateIcsUid()

        expect(uid1).not.toBe(uid2)
    })
})

describe('generateSubscriptionToken', () => {
    it('should generate 64 character hex token', () => {
        const token = generateSubscriptionToken()

        expect(token).toHaveLength(64)
        expect(/^[0-9a-f]+$/.test(token)).toBe(true)
    })

    it('should generate unique tokens', () => {
        const token1 = generateSubscriptionToken()
        const token2 = generateSubscriptionToken()

        expect(token1).not.toBe(token2)
    })
})

describe('getRecurrenceOccurrences', () => {
    it('should return occurrences for daily rule', () => {
        const rrule: RecurrenceRule = { freq: 'DAILY', interval: 1 }
        const dtstart = new Date('2024-01-01T10:00:00')
        const rangeStart = new Date('2024-01-01')
        const rangeEnd = new Date('2024-01-05T23:59:59')

        const occurrences = getRecurrenceOccurrences(rrule, dtstart, rangeStart, rangeEnd)

        expect(occurrences.length).toBeGreaterThanOrEqual(4)
    })

    it('should return occurrences for weekly rule', () => {
        const rrule: RecurrenceRule = { freq: 'WEEKLY', interval: 1 }
        const dtstart = new Date('2024-01-01T10:00:00')
        const rangeStart = new Date('2024-01-01')
        const rangeEnd = new Date('2024-01-31T23:59:59')

        const occurrences = getRecurrenceOccurrences(rrule, dtstart, rangeStart, rangeEnd)

        expect(occurrences.length).toBeGreaterThanOrEqual(4)
    })

    it('should respect count limit', () => {
        const rrule: RecurrenceRule = { freq: 'DAILY', interval: 1, count: 3 }
        const dtstart = new Date('2024-01-01T10:00:00')
        const rangeStart = new Date('2024-01-01')
        const rangeEnd = new Date('2024-12-31T23:59:59')

        const occurrences = getRecurrenceOccurrences(rrule, dtstart, rangeStart, rangeEnd)

        expect(occurrences).toHaveLength(3)
    })

    it('should respect until date', () => {
        const rrule: RecurrenceRule = {
            freq: 'DAILY',
            interval: 1,
            until: new Date('2024-01-03T23:59:59'),
        }
        const dtstart = new Date('2024-01-01T10:00:00')
        const rangeStart = new Date('2024-01-01')
        const rangeEnd = new Date('2024-12-31T23:59:59')

        const occurrences = getRecurrenceOccurrences(rrule, dtstart, rangeStart, rangeEnd)

        expect(occurrences.length).toBeLessThanOrEqual(3)
    })
})

describe('eventsToICS', () => {
    it('should generate valid ICS format', () => {
        const events: CalendarEvent[] = [
            {
                uid: 'test-uid@b-calendar',
                summary: 'Test Event',
                dtstart: new Date('2024-01-15T10:00:00'),
                dtend: new Date('2024-01-15T11:00:00'),
                isAllDay: false,
            },
        ]

        const ics = eventsToICS(events, 'Test Calendar', 'test.com', 'Asia/Seoul')

        expect(ics).toContain('BEGIN:VCALENDAR')
        expect(ics).toContain('END:VCALENDAR')
        expect(ics).toContain('BEGIN:VEVENT')
        expect(ics).toContain('END:VEVENT')
        expect(ics).toContain('UID:test-uid@b-calendar')
        expect(ics).toContain('SUMMARY:Test Event')
    })

    it('should handle all-day events', () => {
        const events: CalendarEvent[] = [
            {
                uid: 'test-uid@b-calendar',
                summary: 'All Day Event',
                dtstart: new Date('2024-01-15'),
                dtend: new Date('2024-01-16'),
                isAllDay: true,
            },
        ]

        const ics = eventsToICS(events, 'Test Calendar', 'test.com', 'Asia/Seoul')

        expect(ics).toContain('DTSTART;VALUE=DATE:')
        expect(ics).toContain('DTEND;VALUE=DATE:')
    })

    it('should include optional fields when provided', () => {
        const events: CalendarEvent[] = [
            {
                uid: 'test-uid@b-calendar',
                summary: 'Full Event',
                description: 'Test Description',
                location: 'Test Location',
                dtstart: new Date('2024-01-15T10:00:00'),
                dtend: new Date('2024-01-15T11:00:00'),
                isAllDay: false,
                status: 'CONFIRMED',
                transp: 'OPAQUE',
                priority: 5,
                categories: ['work', 'important'],
            },
        ]

        const ics = eventsToICS(events, 'Test Calendar', 'test.com', 'Asia/Seoul')

        expect(ics).toContain('DESCRIPTION:Test Description')
        expect(ics).toContain('LOCATION:Test Location')
        expect(ics).toContain('STATUS:CONFIRMED')
        expect(ics).toContain('TRANSP:OPAQUE')
        expect(ics).toContain('PRIORITY:5')
        expect(ics).toContain('CATEGORIES:work,important')
    })

    it('should include rrule when provided', () => {
        const events: CalendarEvent[] = [
            {
                uid: 'test-uid@b-calendar',
                summary: 'Recurring Event',
                dtstart: new Date('2024-01-15T10:00:00'),
                dtend: new Date('2024-01-15T11:00:00'),
                isAllDay: false,
                rrule: {
                    freq: 'WEEKLY',
                    interval: 2,
                    byDay: ['MO', 'WE', 'FR'],
                },
            },
        ]

        const ics = eventsToICS(events, 'Test Calendar', 'test.com', 'Asia/Seoul')

        expect(ics).toContain('RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR')
    })

    it('should escape special characters', () => {
        const events: CalendarEvent[] = [
            {
                uid: 'test-uid@b-calendar',
                summary: 'Event; with, special\\chars',
                description: 'Line1\nLine2',
                dtstart: new Date('2024-01-15T10:00:00'),
                dtend: new Date('2024-01-15T11:00:00'),
                isAllDay: false,
            },
        ]

        const ics = eventsToICS(events, 'Test Calendar', 'test.com', 'Asia/Seoul')

        expect(ics).toContain('Event\\; with\\, special\\\\chars')
        expect(ics).toContain('Line1\\nLine2')
    })

    it('should handle empty events array', () => {
        const ics = eventsToICS([], 'Empty Calendar', 'test.com', 'Asia/Seoul')

        expect(ics).toContain('BEGIN:VCALENDAR')
        expect(ics).toContain('END:VCALENDAR')
        expect(ics).not.toContain('BEGIN:VEVENT')
    })
})
