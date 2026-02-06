import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import type { AppEnv } from '@middleware/index'
import {
    CalendarEventSchema,
    CreateEventSchema,
    UpdateEventSchema,
    EventParamsSchema,
    MonthQuerySchema,
    EventListSchema,
} from '@schema/event'
import { ErrorSchema } from '@schema/common'

const eventToResponse = (event: {
    uid: string
    summary: string
    description?: string
    location?: string
    dtstart: Date
    dtend: Date
    isAllDay: boolean
    rrule?: { freq: string; interval?: number; count?: number; until?: Date; byDay?: string[]; byMonth?: number[]; byMonthDay?: number[] }
    exdate?: string[]
    status?: string
    transp?: string
    priority?: number
    categories?: string[]
    color?: string
    sequence?: number
    created?: Date
    lastModified?: Date
}) => ({
    uid: event.uid,
    summary: event.summary,
    description: event.description,
    location: event.location,
    dtstart: event.dtstart.toISOString(),
    dtend: event.dtend.toISOString(),
    isAllDay: event.isAllDay,
    rrule: event.rrule
        ? {
              freq: event.rrule.freq as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
              interval: event.rrule.interval,
              count: event.rrule.count,
              until: event.rrule.until?.toISOString(),
              byDay: event.rrule.byDay,
              byMonth: event.rrule.byMonth,
              byMonthDay: event.rrule.byMonthDay,
          }
        : undefined,
    exdate: event.exdate,
    status: event.status as 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED' | undefined,
    transp: event.transp as 'TRANSPARENT' | 'OPAQUE' | undefined,
    priority: event.priority,
    categories: event.categories,
    color: event.color,
    sequence: event.sequence,
    created: event.created?.toISOString(),
    lastModified: event.lastModified?.toISOString(),
})

const getEventsRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['Events'],
    summary: '월별 이벤트 조회',
    description: `특정 년/월에 해당하는 모든 캘린더 이벤트를 조회합니다.

## 사용 방법
- year와 month 쿼리 파라미터를 필수로 전달해야 합니다.
- month는 JavaScript Date 객체와 동일하게 0-11 범위입니다 (0=1월, 11=12월).

## 반복 이벤트 처리
- 반복 이벤트의 경우 원본 이벤트만 반환됩니다.
- 개별 반복 인스턴스는 클라이언트에서 rrule을 기반으로 계산해야 합니다.
- exdate 필드에 지정된 날짜는 반복에서 제외해야 합니다.

## 응답 예시
- 이벤트가 없는 달에는 빈 배열 \`[]\`이 반환됩니다.
- 해당 월에 시작되거나 종료되는 모든 이벤트가 포함됩니다.`,
    request: {
        query: MonthQuerySchema,
    },
    responses: {
        200: {
            content: { 'application/json': { schema: EventListSchema } },
            description: '조회된 이벤트 목록입니다. 이벤트가 없으면 빈 배열이 반환됩니다.',
        },
        401: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '인증되지 않은 요청입니다. 유효한 세션 쿠키 또는 인증 토큰이 필요합니다.',
        },
    },
})

const createEventRoute = createRoute({
    method: 'post',
    path: '/',
    tags: ['Events'],
    summary: '새 이벤트 생성',
    description: `새로운 캘린더 이벤트를 생성합니다.

## 필수 필드
- **summary**: 이벤트 제목 (1-500자)
- **dtstart**: 시작 날짜/시간 (ISO 8601 형식, UTC)
- **dtend**: 종료 날짜/시간 (ISO 8601 형식, UTC)

## 선택 필드
- description, location, isAllDay, rrule, exdate, status, transp, priority, categories, color

## 반복 이벤트 생성
- rrule 필드를 사용하여 반복 규칙을 정의합니다.
- 예: 매주 월/수/금 반복 → \`{"freq": "WEEKLY", "byDay": ["MO", "WE", "FR"]}\`
- 예: 10회 반복 후 종료 → \`{"freq": "DAILY", "count": 10}\`

## 자동 할당 필드
- uid: 고유 식별자 (형식: {랜덤}@b-calendar)
- sequence: 0으로 초기화
- created, lastModified: 현재 시간으로 설정

## CalDAV 동기화
- 생성된 이벤트는 즉시 CalDAV 클라이언트에서 동기화됩니다.`,
    request: {
        body: {
            content: { 'application/json': { schema: CreateEventSchema } },
            required: true,
        },
    },
    responses: {
        201: {
            content: { 'application/json': { schema: CalendarEventSchema } },
            description: '이벤트가 성공적으로 생성되었습니다. 생성된 이벤트의 전체 정보가 반환됩니다.',
        },
        400: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '잘못된 요청입니다. 필수 필드 누락, 형식 오류, 또는 유효성 검사 실패입니다.',
        },
        401: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '인증되지 않은 요청입니다. 유효한 세션 쿠키 또는 인증 토큰이 필요합니다.',
        },
    },
})

