import { db } from '$lib/server/db'
import { calendarEvent, calendarSubscription } from '$lib/server/db/schema'
import { eq, and, gte, lte, or, isNotNull } from 'drizzle-orm'
import { generateIcsUid, generateSubscriptionToken, getRecurrenceOccurrences } from '$lib/utils/ics'
import type { CalendarEvent, RecurrenceRule } from '$widgets/calendar'

type EventStatus = 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED'
type EventTransparency = 'TRANSPARENT' | 'OPAQUE'

const toNull = <T>(value: T | undefined | null | ''): T | null => (value === undefined || value === null || value === '' ? null : value)

const toCalendarEvent = (row: typeof calendarEvent.$inferSelect): CalendarEvent => ({
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
    status: (row.status as EventStatus) ?? undefined,
    transp: (row.transp as EventTransparency) ?? undefined,
    priority: row.priority ?? undefined,
    categories: row.categories ?? undefined,
    color: row.color ?? undefined,
    created: row.createdAt,
    lastModified: row.updatedAt,
})

export const getEventsByMonth = async (userId: string, year: number, month: number): Promise<CalendarEvent[]> => {
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
                    and(isNotNull(calendarEvent.rrule), lte(calendarEvent.dtstart, endDate))
                )
            )
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

export const getAllEvents = async (userId: string): Promise<CalendarEvent[]> => {
    const rows = await db.select().from(calendarEvent).where(eq(calendarEvent.userId, userId))

    return rows.map(toCalendarEvent)
}

export const getEventByUid = async (userId: string, uid: string): Promise<CalendarEvent | null> => {
    const rows = await db.select().from(calendarEvent).where(and(eq(calendarEvent.userId, userId), eq(calendarEvent.uid, uid)))

    return rows[0] ? toCalendarEvent(rows[0]) : null
}

export const createEvent = async (
    userId: string,
    data: Omit<CalendarEvent, 'uid' | 'created' | 'lastModified'>
): Promise<CalendarEvent> => {
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

    return {
        ...data,
        uid,
        created: now,
        lastModified: now,
    }
}

export const updateEvent = async (userId: string, data: CalendarEvent): Promise<CalendarEvent> => {
    const now = new Date()

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
            status: toNull(data.status),
            transp: toNull(data.transp),
            priority: toNull(data.priority),
            categories: data.categories?.length ? data.categories : null,
            color: toNull(data.color),
            dtstamp: now,
        })
        .where(and(eq(calendarEvent.userId, userId), eq(calendarEvent.uid, data.uid)))

    return {
        ...data,
        lastModified: now,
    }
}

export const deleteEvent = async (userId: string, uid: string): Promise<void> => {
    await db.delete(calendarEvent).where(and(eq(calendarEvent.userId, userId), eq(calendarEvent.uid, uid)))
}

export const getSubscription = async (userId: string) => {
    const rows = await db.select().from(calendarSubscription).where(eq(calendarSubscription.userId, userId))

    return rows[0] ?? null
}

export const getSubscriptionByToken = async (token: string) => {
    const rows = await db
        .select()
        .from(calendarSubscription)
        .where(and(eq(calendarSubscription.token, token), eq(calendarSubscription.isActive, true)))

    if (rows[0]) {
        await db
            .update(calendarSubscription)
            .set({ lastAccessedAt: new Date() })
            .where(eq(calendarSubscription.id, rows[0].id))
    }

    return rows[0] ?? null
}

export const createSubscription = async (userId: string, name?: string) => {
    const existing = await getSubscription(userId)
    if (existing) return existing

    const id = crypto.randomUUID()
    const token = generateSubscriptionToken()

    await db.insert(calendarSubscription).values({
        id,
        userId,
        token,
        name: name ?? 'My Calendar',
        isActive: true,
    })

    return { id, userId, token, name: name ?? 'My Calendar', isActive: true }
}

export const regenerateSubscriptionToken = async (userId: string) => {
    const newToken = generateSubscriptionToken()

    await db.update(calendarSubscription).set({ token: newToken }).where(eq(calendarSubscription.userId, userId))

    return newToken
}
