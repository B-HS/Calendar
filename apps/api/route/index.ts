import type { OpenAPIHono } from '@hono/zod-openapi'
import { auth } from '../auth'
import { createEventsRoute } from './events'
import { createSubscriptionRoute } from './calendar/subscription'
import { createIcsRoute } from './calendar/ics'
import { createCaldavRoute } from './caldav/index'
import type { AppEnv } from '@middleware/index'

export const initRoutes = (app: OpenAPIHono<AppEnv>) => {
    app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw))

    app.route('/api/events', createEventsRoute())
    app.route('/api/calendar/subscription', createSubscriptionRoute())
    app.route('/api/calendar', createIcsRoute())
    app.route('/caldav', createCaldavRoute())

    app.get('/.well-known/caldav', (c) => {
        const token = c.req.query('token')
        if (token) {
            return c.redirect(`/caldav/${token}/`, 301)
        }
        return c.text('CalDAV server. Use /caldav/:token/', 200)
    })

}