const updateEventRoute = createRoute({
    method: 'put',
    path: '/{uid}',
    tags: ['Events'],
    summary: '이벤트 수정',
    description: `기존 캘린더 이벤트를 수정합니다.

## 부분 업데이트 지원
- 변경하려는 필드만 요청 본문에 포함하면 됩니다.
- 포함되지 않은 필드는 기존 값이 유지됩니다.
- null을 명시적으로 전송하면 해당 필드가 삭제됩니다.

## 예시
- 제목만 변경: \`{"summary": "새 제목"}\`
- 설명 삭제: \`{"description": null}\`
- 반복 규칙 제거 (일회성으로 변경): \`{"rrule": null}\`

## 자동 갱신 필드
- sequence: 기존 값에서 1 증가
- lastModified: 현재 시간으로 갱신

## 주의사항
- uid는 URL 경로에서 지정하며, 요청 본문에는 포함하지 않습니다.
- @b-calendar 접미사는 생략 가능합니다.
- 존재하지 않는 uid로 요청하면 404 오류가 반환됩니다.

## CalDAV 동기화
- 수정된 이벤트는 sequence 증가로 CalDAV 클라이언트에 변경 알림이 전달됩니다.`,
    request: {
        params: EventParamsSchema,
        body: {
            content: { 'application/json': { schema: UpdateEventSchema } },
            required: true,
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: CalendarEventSchema } },
            description: '이벤트가 성공적으로 수정되었습니다. 수정된 이벤트의 전체 정보가 반환됩니다.',
        },
        400: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '잘못된 요청입니다. 형식 오류 또는 유효성 검사 실패입니다.',
        },
        401: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '인증되지 않은 요청입니다. 유효한 세션 쿠키 또는 인증 토큰이 필요합니다.',
        },
        404: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '이벤트를 찾을 수 없습니다. 지정된 uid에 해당하는 이벤트가 존재하지 않습니다.',
        },
    },
})

const deleteEventRoute = createRoute({
    method: 'delete',
    path: '/{uid}',
    tags: ['Events'],
    summary: '이벤트 삭제',
    description: `캘린더 이벤트를 영구적으로 삭제합니다.

## 사용 방법
- URL 경로에 삭제할 이벤트의 uid를 지정합니다.
- @b-calendar 접미사는 생략 가능합니다.
- 요청 본문은 필요 없습니다.

## 반복 이벤트 삭제
- 반복 이벤트를 삭제하면 모든 반복 인스턴스가 함께 삭제됩니다.
- 특정 인스턴스만 제외하려면 삭제 대신 이벤트 수정 API를 사용하여 exdate 필드에 제외할 날짜를 추가하세요.

## 삭제 취소
- 삭제된 이벤트는 복구할 수 없습니다.
- 삭제 전 확인이 필요한 경우 클라이언트에서 처리해야 합니다.

## CalDAV 동기화
- 삭제된 이벤트 정보는 CalDAV sync-collection에서 404 응답으로 반환됩니다.
- CalDAV 클라이언트는 이를 통해 로컬 캐시에서도 이벤트를 삭제합니다.

## 응답
- 성공 시 204 No Content가 반환됩니다 (응답 본문 없음).`,
    request: {
        params: EventParamsSchema,
    },
    responses: {
        204: {
            description: '이벤트가 성공적으로 삭제되었습니다. 응답 본문은 없습니다.',
        },
        401: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '인증되지 않은 요청입니다. 유효한 세션 쿠키 또는 인증 토큰이 필요합니다.',
        },
        404: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '이벤트를 찾을 수 없습니다. 지정된 uid에 해당하는 이벤트가 존재하지 않거나 이미 삭제되었습니다.',
        },
    },
})

