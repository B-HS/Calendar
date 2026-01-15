import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { auth } from '$lib/auth'
import * as calendarService from '$lib/server/services/calendar'

export const PUT: RequestHandler = async ({ request, params }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw error(401, 'Unauthorized')

    const data = await request.json()
    const event = await calendarService.updateEvent(session.user.id, {
        ...data,
        uid: params.uid,
        dtstart: new Date(data.dtstart),
        dtend: new Date(data.dtend),
        rrule: data.rrule
            ? {
                    ...data.rrule,
                    until: data.rrule.until ? new Date(data.rrule.until) : undefined,
                }
            : undefined,
    })

    return json(event)
}

export const DELETE: RequestHandler = async ({ request, params }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw error(401, 'Unauthorized')

    await calendarService.deleteEvent(session.user.id, params.uid!)
    return new Response(null, { status: 204 })
}
