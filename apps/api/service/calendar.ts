import { eq, and, gte, lte, or, isNotNull } from 'drizzle-orm'
import type { Database } from '@db/index'
import { calendarEvent, calendarSubscription, deletedCalendarEvent, user } from '@db/schema'
import { generateIcsUid, generateSubscriptionToken, getRecurrenceOccurrences } from '@utils/ics'

export type EventStatus = 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED'
export type EventTransparency = 'TRANSPARENT' | 'OPAQUE'

export type RecurrenceRule = {
    freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    interval?: number
    count?: number
    until?: Date
    byDay?: string[]
    byMonth?: number[]
    byMonthDay?: number[]
}

export type CalendarEvent = {
    uid: string
    summary: string
    description?: string
    location?: string
    dtstart: Date
    dtend: Date
    isAllDay: boolean
    rrule?: RecurrenceRule
    exdate?: string[]
    status?: EventStatus
    transp?: EventTransparency
    priority?: number
    categories?: string[]
    color?: string
    sequence?: number
    created?: Date
    lastModified?: Date
}

export type CalendarSubscription = {
    id: string
    userId: string
    token: string
    icsToken: string
    name: string | null
    isActive: boolean
    ctag: string
    lastAccessedAt: Date | null
}

type CalendarEventRow = typeof calendarEvent.$inferSelect

const toNull = <T>(value: T | undefined | null | ''): T | null => (value === undefined || value === null || value === '' ? null : value)

const toCalendarEvent = (row: CalendarEventRow): CalendarEvent => ({
    uid: row.uid,
    summary: row.summary,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    dtstart: row.dtstart,
    dtend: row.dtend,
    isAllDay: row.isAllDay,
    rrule: row.rrule
        ? {
              ...row.rrule,
              until: row.rrule.until ? new Date(row.rrule.until) : undefined,
          }
        : undefined,
    exdate: row.exdate ?? undefined,
    status: (row.status as EventStatus) ?? undefined,
    transp: (row.transp as EventTransparency) ?? undefined,
    priority: row.priority ?? undefined,
    categories: row.categories ?? undefined,
    color: row.color ?? undefined,
    sequence: row.sequence,
    created: row.createdAt,
    lastModified: row.updatedAt,
})

export type CalendarServiceDeps = {
    db: Database
}

