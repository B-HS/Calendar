import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { auth } from '$lib/auth'
import * as calendarService from '$lib/server/services/calendar'

export const GET: RequestHandler = async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw error(401, 'Unauthorized')

    const subscription = await calendarService.getSubscription(session.user.id)
    return json(subscription)
}

export const POST: RequestHandler = async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw error(401, 'Unauthorized')

    const subscription = await calendarService.createSubscription(session.user.id)
    return json(subscription)
}

export const PATCH: RequestHandler = async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw error(401, 'Unauthorized')

    const token = await calendarService.regenerateSubscriptionToken(session.user.id)
    return json({ token })
}
