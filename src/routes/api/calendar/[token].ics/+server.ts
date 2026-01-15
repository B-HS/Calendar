import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import * as calendarService from '$lib/server/services/calendar'
import { eventsToICS } from '$lib/utils/ics'

export const GET: RequestHandler = async ({ params, url }) => {
    const subscription = await calendarService.getSubscriptionByToken(params.token!)
    if (!subscription) throw error(404, 'Calendar not found')

    const events = await calendarService.getAllEvents(subscription.userId)
    const domain = url.hostname || 'global-calendar'
    const calendarName = subscription.name ?? 'My Calendar'

    const icsContent = eventsToICS(events, calendarName, domain)

    return new Response(icsContent, {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="${calendarName}.ics"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    })
}
