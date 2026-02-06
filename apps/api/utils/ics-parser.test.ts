import { describe, it, expect } from 'bun:test'
import { parseICS, extractUidFromICS } from './ics-parser'

describe('parseICS', () => {
    it('should parse basic VEVENT', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:test-uid-123@example.com
DTSTAMP:20240115T100000Z
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Test Event
END:VEVENT
END:VCALENDAR`

        const result = parseICS(ics)

        expect(result).not.toBeNull()
        expect(result?.uid).toBe('test-uid-123@example.com')
        expect(result?.summary).toBe('Test Event')
        expect(result?.isAllDay).toBe(false)
    })

    it('should parse all-day event', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:allday-123@example.com
DTSTAMP:20240115T100000Z
DTSTART;VALUE=DATE:20240115
DTEND;VALUE=DATE:20240116
SUMMARY:All Day Event
END:VEVENT
END:VCALENDAR`

        const result = parseICS(ics)

        expect(result).not.toBeNull()
        expect(result?.isAllDay).toBe(true)
        expect(result?.dtstart.getFullYear()).toBe(2024)
        expect(result?.dtstart.getMonth()).toBe(0)
        expect(result?.dtstart.getDate()).toBe(15)
    })

    it('should parse event with RRULE', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:recurring-123@example.com
DTSTAMP:20240115T100000Z
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Recurring Event
RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR
END:VEVENT
END:VCALENDAR`

        const result = parseICS(ics)

        expect(result).not.toBeNull()
        expect(result?.rrule).not.toBeUndefined()
        expect(result?.rrule?.freq).toBe('WEEKLY')
        expect(result?.rrule?.interval).toBe(2)
        expect(result?.rrule?.byDay).toEqual(['MO', 'WE', 'FR'])
    })

    it('should parse event with optional properties', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:full-123@example.com
DTSTAMP:20240115T100000Z
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Full Event
DESCRIPTION:This is a description
LOCATION:Conference Room A
STATUS:TENTATIVE
TRANSP:TRANSPARENT
PRIORITY:1
CATEGORIES:Work,Meeting
END:VEVENT
END:VCALENDAR`

        const result = parseICS(ics)

        expect(result).not.toBeNull()
        expect(result?.description).toBe('This is a description')
        expect(result?.location).toBe('Conference Room A')
        expect(result?.status).toBe('TENTATIVE')
        expect(result?.transp).toBe('TRANSPARENT')
        expect(result?.priority).toBe(1)
        expect(result?.categories).toEqual(['Work', 'Meeting'])
    })

    it('should handle line folding', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:folded-123@example.com
DTSTAMP:20240115T100000Z
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:This is a very long summary that spans multiple lines
 and continues here
END:VEVENT
END:VCALENDAR`

        const result = parseICS(ics)

        expect(result).not.toBeNull()
        expect(result?.summary).toBe('This is a very long summary that spans multiple linesand continues here')
    })

    it('should handle escaped characters', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:escaped-123@example.com
DTSTAMP:20240115T100000Z
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Event with\\, comma and\\; semicolon
DESCRIPTION:Line 1\\nLine 2
END:VEVENT
END:VCALENDAR`

        const result = parseICS(ics)

        expect(result).not.toBeNull()
        expect(result?.summary).toBe('Event with, comma and; semicolon')
        expect(result?.description).toBe('Line 1\nLine 2')
    })

    it('should return null for invalid ICS', () => {
        const ics = 'invalid ics data'

        const result = parseICS(ics)

        expect(result).toBeNull()
    })

    it('should return null for missing required fields', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:missing-123@example.com
DTSTAMP:20240115T100000Z
END:VEVENT
END:VCALENDAR`

        const result = parseICS(ics)

        expect(result).toBeNull()
    })

    it('should calculate dtend for all-day event without DTEND', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:no-dtend-123@example.com
DTSTAMP:20240115T100000Z
DTSTART;VALUE=DATE:20240115
SUMMARY:Single Day
END:VEVENT
END:VCALENDAR`

        const result = parseICS(ics)

        expect(result).not.toBeNull()
        expect(result?.dtend.getDate()).toBe(16)
    })

    it('should parse SEQUENCE property', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:seq-123@example.com
DTSTAMP:20240115T100000Z
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Event with Sequence
SEQUENCE:3
END:VEVENT
END:VCALENDAR`

        const result = parseICS(ics)

        expect(result).not.toBeNull()
        expect(result?.sequence).toBe(3)
    })

    it('should parse EXDATE property', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:exdate-123@example.com
DTSTAMP:20240115T100000Z
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Event with Exception
RRULE:FREQ=DAILY
EXDATE:20240120T100000Z
EXDATE:20240125T100000Z
END:VEVENT
END:VCALENDAR`

        const result = parseICS(ics)

        expect(result).not.toBeNull()
        expect(result?.exdate).toHaveLength(2)
        expect(result?.exdate?.[0]).toBe('20240120T100000Z')
        expect(result?.exdate?.[1]).toBe('20240125T100000Z')
    })
})

describe('extractUidFromICS', () => {
    it('should extract UID from ICS', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:extracted-uid-123@example.com
SUMMARY:Test
END:VEVENT
END:VCALENDAR`

        const uid = extractUidFromICS(ics)

        expect(uid).toBe('extracted-uid-123@example.com')
    })

    it('should return null when no UID', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Test
END:VEVENT
END:VCALENDAR`

        const uid = extractUidFromICS(ics)

        expect(uid).toBeNull()
    })
})