export const createEventsRoute = () => {
    const app = new OpenAPIHono<AppEnv>()

    app.openapi(getEventsRoute, async (c) => {
        const session = c.get('session')
        const calendarService = c.get('calendarService')
        const { year, month } = c.req.valid('query')

        const events = await calendarService.getEventsByMonth(session.user.id, year, month)
        return c.json(events.map(eventToResponse), 200)
    })

    app.openapi(createEventRoute, async (c) => {
        const session = c.get('session')
        const calendarService = c.get('calendarService')
        const data = c.req.valid('json')

        const event = await calendarService.createEvent(session.user.id, {
            summary: data.summary,
            description: data.description,
            location: data.location,
            dtstart: new Date(data.dtstart),
            dtend: new Date(data.dtend),
            isAllDay: data.isAllDay,
            rrule: data.rrule
                ? {
                      freq: data.rrule.freq,
                      interval: data.rrule.interval,
                      count: data.rrule.count,
                      until: data.rrule.until ? new Date(data.rrule.until) : undefined,
                      byDay: data.rrule.byDay,
                      byMonth: data.rrule.byMonth,
                      byMonthDay: data.rrule.byMonthDay,
                  }
                : undefined,
            exdate: data.exdate,
            status: data.status,
            transp: data.transp,
            priority: data.priority,
            categories: data.categories,
            color: data.color,
        })

        return c.json(eventToResponse(event), 201)
    })

    app.openapi(updateEventRoute, async (c) => {
        const session = c.get('session')
        const calendarService = c.get('calendarService')
        const { uid } = c.req.valid('param')
        const data = c.req.valid('json')

        const existing = await calendarService.getEventByUid(session.user.id, uid)
        if (!existing) {
            return c.json({ error: 'Event not found' }, 404)
        }

        const event = await calendarService.updateEvent(session.user.id, {
            uid: existing.uid,
            summary: data.summary ?? existing.summary,
            description: data.description !== undefined ? (data.description ?? undefined) : existing.description,
            location: data.location !== undefined ? (data.location ?? undefined) : existing.location,
            dtstart: data.dtstart ? new Date(data.dtstart) : existing.dtstart,
            dtend: data.dtend ? new Date(data.dtend) : existing.dtend,
            isAllDay: data.isAllDay ?? existing.isAllDay,
            rrule:
                data.rrule !== undefined
                    ? data.rrule
                        ? {
                              freq: data.rrule.freq,
                              interval: data.rrule.interval,
                              count: data.rrule.count,
                              until: data.rrule.until ? new Date(data.rrule.until) : undefined,
                              byDay: data.rrule.byDay,
                              byMonth: data.rrule.byMonth,
                              byMonthDay: data.rrule.byMonthDay,
                          }
                        : undefined
                    : existing.rrule,
            exdate: data.exdate !== undefined ? (data.exdate ?? undefined) : existing.exdate,
            status: data.status !== undefined ? (data.status ?? undefined) : existing.status,
            transp: data.transp !== undefined ? (data.transp ?? undefined) : existing.transp,
            priority: data.priority !== undefined ? (data.priority ?? undefined) : existing.priority,
            categories: data.categories !== undefined ? (data.categories ?? undefined) : existing.categories,
            color: data.color !== undefined ? (data.color ?? undefined) : existing.color,
            sequence: existing.sequence,
        })

        return c.json(eventToResponse(event), 200)
    })

    app.openapi(deleteEventRoute, async (c) => {
        const session = c.get('session')
        const calendarService = c.get('calendarService')
        const { uid } = c.req.valid('param')

        await calendarService.deleteEvent(session.user.id, uid)
        return c.body(null, 204)
    })

    return app
}
