import type { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import type { AppEnv } from './auth'
import { authMiddleware } from './auth'
import { createServiceMiddleware } from './service'
import type { CalendarService } from '@service/calendar'
import type { CaldavService } from '@service/caldav'

export type { AppEnv } from './auth'
export { authMiddleware } from './auth'
export { createServiceMiddleware } from './service'

type InitMiddlewareDeps = {
    calendarService: CalendarService
    caldavService: CaldavService
}

export const initMiddleware = (app: OpenAPIHono<AppEnv>, deps: InitMiddlewareDeps) => {
    app.use(
        '/api/*',
        cors({
            origin: (origin) => origin,
            credentials: true,
        }),
    )
    app.use('*', createServiceMiddleware(deps.calendarService, deps.caldavService))

    app.use('/api/events/*', authMiddleware)
    app.use('/api/events', authMiddleware)
    app.use('/api/calendar/subscription/*', authMiddleware)
    app.use('/api/calendar/subscription', authMiddleware)
}
