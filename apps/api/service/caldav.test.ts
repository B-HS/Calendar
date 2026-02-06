import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { createCaldavService } from './caldav'
import type { Database } from '../db/index'

type MockDb = {
    select: ReturnType<typeof mock>
    from: ReturnType<typeof mock>
    where: ReturnType<typeof mock>
    insert: ReturnType<typeof mock>
    values: ReturnType<typeof mock>
    update: ReturnType<typeof mock>
    set: ReturnType<typeof mock>
    delete: ReturnType<typeof mock>
}

const createMockDb = (): MockDb => {
    const mockDb: MockDb = {
        select: mock(() => mockDb),
        from: mock(() => mockDb),
        where: mock(() => Promise.resolve([])),
        insert: mock(() => mockDb),
        values: mock(() => Promise.resolve()),
        update: mock(() => mockDb),
        set: mock(() => mockDb),
        delete: mock(() => mockDb),
    }
    return mockDb
}

let mockDb: MockDb

describe('CaldavService', () => {
    let caldavService: ReturnType<typeof createCaldavService>

    beforeEach(() => {
        mockDb = createMockDb()
        caldavService = createCaldavService({ db: mockDb as unknown as Database })
    })

    describe('getSyncToken', () => {
        it('should generate sync token from ctag', () => {
            const token = caldavService.getSyncToken('abc123')
            expect(token).toBe('http://b-calendar/sync/abc123')
        })
    })

    describe('parseSyncToken', () => {
        it('should parse valid sync token', () => {
            const ctag = caldavService.parseSyncToken('http://b-calendar/sync/abc123')
            expect(ctag).toBe('abc123')
        })

        it('should return null for invalid sync token', () => {
            const ctag = caldavService.parseSyncToken('invalid-token')
            expect(ctag).toBeNull()
        })
    })

    describe('getCalendarProperties', () => {
        const mockSubscription = {
            id: 'sub-1',
            userId: 'user-1',
            token: 'token-123',
            icsToken: 'ics-token-123',
            name: 'My Calendar',
            isActive: true,
            ctag: 'ctag-123',
            lastAccessedAt: null,
        }

        it('should return resourcetype', () => {
            const { found } = caldavService.getCalendarProperties(mockSubscription, ['resourcetype'], '/caldav/token/', 'Asia/Seoul')

            expect(found['D:resourcetype']).toEqual({ 'D:collection': '', 'C:calendar': '' })
        })

        it('should return displayname', () => {
            const { found } = caldavService.getCalendarProperties(mockSubscription, ['displayname'], '/caldav/token/', 'Asia/Seoul')

            expect(found['D:displayname']).toBe('My Calendar')
        })

        it('should return getctag', () => {
            const { found } = caldavService.getCalendarProperties(mockSubscription, ['getctag'], '/caldav/token/', 'Asia/Seoul')

            expect(found['CS:getctag']).toBe('ctag-123')
        })

        it('should return sync-token', () => {
            const { found } = caldavService.getCalendarProperties(mockSubscription, ['sync-token'], '/caldav/token/', 'Asia/Seoul')

            expect(found['D:sync-token']).toBe('http://b-calendar/sync/ctag-123')
        })

        it('should return supported-calendar-component-set', () => {
            const { found } = caldavService.getCalendarProperties(mockSubscription, ['supported-calendar-component-set'], '/caldav/token/', 'Asia/Seoul')

            expect(found['C:supported-calendar-component-set']).toEqual({ 'C:comp': { '@_name': 'VEVENT' } })
        })

        it('should return current-user-privilege-set', () => {
            const { found } = caldavService.getCalendarProperties(mockSubscription, ['current-user-privilege-set'], '/caldav/token/', 'Asia/Seoul')

            expect(found['D:current-user-privilege-set']).toBeDefined()
            const privileges = found['D:current-user-privilege-set'] as { 'D:privilege': Array<Record<string, string>> }
            expect(privileges['D:privilege']).toHaveLength(5)
        })

        it('should return supported-report-set with all reports', () => {
            const { found } = caldavService.getCalendarProperties(mockSubscription, ['supported-report-set'], '/caldav/token/', 'Asia/Seoul')

            const reportSet = found['D:supported-report-set'] as { 'D:supported-report': Array<Record<string, unknown>> }
            expect(reportSet['D:supported-report']).toHaveLength(4)
        })

        it('should return calendar-timezone', () => {
            const { found } = caldavService.getCalendarProperties(mockSubscription, ['calendar-timezone'], '/caldav/token/', 'Asia/Seoul')

            expect(found['C:calendar-timezone']).toContain('BEGIN:VTIMEZONE')
            expect(found['C:calendar-timezone']).toContain('Asia/Seoul')
        })

        it('should track not found properties', () => {
            const { notFound } = caldavService.getCalendarProperties(mockSubscription, ['unknown-prop'], '/caldav/token/', 'Asia/Seoul')

            expect(notFound).toContain('unknown-prop')
        })

        it('should return multiple properties', () => {
            const { found } = caldavService.getCalendarProperties(
                mockSubscription,
                ['resourcetype', 'displayname', 'getctag'],
                '/caldav/token/',
                'Asia/Seoul',
            )

            expect(found['D:resourcetype']).toBeDefined()
            expect(found['D:displayname']).toBe('My Calendar')
            expect(found['CS:getctag']).toBe('ctag-123')
        })
    })

    describe('generateFreeBusyICS', () => {
        it('should generate valid VFREEBUSY', () => {
            const periods = [
                { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z'), type: 'BUSY' as const },
                { start: new Date('2024-01-15T14:00:00Z'), end: new Date('2024-01-15T15:00:00Z'), type: 'BUSY-TENTATIVE' as const },
            ]
            const start = new Date('2024-01-15T00:00:00Z')
            const end = new Date('2024-01-16T00:00:00Z')

            const ics = caldavService.generateFreeBusyICS(periods, start, end)

            expect(ics).toContain('BEGIN:VCALENDAR')
            expect(ics).toContain('BEGIN:VFREEBUSY')
            expect(ics).toContain('END:VFREEBUSY')
            expect(ics).toContain('END:VCALENDAR')
            expect(ics).toContain('FREEBUSY;FBTYPE=BUSY:')
            expect(ics).toContain('FREEBUSY;FBTYPE=BUSY-TENTATIVE:')
        })

        it('should include organizer when provided', () => {
            const ics = caldavService.generateFreeBusyICS(
                [],
                new Date('2024-01-15T00:00:00Z'),
                new Date('2024-01-16T00:00:00Z'),
                'mailto:user@example.com',
            )

            expect(ics).toContain('ORGANIZER:mailto:user@example.com')
        })
    })

    describe('generateTimezoneComponent', () => {
        it('should generate VTIMEZONE component', () => {
            const tz = caldavService.generateTimezoneComponent('America/New_York')

            expect(tz).toContain('BEGIN:VTIMEZONE')
            expect(tz).toContain('TZID:America/New_York')
            expect(tz).toContain('END:VTIMEZONE')
        })
    })

    describe('getUserTimezone', () => {
        it('should return default timezone when user not found', async () => {
            mockDb.where.mockResolvedValue([])

            const tz = await caldavService.getUserTimezone('user-123')

            expect(tz).toBe('Asia/Seoul')
        })

        it('should return user timezone', async () => {
            mockDb.where.mockResolvedValue([{ timezone: 'Europe/London' }])

            const tz = await caldavService.getUserTimezone('user-123')

            expect(tz).toBe('Europe/London')
        })
    })

    describe('getChangesFromToken', () => {
        it('should return all events when no token provided', async () => {
            const mockSubscription = { ctag: 'current-ctag' }
            const mockEvents = [
                {
                    id: 'event-1',
                    userId: 'user-1',
                    uid: 'uid-1@b-calendar',
                    summary: 'Event 1',
                    description: null,
                    location: null,
                    dtstart: new Date(),
                    dtend: new Date(),
                    isAllDay: false,
                    rrule: null,
                    exdate: null,
                    status: null,
                    transp: null,
                    priority: null,
                    categories: null,
                    color: null,
                    sequence: 0,
                    dtstamp: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]

            mockDb.where
                .mockResolvedValueOnce([mockSubscription])
                .mockResolvedValueOnce(mockEvents)
                .mockResolvedValueOnce([])

            const result = await caldavService.getChangesFromToken('user-1', null)

            expect(result.changed).toHaveLength(1)
            expect(result.deleted).toHaveLength(0)
            expect(result.syncToken).toBe('http://b-calendar/sync/current-ctag')
        })

        it('should return empty when no subscription', async () => {
            mockDb.where.mockResolvedValue([])

            const result = await caldavService.getChangesFromToken('user-1', null)

            expect(result.changed).toHaveLength(0)
            expect(result.deleted).toHaveLength(0)
            expect(result.syncToken).toBe('http://b-calendar/sync/0')
        })
    })
})
