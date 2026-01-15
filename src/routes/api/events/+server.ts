import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { auth } from '$lib/auth'
import * as calendarService from '$lib/server/services/calendar'

export const GET: RequestHandler = async ({ request, url }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw error(401, 'Unauthorized')

    const year = parseInt(url.searchParams.get('year') ?? new Date().getFullYear().toString())
    const month = parseInt(url.searchParams.get('month') ?? new Date().getMonth().toString())

    const events = await calendarService.getEventsByMonth(session.user.id, year, month)
    return json(events)
}

export const POST: RequestHandler = async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw error(401, 'Unauthorized')

    const data = await request.json()
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

    return json(event, { status: 201 })
}
