import { createMiddleware } from 'hono/factory'
import type { AppEnv } from './auth'
import type { CalendarService } from '@service/calendar'
import type { CaldavService } from '@service/caldav'

export const createServiceMiddleware = (calendarService: CalendarService, caldavService: CaldavService) =>
    createMiddleware<AppEnv>(async (c, next) => {
        c.set('calendarService', calendarService)
        c.set('caldavService', caldavService)
        await next()
    })
