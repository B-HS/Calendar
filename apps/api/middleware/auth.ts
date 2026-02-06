import { createMiddleware } from 'hono/factory'
import { auth } from '../auth'
import type { CalendarService, CalendarSubscription } from '@service/calendar'
import type { CaldavService } from '@service/caldav'
import type { AuthSession } from '../auth'

export type AppEnv = {
    Variables: {
        session: AuthSession
        calendarService: CalendarService
        caldavService: CaldavService
        caldavSubscription: CalendarSubscription
        caldavUserId: string
    }
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session?.user) {
        return c.json({ error: 'Unauthorized' }, 401)
    }
    c.set('session', session)
    await next()
})
