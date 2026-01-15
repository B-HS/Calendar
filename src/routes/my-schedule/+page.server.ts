import { redirect, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { auth } from '$lib/auth'
import * as calendarService from '$lib/server/services/calendar'

export const load: PageServerLoad = async ({ request, url }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw redirect(302, '/login')

    const year = parseInt(url.searchParams.get('year') ?? new Date().getFullYear().toString())
    const month = parseInt(url.searchParams.get('month') ?? new Date().getMonth().toString())

    const [events, subscription] = await Promise.all([
        calendarService.getEventsByMonth(session.user.id, year, month),
        calendarService.getSubscription(session.user.id),
    ])

    return {
        events: events.map((e) => ({
            ...e,
            dtstart: e.dtstart.toISOString(),
            dtend: e.dtend.toISOString(),
            created: e.created?.toISOString(),
            lastModified: e.lastModified?.toISOString(),
            rrule: e.rrule
                ? {
                        ...e.rrule,
                        until: e.rrule.until?.toISOString(),
                    }
                : undefined,
        })),
        subscriptionToken: subscription?.token ?? null,
        year,
        month,
    }
}

export const actions: Actions = {
    create: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) return fail(401)

        const formData = await request.formData()
        const data = JSON.parse(formData.get('data') as string)

        const event = await calendarService.createEvent(session.user.id, {
            ...data,
            dtstart: new Date(data.dtstart),
            dtend: new Date(data.dtend),
            rrule: data.rrule
                ? {
                        ...data.rrule,
                        until: data.rrule.until ? new Date(data.rrule.until) : undefined,
                    }
                : undefined,
        })

        return {
            event: {
                ...event,
                dtstart: event.dtstart.toISOString(),
                dtend: event.dtend.toISOString(),
                created: event.created?.toISOString(),
                lastModified: event.lastModified?.toISOString(),
            },
        }
    },

    update: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) return fail(401)

        const formData = await request.formData()
        const data = JSON.parse(formData.get('data') as string)

        const event = await calendarService.updateEvent(session.user.id, {
            ...data,
            dtstart: new Date(data.dtstart),
            dtend: new Date(data.dtend),
            rrule: data.rrule
                ? {
                        ...data.rrule,
                        until: data.rrule.until ? new Date(data.rrule.until) : undefined,
                    }
                : undefined,
        })

        return {
            event: {
                ...event,
                dtstart: event.dtstart.toISOString(),
                dtend: event.dtend.toISOString(),
                created: event.created?.toISOString(),
                lastModified: event.lastModified?.toISOString(),
            },
        }
    },

    delete: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) return fail(401)

        const formData = await request.formData()
        const uid = formData.get('uid') as string

        await calendarService.deleteEvent(session.user.id, uid)
        return { deleted: uid }
    },

    createSubscription: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) return fail(401)

        const subscription = await calendarService.createSubscription(session.user.id)
        return { token: subscription.token }
    },

    regenerateToken: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) return fail(401)

        const token = await calendarService.regenerateSubscriptionToken(session.user.id)
        return { token }
    },
}
