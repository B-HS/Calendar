import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AppEnv } from '@middleware/index'
import { buildMultistatus, parsePropfind, parseReport, buildCalendarDataResponse } from '@utils/xml'
import { eventsToICS } from '@utils/ics'
import { parseICS } from '@utils/ics-parser'

const DAV_HEADERS = {
    'DAV': '1, 2, 3, calendar-access',
    'Allow': 'OPTIONS, GET, HEAD, PUT, DELETE, PROPFIND, PROPPATCH, REPORT, MKCALENDAR',
}

export const createCaldavRoute = () => {
    const app = new Hono<AppEnv>()

    app.use('*', async (c, next) => {
        console.log(`[CalDAV] ${c.req.method} ${c.req.path} Depth:${c.req.header('Depth') ?? 'none'}`)
        await next()
    })

    const tokenAuthMiddleware = async (c: Context<AppEnv>, next: () => Promise<void>) => {
        const calendarService = c.get('calendarService')
        const token = c.req.param('token')
        const subscription = await calendarService.getSubscriptionByToken(token)
        if (!subscription) {
            return c.text('Calendar not found', 404)
        }
        c.set('caldavSubscription', subscription)
        c.set('caldavUserId', subscription.userId)
        await next()
    }

    app.use('/:token', tokenAuthMiddleware)
    app.use('/:token/*', tokenAuthMiddleware)

    const handleOptions = () => {
        return new Response(null, { status: 200, headers: DAV_HEADERS })
    }

    app.on('OPTIONS', '/:token', handleOptions)
    app.on('OPTIONS', '/:token/*', handleOptions)

    const handlePropfindPrincipal = async (c: Context<AppEnv>) => {
        const calendarService = c.get('calendarService')
        const caldavService = c.get('caldavService')
        const token = c.req.param('token')
        const subscription = c.get('caldavSubscription')
        const userId = c.get('caldavUserId')
        const depth = c.req.header('Depth') ?? '0'
        const body = await c.req.text()
        console.log('[CalDAV] Principal PROPFIND Request:\n', body || '(empty)')
        const { props, allprop } = parsePropfind(body)
        console.log('[CalDAV] Parsed props:', props, 'allprop:', allprop)

        const calendarHref = `/caldav/${token}/`
        const timezone = await caldavService.getUserTimezone(userId)

        const requestedProps = allprop
            ? ['resourcetype', 'current-user-principal', 'displayname', 'calendar-home-set', 'getctag', 'supported-calendar-component-set', 'current-user-privilege-set']
            : props

        const { found: responseProps } = caldavService.getCalendarProperties(subscription, requestedProps, calendarHref, timezone)
        const responses = [{ href: calendarHref, propstats: [{ status: 200, props: responseProps }] }]

        if (depth === '1') {
            const events = await calendarService.getAllEvents(userId)
            for (const event of events) {
                const etag = calendarService.getEventEtag(event)
                const eventId = event.uid.split('@')[0]
                responses.push({
                    href: `${calendarHref}${eventId}.ics`,
                    propstats: [{ status: 200, props: { 'D:getetag': `"${etag}"`, 'D:getcontenttype': 'text/calendar; component=vevent' } }],
                })
            }
        }

        const xml = buildMultistatus(responses)
        console.log('[CalDAV] Principal PROPFIND Response:\n', xml)
        return new Response(xml, {
            status: 207,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'DAV': '1, 2, 3, calendar-access',
            },
        })
    }

    const handlePropfindCalendar = async (c: Context<AppEnv>) => {
        const calendarService = c.get('calendarService')
        const caldavService = c.get('caldavService')
        const token = c.req.param('token')
        const subscription = c.get('caldavSubscription')
        const userId = c.get('caldavUserId')
        const depth = c.req.header('Depth') ?? '0'
        const body = await c.req.text()
        const { props, allprop } = parsePropfind(body)

        const calendarHref = `/caldav/${token}/default/`
        const timezone = await caldavService.getUserTimezone(userId)

        const requestedProps = allprop
            ? ['resourcetype', 'displayname', 'getctag', 'supported-calendar-component-set', 'current-user-privilege-set', 'sync-token']
            : props

        const { found: calendarProps } = caldavService.getCalendarProperties(subscription, requestedProps, `/caldav/${token}/`, timezone)
        const responses = [{ href: calendarHref, propstats: [{ status: 200, props: calendarProps }] }]

        if (depth === '1') {
            const events = await calendarService.getAllEvents(userId)
            for (const event of events) {
                const etag = calendarService.getEventEtag(event)
                responses.push({
                    href: `${calendarHref}${event.uid}.ics`,
                    propstats: [{ status: 200, props: { 'D:getetag': `"${etag}"`, 'D:getcontenttype': 'text/calendar; component=vevent' } }],
                })
            }
        }

        return new Response(buildMultistatus(responses), {
            status: 207,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'DAV': '1, 2, calendar-access',
            },
        })
    }

    app.on('PROPFIND', '/:token', handlePropfindPrincipal)
    app.on('PROPFIND', '/:token/', handlePropfindPrincipal)
    app.on('PROPFIND', '/:token/default', handlePropfindCalendar)
    app.on('PROPFIND', '/:token/default/', handlePropfindCalendar)

    const handleReport = async (c: Context<AppEnv>) => {
        try {
        const calendarService = c.get('calendarService')
        const token = c.req.param('token')
        const userId = c.get('caldavUserId')

        const body = await c.req.text()
        console.log('[CalDAV] REPORT Request:\n', body)
        const report = parseReport(body)
        console.log('[CalDAV] Parsed report type:', report.type, 'hrefs:', report.hrefs)
        const timezone = await calendarService.getUserTimezone(userId)
        const domain = new URL(c.req.url).hostname || 'b-calendar'
        const calendarHref = `/caldav/${token}/`

        if (report.type === 'calendar-multiget') {
            const responses: Array<{ href: string; etag: string; calendarData?: string; status?: number }> = []

            for (const href of report.hrefs) {
                const uid = href.split('/').pop()?.replace('.ics', '').replace(/%40/g, '@') ?? ''
                const searchUid = uid.split('@')[0]
                console.log('[CalDAV] calendar-multiget: looking for uid:', searchUid)
                const event = await calendarService.getEventByUid(userId, searchUid)

                if (event) {
                    console.log('[CalDAV] calendar-multiget: found event:', event.summary)
                    const icsContent = eventsToICS([event], 'Calendar', domain, timezone)
                    console.log('[CalDAV] calendar-multiget: ICS content:\n', icsContent.substring(0, 500))
                    responses.push({ href, etag: calendarService.getEventEtag(event), calendarData: icsContent })
                } else {
                    console.log('[CalDAV] calendar-multiget: event NOT FOUND for uid:', searchUid)
                    responses.push({ href, etag: '', status: 404 })
                }
            }

            const xml = buildCalendarDataResponse(responses)
            console.log('[CalDAV] calendar-multiget Response:\n', xml.substring(0, 1000))
            return new Response(xml, {
                status: 207,
                headers: { 'Content-Type': 'application/xml; charset=utf-8' },
            })
        }

        if (report.type === 'calendar-query') {
            const events = await calendarService.getAllEvents(userId)
            console.log('[CalDAV] calendar-query: found', events.length, 'events')
            const responses: Array<{ href: string; etag: string; calendarData?: string }> = []

            for (const event of events) {
                const icsContent = eventsToICS([event], 'Calendar', domain, timezone)
                const eventId = event.uid.split('@')[0]
                responses.push({ href: `${calendarHref}${eventId}.ics`, etag: calendarService.getEventEtag(event), calendarData: icsContent })
            }

            const xml = buildCalendarDataResponse(responses)
            console.log('[CalDAV] calendar-query Response:\n', xml.substring(0, 500))
            return new Response(xml, {
                status: 207,
                headers: { 'Content-Type': 'application/xml; charset=utf-8' },
            })
        }

        if (report.type === 'sync-collection') {
            const caldavService = c.get('caldavService')
            const syncResult = await caldavService.getChangesFromToken(userId, report.syncToken || null)
            console.log('[CalDAV] sync-collection: found', syncResult.changed.length, 'changed,', syncResult.deleted.length, 'deleted')

            const changedResponses = syncResult.changed.map((event) => {
                const eventId = event.uid.split('@')[0]
                return `  <D:response>
    <D:href>${calendarHref}${eventId}.ics</D:href>
    <D:propstat>
      <D:prop>
        <D:getetag>"${calendarService.getEventEtag(event)}"</D:getetag>
        <D:getcontenttype>text/calendar; component=vevent</D:getcontenttype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`
            })

            const deletedResponses = syncResult.deleted.map((uid) => {
                const eventId = uid.split('@')[0]
                return `  <D:response>
    <D:href>${calendarHref}${eventId}.ics</D:href>
    <D:status>HTTP/1.1 404 Not Found</D:status>
  </D:response>`
            })

            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="DAV:">
${[...changedResponses, ...deletedResponses].join('\n')}
  <D:sync-token>${syncResult.syncToken}</D:sync-token>
</D:multistatus>`
            console.log('[CalDAV] sync-collection Response:\n', xml.substring(0, 500))
            return new Response(xml, {
                status: 207,
                headers: { 'Content-Type': 'application/xml; charset=utf-8' },
            })
        }

        if (report.type === 'free-busy-query') {
            const caldavService = c.get('caldavService')
            if (!report.timeRange) {
                return c.text('Missing time-range', 400)
            }

            const start = new Date(report.timeRange.start)
            const end = new Date(report.timeRange.end)
            const periods = await caldavService.getFreeBusy(userId, start, end)
            const ics = caldavService.generateFreeBusyICS(periods, start, end)

            console.log('[CalDAV] free-busy-query Response')
            return new Response(ics, {
                status: 200,
                headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
            })
        }

        console.log('[CalDAV] Unknown report type:', report.type)
        return c.text('Unknown report type', 400)
        } catch (err) {
            console.error('[CalDAV] REPORT error:', err)
            return c.text('Internal error', 500)
        }
    }

    app.on('REPORT', '/:token', handleReport)
    app.on('REPORT', '/:token/', handleReport)
    app.on('REPORT', '/:token/default', handleReport)
    app.on('REPORT', '/:token/default/', handleReport)

    const handleProppatch = (c: Context<AppEnv>) => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>${c.req.path}</D:href>
    <D:propstat>
      <D:prop/>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`
        return new Response(xml, { status: 207, headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
    }

    app.on('PROPPATCH', '/:token', handleProppatch)
    app.on('PROPPATCH', '/:token/', handleProppatch)
    app.on('PROPPATCH', '/:token/*', handleProppatch)

    const handleMkcalendar = (c: Context<AppEnv>) => {
        return c.body(null, 201)
    }

    app.on('MKCALENDAR', '/:token/*', handleMkcalendar)

    const handleGetCalendar = async (c: Context<AppEnv>) => {
        const calendarService = c.get('calendarService')
        const userId = c.get('caldavUserId')
        const subscription = c.get('caldavSubscription')

        const events = await calendarService.getAllEvents(userId)
        const timezone = await calendarService.getUserTimezone(userId)
        const domain = new URL(c.req.url).hostname || 'b-calendar'
        const icsContent = eventsToICS(events, subscription.name ?? 'My Calendar', domain, timezone)

        return new Response(icsContent, {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                ...DAV_HEADERS,
            },
        })
    }

    app.get('/:token', handleGetCalendar)
    app.get('/:token/', handleGetCalendar)
    app.get('/:token/default', handleGetCalendar)
    app.get('/:token/default/', handleGetCalendar)

    app.get('/:token/default/:uid', async (c) => {
        const calendarService = c.get('calendarService')
        const userId = c.get('caldavUserId')
        const uid = c.req.param('uid').replace('.ics', '')

        const event = await calendarService.getEventByUid(userId, uid.split('@')[0])
        if (!event) {
            return c.text('Event not found', 404)
        }

        const timezone = await calendarService.getUserTimezone(userId)
        const domain = new URL(c.req.url).hostname || 'b-calendar'
        const icsContent = eventsToICS([event], 'Calendar', domain, timezone)

        c.header('Content-Type', 'text/calendar; charset=utf-8')
        c.header('ETag', `"${calendarService.getEventEtag(event)}"`)
        return c.body(icsContent)
    })

    app.put('/:token/default/:uid', async (c) => {
        const calendarService = c.get('calendarService')
        const userId = c.get('caldavUserId')
        const icsData = await c.req.text()
        const parsed = parseICS(icsData)

        if (!parsed) {
            return c.text('Invalid ICS data', 400)
        }

        const eventUid = parsed.uid.includes('@') ? parsed.uid.split('@')[0] : parsed.uid

        const { event, created } = await calendarService.upsertEventByUid(userId, eventUid, {
            summary: parsed.summary,
            description: parsed.description,
            location: parsed.location,
            dtstart: parsed.dtstart,
            dtend: parsed.dtend,
            isAllDay: parsed.isAllDay,
            rrule: parsed.rrule,
            status: parsed.status,
            transp: parsed.transp,
            priority: parsed.priority,
            categories: parsed.categories,
        })

        c.header('ETag', `"${calendarService.getEventEtag(event)}"`)
        return created ? c.body(null, 201) : c.body(null, 204)
    })

    app.delete('/:token/default/:uid', async (c) => {
        const calendarService = c.get('calendarService')
        const userId = c.get('caldavUserId')
        const uid = c.req.param('uid').replace('.ics', '').split('@')[0]
        console.log('[CalDAV] DELETE event (default):', uid)

        await calendarService.deleteEvent(userId, uid)
        console.log('[CalDAV] DELETE success (default)')
        return c.body(null, 204)
    })

    const getEventHandler = async (c: Context<AppEnv>) => {
        const calendarService = c.get('calendarService')
        const userId = c.get('caldavUserId')
        const uid = c.req.param('uid').replace('.ics', '').split('@')[0]
        console.log('[CalDAV] GET event:', uid)

        const event = await calendarService.getEventByUid(userId, uid)
        if (!event) {
            return c.text('Event not found', 404)
        }

        const timezone = await calendarService.getUserTimezone(userId)
        const domain = new URL(c.req.url).hostname || 'b-calendar'
        const icsContent = eventsToICS([event], 'Calendar', domain, timezone)

        return new Response(icsContent, {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'ETag': `"${calendarService.getEventEtag(event)}"`,
            },
        })
    }

    const putEventHandler = async (c: Context<AppEnv>) => {
        try {
            const calendarService = c.get('calendarService')
            const userId = c.get('caldavUserId')
            const icsData = await c.req.text()
            console.log('[CalDAV] PUT event, ICS data length:', icsData.length)
            console.log('[CalDAV] PUT event, ICS data:\n', icsData)
            const parsed = parseICS(icsData)

            if (!parsed) {
                console.log('[CalDAV] PUT: Invalid ICS data')
                return c.text('Invalid ICS data', 400)
            }

            const eventUid = parsed.uid.includes('@') ? parsed.uid.split('@')[0] : parsed.uid
            console.log('[CalDAV] PUT: parsed uid:', eventUid, 'summary:', parsed.summary)
            console.log('[CalDAV] PUT: parsed dtstart:', parsed.dtstart, 'dtend:', parsed.dtend, 'isAllDay:', parsed.isAllDay)

            const { event, created } = await calendarService.upsertEventByUid(userId, eventUid, {
                summary: parsed.summary,
                description: parsed.description,
                location: parsed.location,
                dtstart: parsed.dtstart,
                dtend: parsed.dtend,
                isAllDay: parsed.isAllDay,
                rrule: parsed.rrule,
                status: parsed.status,
                transp: parsed.transp,
                priority: parsed.priority,
                categories: parsed.categories,
            })

            console.log('[CalDAV] PUT: success, created:', created)
            return new Response(null, {
                status: created ? 201 : 204,
                headers: { 'ETag': `"${calendarService.getEventEtag(event)}"` },
            })
        } catch (err) {
            console.error('[CalDAV] PUT error:', err)
            return c.text('Internal error', 500)
        }
    }

    const deleteEventHandler = async (c: Context<AppEnv>) => {
        const calendarService = c.get('calendarService')
        const userId = c.get('caldavUserId')
        const uid = c.req.param('uid').replace('.ics', '').split('@')[0]
        console.log('[CalDAV] DELETE event:', uid)

        await calendarService.deleteEvent(userId, uid)
        console.log('[CalDAV] DELETE success')
        return c.body(null, 204)
    }

    app.get('/:token/:uid', getEventHandler)
    app.put('/:token/:uid', putEventHandler)
    app.delete('/:token/:uid', deleteEventHandler)

    return app
}
