import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { createCalendarService } from './calendar'
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

describe('createCalendarService', () => {
    beforeEach(() => {
        mockDb = createMockDb()
    })

    it('should create a service with all methods', () => {
        const service = createCalendarService({ db: mockDb as unknown as Database })

        expect(service.getEventsByMonth).toBeDefined()
        expect(service.getAllEvents).toBeDefined()
        expect(service.getEventByUid).toBeDefined()
        expect(service.createEvent).toBeDefined()
        expect(service.updateEvent).toBeDefined()
        expect(service.deleteEvent).toBeDefined()
        expect(service.getSubscription).toBeDefined()
        expect(service.getSubscriptionByToken).toBeDefined()
        expect(service.createSubscription).toBeDefined()
        expect(service.regenerateSubscriptionToken).toBeDefined()
        expect(service.getUserTimezone).toBeDefined()
        expect(service.updateUserTimezone).toBeDefined()
    })

    describe('getAllEvents', () => {
        it('should return empty array when no events', async () => {
            mockDb.where.mockResolvedValue([])
            const service = createCalendarService({ db: mockDb as unknown as Database })

            const events = await service.getAllEvents('user-123')

            expect(events).toEqual([])
        })

        it('should return mapped events', async () => {
            const mockRow = {
                id: 'event-1',
                userId: 'user-123',
                uid: 'uid-123@b-calendar',
                summary: 'Test Event',
                description: 'Test Description',
                location: 'Test Location',
                dtstart: new Date('2024-01-15T10:00:00'),
                dtend: new Date('2024-01-15T11:00:00'),
                isAllDay: false,
                rrule: null,
                status: 'CONFIRMED',
                transp: 'OPAQUE',
                priority: null,
                categories: null,
                color: null,
                dtstamp: new Date('2024-01-01'),
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            }
            mockDb.where.mockResolvedValue([mockRow])
            const service = createCalendarService({ db: mockDb as unknown as Database })

            const events = await service.getAllEvents('user-123')

            expect(events).toHaveLength(1)
            expect(events[0].uid).toBe('uid-123@b-calendar')
            expect(events[0].summary).toBe('Test Event')
            expect(events[0].description).toBe('Test Description')
            expect(events[0].location).toBe('Test Location')
        })
    })

    describe('getEventByUid', () => {
        it('should return null when event not found', async () => {
            mockDb.where.mockResolvedValue([])
            const service = createCalendarService({ db: mockDb as unknown as Database })

            const event = await service.getEventByUid('user-123', 'non-existent')

            expect(event).toBeNull()
        })

        it('should return event when found', async () => {
            const mockRow = {
                id: 'event-1',
                userId: 'user-123',
                uid: 'uid-123@b-calendar',
                summary: 'Test Event',
                description: null,
                location: null,
                dtstart: new Date('2024-01-15T10:00:00'),
                dtend: new Date('2024-01-15T11:00:00'),
                isAllDay: false,
                rrule: null,
                status: null,
                transp: null,
                priority: null,
                categories: null,
                color: null,
                dtstamp: new Date('2024-01-01'),
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            }
            mockDb.where.mockResolvedValue([mockRow])
            const service = createCalendarService({ db: mockDb as unknown as Database })

            const event = await service.getEventByUid('user-123', 'uid-123@b-calendar')

            expect(event).not.toBeNull()
            expect(event?.uid).toBe('uid-123@b-calendar')
        })
    })

    describe('createEvent', () => {
        it('should create event and return with uid', async () => {
            mockDb.values.mockResolvedValue(undefined)
            const service = createCalendarService({ db: mockDb as unknown as Database })

            const event = await service.createEvent('user-123', {
                summary: 'New Event',
                dtstart: new Date('2024-01-15T10:00:00'),
                dtend: new Date('2024-01-15T11:00:00'),
                isAllDay: false,
            })

            expect(event.uid).toContain('@b-calendar')
            expect(event.summary).toBe('New Event')
            expect(event.created).toBeDefined()
            expect(event.lastModified).toBeDefined()
        })

        it('should handle rrule', async () => {
            mockDb.values.mockResolvedValue(undefined)
            const service = createCalendarService({ db: mockDb as unknown as Database })

            const event = await service.createEvent('user-123', {
                summary: 'Recurring Event',
                dtstart: new Date('2024-01-15T10:00:00'),
                dtend: new Date('2024-01-15T11:00:00'),
                isAllDay: false,
                rrule: {
                    freq: 'WEEKLY',
                    interval: 1,
                },
            })

            expect(event.rrule?.freq).toBe('WEEKLY')
        })
    })

    describe('deleteEvent', () => {
        it('should call delete with correct parameters', async () => {
            mockDb.where.mockResolvedValueOnce([{ uid: 'uid-123@b-calendar' }]).mockResolvedValue(undefined)
            const service = createCalendarService({ db: mockDb as unknown as Database })

            await service.deleteEvent('user-123', 'uid-123')

            expect(mockDb.delete).toHaveBeenCalled()
        })

        it('should do nothing when event not found', async () => {
            mockDb.where.mockResolvedValue([])
            const service = createCalendarService({ db: mockDb as unknown as Database })

            await service.deleteEvent('user-123', 'non-existent')
        })
    })

    describe('getSubscription', () => {
        it('should return null when no subscription', async () => {
            mockDb.where.mockResolvedValue([])
            const service = createCalendarService({ db: mockDb as unknown as Database })

            const sub = await service.getSubscription('user-123')

            expect(sub).toBeNull()
        })
    })

    describe('createSubscription', () => {
        it('should return existing subscription if exists', async () => {
            const existingSub = {
                id: 'sub-1',
                userId: 'user-123',
                token: 'existing-token',
                name: 'My Calendar',
                isActive: true,
                lastAccessedAt: null,
            }
            mockDb.where.mockResolvedValue([existingSub])
            const service = createCalendarService({ db: mockDb as unknown as Database })

            const sub = await service.createSubscription('user-123')

            expect(sub.token).toBe('existing-token')
        })
    })

    describe('getUserTimezone', () => {
        it('should return default timezone when user not found', async () => {
            mockDb.where.mockResolvedValue([])
            const service = createCalendarService({ db: mockDb as unknown as Database })

            const tz = await service.getUserTimezone('user-123')

            expect(tz).toBe('Asia/Seoul')
        })

        it('should return user timezone', async () => {
            mockDb.where.mockResolvedValue([{ timezone: 'America/New_York' }])
            const service = createCalendarService({ db: mockDb as unknown as Database })

            const tz = await service.getUserTimezone('user-123')

            expect(tz).toBe('America/New_York')
        })
    })
})
