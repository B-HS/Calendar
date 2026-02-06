import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { db } from '@db/index'
import { createCalendarService } from '@service/calendar'
import { createCaldavService } from '@service/caldav'
import { initMiddleware, type AppEnv } from '@middleware/index'
import { initRoutes } from '@route/index'

const app = new OpenAPIHono<AppEnv>()

const calendarService = createCalendarService({ db })
const caldavService = createCaldavService({ db })

initMiddleware(app, { calendarService, caldavService })
initRoutes(app)

app.doc('/api/openapi', {
    openapi: '3.0.0',
    info: {
        title: 'B-Calendar API',
        version: '1.0.0',
        description: `B-Calendar는 RFC 5545(iCalendar), RFC 4791(CalDAV), RFC 6578(WebDAV Sync)를 준수하는 캘린더 서버입니다.

## 주요 기능
- **이벤트 관리**: 캘린더 이벤트의 생성, 조회, 수정, 삭제
- **반복 이벤트**: RRULE을 사용한 복잡한 반복 패턴 지원
- **CalDAV 동기화**: Apple 캘린더, Outlook, Thunderbird 등과 양방향 동기화
- **ICS 피드**: Google 캘린더 등에서 읽기 전용 구독 지원

## 인증 방식
- 웹 UI: Better Auth 기반 세션 인증
- CalDAV/ICS: 토큰 기반 URL 인증 (별도 로그인 불필요)

## 지원 클라이언트
| 클라이언트 | 프로토콜 | 동기화 방향 |
|------------|----------|-------------|
| Apple 캘린더 (iOS/macOS) | CalDAV | 양방향 |
| Microsoft Outlook | CalDAV | 양방향 |
| Mozilla Thunderbird | CalDAV | 양방향 |
| Google 캘린더 | ICS | 단방향 (읽기 전용) |
| 기타 ICS 지원 앱 | ICS | 단방향 (읽기 전용) |

## API 엔드포인트 개요
- \`/api/events\`: 이벤트 CRUD 작업
- \`/api/calendar/subscription\`: 구독 및 토큰 관리
- \`/api/calendar/:token\`: ICS 피드 (읽기 전용)
- \`/caldav/:token/\`: CalDAV 프로토콜 엔드포인트`,
    },
    tags: [
        {
            name: 'Events',
            description: `캘린더 이벤트를 관리하는 API입니다.

이벤트의 생성, 조회, 수정, 삭제 기능을 제공합니다. 모든 이벤트는 RFC 5545 iCalendar 형식과 호환되며, CalDAV 클라이언트와 자동으로 동기화됩니다.

반복 이벤트, 종일 이벤트, 카테고리, 우선순위 등 다양한 속성을 지원합니다.`,
        },
        {
            name: 'Subscription',
            description: `캘린더 구독과 접근 토큰을 관리하는 API입니다.

각 사용자는 하나의 구독을 가지며, 구독에는 두 종류의 토큰이 포함됩니다:
- **CalDAV 토큰**: 읽기/쓰기 가능, Apple 캘린더/Outlook용
- **ICS 토큰**: 읽기 전용, Google 캘린더 구독용

토큰이 노출된 경우 재생성 기능을 사용하여 새 토큰으로 교체할 수 있습니다.`,
        },
    ],
})

app.get('/api/docs', swaggerUI({ url: '/api/openapi' }))

export default {
    port: process.env.API_PORT || 4000,
    fetch: app.fetch,
}
