import { Hono } from 'hono'
import type { AppEnv } from '@middleware/index'
import { eventsToICS } from '@utils/ics'

export const createIcsRoute = () => {
    const app = new Hono<AppEnv>()

    app.get('/:token', async (c) => {
        const calendarService = c.get('calendarService')
        const token = c.req.param('token').replace('.ics', '')

        const subscription = await calendarService.getSubscriptionByIcsToken(token)
        if (!subscription) {
            return c.json({ error: 'Calendar not found' }, 404)
        }

        const events = await calendarService.getAllEvents(subscription.userId)
        const timezone = await calendarService.getUserTimezone(subscription.userId)
        const domain = new URL(c.req.url).hostname || 'b-calendar'
        const calendarName = subscription.name ?? 'My Calendar'

        const icsContent = eventsToICS(events, calendarName, domain, timezone)

        return new Response(icsContent, {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': `attachment; filename="${calendarName}.ics"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        })
    })

    return app
}