export const createCalendarService = (deps: CalendarServiceDeps) => {
    const { db } = deps

    const getEventsByMonth = async (userId: string, year: number, month: number): Promise<CalendarEvent[]> => {
        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0, 23, 59, 59)

        const rows = await db
            .select()
            .from(calendarEvent)
            .where(
                and(
                    eq(calendarEvent.userId, userId),
                    or(
                        and(gte(calendarEvent.dtstart, startDate), lte(calendarEvent.dtstart, endDate)),
                        and(isNotNull(calendarEvent.rrule), lte(calendarEvent.dtstart, endDate)),
                    ),
                ),
            )

        const result: CalendarEvent[] = []

        for (const row of rows) {
            const event = toCalendarEvent(row)

            if (!event.rrule) {
                if (event.dtstart >= startDate && event.dtstart <= endDate) {
                    result.push(event)
                }
            } else {
                const occurrences = getRecurrenceOccurrences(event.rrule, event.dtstart, startDate, endDate)
                if (occurrences.length > 0) {
                    result.push(event)
                }
            }
        }

        return result
    }

    const getAllEvents = async (userId: string): Promise<CalendarEvent[]> => {
        const rows = await db.select().from(calendarEvent).where(eq(calendarEvent.userId, userId))
        return rows.map(toCalendarEvent)
    }

    const getEventByUid = async (userId: string, uid: string): Promise<CalendarEvent | null> => {
        const rows = await db
            .select()
            .from(calendarEvent)
            .where(and(eq(calendarEvent.userId, userId), eq(calendarEvent.uid, uid)))

        if (rows[0]) return toCalendarEvent(rows[0])

        const rowsWithDomain = await db
            .select()
            .from(calendarEvent)
            .where(and(eq(calendarEvent.userId, userId), eq(calendarEvent.uid, `${uid}@b-calendar`)))

        return rowsWithDomain[0] ? toCalendarEvent(rowsWithDomain[0]) : null
    }

    const incrementCtag = async (userId: string) => {
        const newCtag = Date.now().toString(36)
        await db.update(calendarSubscription).set({ ctag: newCtag }).where(eq(calendarSubscription.userId, userId))
    }

    const createEvent = async (userId: string, data: Omit<CalendarEvent, 'uid' | 'created' | 'lastModified'>): Promise<CalendarEvent> => {
        const id = crypto.randomUUID()
        const uid = generateIcsUid()
        const now = new Date()

        const rruleValue =
            data.rrule && data.rrule.freq
                ? {
                      ...data.rrule,
                      until: data.rrule.until?.toISOString(),
                  }
                : null

        await db.insert(calendarEvent).values({
            id,
            userId,
            uid,
            summary: data.summary,
            description: toNull(data.description),
            location: toNull(data.location),
            dtstart: data.dtstart,
            dtend: data.dtend,
            isAllDay: data.isAllDay,
            rrule: rruleValue,
            status: toNull(data.status),
            transp: toNull(data.transp),
            priority: toNull(data.priority),
            categories: data.categories?.length ? data.categories : null,
            color: toNull(data.color),
            dtstamp: now,
        })

        await incrementCtag(userId)

        return {
            ...data,
            uid,
            created: now,
            lastModified: now,
        }
    }

    const updateEvent = async (userId: string, data: CalendarEvent): Promise<CalendarEvent> => {
        const now = new Date()
        const newSequence = (data.sequence ?? 0) + 1

        const rruleValue =
            data.rrule && data.rrule.freq
                ? {
                      ...data.rrule,
                      until: data.rrule.until?.toISOString(),
                  }
                : null

        await db
            .update(calendarEvent)
            .set({
                summary: data.summary,
                description: toNull(data.description),
                location: toNull(data.location),
                dtstart: data.dtstart,
                dtend: data.dtend,
                isAllDay: data.isAllDay,
                rrule: rruleValue,
                exdate: data.exdate?.length ? data.exdate : null,
                status: toNull(data.status),
                transp: toNull(data.transp),
                priority: toNull(data.priority),
                categories: data.categories?.length ? data.categories : null,
                color: toNull(data.color),
                sequence: newSequence,
                dtstamp: now,
            })
            .where(and(eq(calendarEvent.userId, userId), eq(calendarEvent.uid, data.uid)))

        await incrementCtag(userId)

        return {
            ...data,
            sequence: newSequence,
            lastModified: now,
        }
    }

    const deleteEvent = async (userId: string, uid: string): Promise<void> => {
        const event = await db
            .select({ uid: calendarEvent.uid })
            .from(calendarEvent)
            .where(and(eq(calendarEvent.userId, userId), or(eq(calendarEvent.uid, uid), eq(calendarEvent.uid, `${uid}@b-calendar`))))

        if (event[0]) {
            const newCtag = Date.now().toString(36)

            await db.insert(deletedCalendarEvent).values({
                id: crypto.randomUUID(),
                userId,
                uid: event[0].uid,
                syncToken: newCtag,
            })

            await db
                .delete(calendarEvent)
                .where(and(eq(calendarEvent.userId, userId), eq(calendarEvent.uid, event[0].uid)))

            await db.update(calendarSubscription).set({ ctag: newCtag }).where(eq(calendarSubscription.userId, userId))
        }
    }

    const upsertEventByUid = async (
        userId: string,
        uid: string,
        data: Omit<CalendarEvent, 'uid' | 'created' | 'lastModified'>,
    ): Promise<{ event: CalendarEvent; created: boolean }> => {
        console.log('[Calendar] upsertEventByUid: uid:', uid, 'dtstart:', data.dtstart, 'dtend:', data.dtend)
        const existing = await getEventByUid(userId, uid)
        if (existing) {
            console.log('[Calendar] upsertEventByUid: existing event found, updating...')
            const updated = await updateEvent(userId, { ...data, uid: existing.uid })
            console.log('[Calendar] upsertEventByUid: updated dtstart:', updated.dtstart, 'dtend:', updated.dtend)
            return { event: updated, created: false }
        }

        const id = crypto.randomUUID()
        const now = new Date()

        const rruleValue =
            data.rrule && data.rrule.freq
                ? {
                      ...data.rrule,
                      until: data.rrule.until?.toISOString(),
                  }
                : null

        await db.insert(calendarEvent).values({
            id,
            userId,
            uid,
            summary: data.summary,
            description: toNull(data.description),
            location: toNull(data.location),
            dtstart: data.dtstart,
            dtend: data.dtend,
            isAllDay: data.isAllDay,
            rrule: rruleValue,
            status: toNull(data.status),
            transp: toNull(data.transp),
            priority: toNull(data.priority),
            categories: data.categories?.length ? data.categories : null,
            color: toNull(data.color),
            dtstamp: now,
        })

        await incrementCtag(userId)

        return {
            event: { ...data, uid, created: now, lastModified: now },
            created: true,
        }
    }

    const getEventEtag = (event: CalendarEvent): string => {
        const timestamp = event.lastModified?.getTime() ?? Date.now()
        return `${timestamp.toString(36)}-${event.uid.slice(0, 8)}`
    }

    const getSubscription = async (userId: string): Promise<CalendarSubscription | null> => {
        const rows = await db.select().from(calendarSubscription).where(eq(calendarSubscription.userId, userId))
        return rows[0] ?? null
    }

    const getSubscriptionByToken = async (token: string): Promise<CalendarSubscription | null> => {
        const rows = await db
            .select()
            .from(calendarSubscription)
            .where(and(eq(calendarSubscription.token, token), eq(calendarSubscription.isActive, true)))

        if (rows[0]) {
            const newCtag = Date.now().toString(36)
            rows[0].ctag = newCtag
            await db.update(calendarSubscription).set({ lastAccessedAt: new Date(), ctag: newCtag }).where(eq(calendarSubscription.id, rows[0].id))
        }

        return rows[0] ?? null
    }

    const createSubscription = async (userId: string, name?: string): Promise<CalendarSubscription> => {
        const existing = await getSubscription(userId)
        if (existing) return existing

        const id = crypto.randomUUID()
        const token = generateSubscriptionToken()
        const icsToken = generateSubscriptionToken()

        await db.insert(calendarSubscription).values({
            id,
            userId,
            token,
            icsToken,
            name: name ?? 'My Calendar',
            isActive: true,
        })

        return { id, userId, token, icsToken, name: name ?? 'My Calendar', isActive: true, ctag: '0', lastAccessedAt: null }
    }

    const regenerateSubscriptionToken = async (userId: string): Promise<string> => {
        const newToken = generateSubscriptionToken()
        await db.update(calendarSubscription).set({ token: newToken }).where(eq(calendarSubscription.userId, userId))
        return newToken
    }

    const getSubscriptionByIcsToken = async (token: string): Promise<CalendarSubscription | null> => {
        const rows = await db
            .select()
            .from(calendarSubscription)
            .where(and(eq(calendarSubscription.icsToken, token), eq(calendarSubscription.isActive, true)))

        return rows[0] ?? null
    }

    const regenerateIcsToken = async (userId: string): Promise<string> => {
        const newToken = generateSubscriptionToken()
        await db.update(calendarSubscription).set({ icsToken: newToken }).where(eq(calendarSubscription.userId, userId))
        return newToken
    }

    const getUserTimezone = async (userId: string): Promise<string> => {
        const rows = await db.select({ timezone: user.timezone }).from(user).where(eq(user.id, userId))
        return rows[0]?.timezone ?? 'Asia/Seoul'
    }

    const updateUserTimezone = async (userId: string, timezone: string): Promise<void> => {
        await db.update(user).set({ timezone }).where(eq(user.id, userId))
    }

    return {
        getEventsByMonth,
        getAllEvents,
        getEventByUid,
        createEvent,
        updateEvent,
        deleteEvent,
        upsertEventByUid,
        getEventEtag,
        getSubscription,
        getSubscriptionByToken,
        getSubscriptionByIcsToken,
        createSubscription,
        regenerateSubscriptionToken,
        regenerateIcsToken,
        getUserTimezone,
        updateUserTimezone,
    }
}

export type CalendarService = ReturnType<typeof createCalendarService>
