import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import type { AppEnv } from '@middleware/index'
import { generateMobileConfig } from '@utils/mobileconfig'
import {
    SubscriptionResponseSchema,
    CreateSubscriptionSchema,
    RegenerateTokenResponseSchema,
    RegenerateIcsTokenResponseSchema,
} from '@schema/subscription'
import { ErrorSchema } from '@schema/common'

const getSubscriptionRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['Subscription'],
    summary: '구독 정보 조회',
    description: `현재 로그인한 사용자의 캘린더 구독 정보를 조회합니다.

## 응답 내용
- **token**: CalDAV 접근용 토큰 (읽기/쓰기 가능)
- **icsToken**: ICS 피드용 토큰 (읽기 전용)
- **name**: 캘린더 이름
- **caldavUrl**: CalDAV 클라이언트용 URL
- **icsUrl**: ICS 구독용 URL

## CalDAV URL 사용법 (Apple 캘린더, Outlook, Thunderbird)
1. caldavUrl을 복사합니다.
2. 캘린더 앱에서 "CalDAV 계정 추가"를 선택합니다.
3. 서버 URL에 caldavUrl을 붙여넣습니다.
4. 사용자 이름과 비밀번호는 입력하지 않아도 됩니다 (토큰 기반 인증).

## ICS URL 사용법 (Google 캘린더)
1. icsUrl을 복사합니다.
2. Google 캘린더에서 "다른 캘린더" → "URL로 추가"를 선택합니다.
3. icsUrl을 붙여넣습니다.
4. 읽기 전용으로 캘린더가 구독됩니다.

## 구독이 없는 경우
- 404 오류가 반환됩니다.
- POST /api/calendar/subscription을 호출하여 구독을 생성하세요.`,
    responses: {
        200: {
            content: { 'application/json': { schema: SubscriptionResponseSchema } },
            description: '구독 정보가 성공적으로 조회되었습니다. CalDAV URL과 ICS URL이 포함됩니다.',
        },
        401: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '인증되지 않은 요청입니다. 로그인이 필요합니다.',
        },
        404: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '구독이 존재하지 않습니다. POST 요청으로 구독을 먼저 생성해야 합니다.',
        },
    },
})

const postSubscriptionRoute = createRoute({
    method: 'post',
    path: '/',
    tags: ['Subscription'],
    summary: '구독 생성',
    description: `새로운 캘린더 구독을 생성하거나 기존 구독을 반환합니다.

## 기능 설명
- 사용자당 하나의 구독만 존재할 수 있습니다.
- 이미 구독이 있는 경우 기존 구독 정보가 반환됩니다 (멱등성 보장).
- 새 구독 생성 시 CalDAV 토큰과 ICS 토큰이 각각 자동 생성됩니다.

## 요청 본문 (선택사항)
- **name**: 캘린더 이름 (선택, 기본값: "B-Calendar")
- 빈 객체 \`{}\`를 전송하거나 본문 없이 요청해도 됩니다.

## 토큰 종류
1. **CalDAV 토큰 (token)**
   - 64자 16진수 문자열
   - 읽기/쓰기 모두 가능
   - Apple 캘린더, Outlook 등 CalDAV 클라이언트용
   - 양방향 동기화 지원

2. **ICS 토큰 (icsToken)**
   - 64자 16진수 문자열
   - 읽기 전용
   - Google 캘린더 등 ICS 구독용
   - 단방향 동기화 (서버 → 클라이언트)

## 보안 참고사항
- 토큰이 노출되면 /regenerate 또는 /regenerate-ics 엔드포인트를 사용하여 재생성하세요.
- CalDAV 토큰은 읽기/쓰기 권한이 있으므로 더 주의해서 관리해야 합니다.`,
    request: {
        body: {
            content: { 'application/json': { schema: CreateSubscriptionSchema } },
            required: false,
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: SubscriptionResponseSchema } },
            description: '구독이 생성되었거나 기존 구독이 반환되었습니다. 두 경우 모두 동일한 형식의 응답입니다.',
        },
        401: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '인증되지 않은 요청입니다. 로그인이 필요합니다.',
        },
    },
})

const regenerateTokenRoute = createRoute({
    method: 'post',
    path: '/regenerate',
    tags: ['Subscription'],
    summary: 'CalDAV 토큰 재생성',
    description: `CalDAV 접근용 토큰을 새로 생성합니다.

## 사용 시기
- CalDAV 토큰이 외부에 노출되었을 때
- 주기적인 보안 강화를 위해
- 특정 기기의 접근을 차단하고 싶을 때

## 동작 방식
1. 새로운 64자 16진수 토큰이 생성됩니다.
2. 기존 토큰은 즉시 무효화됩니다.
3. caldavUrl이 변경됩니다.

## ⚠️ 주의사항
- 기존 토큰으로 설정된 모든 CalDAV 클라이언트의 동기화가 중단됩니다.
- Apple 캘린더, Outlook 등에서 기존 계정을 삭제하고 새 URL로 다시 설정해야 합니다.
- iOS/macOS의 경우 mobileconfig를 다시 설치하는 것이 편리합니다.
- ICS 토큰은 영향받지 않습니다 (icsUrl은 그대로 유지).

## 클라이언트별 대응 방법
- **Apple 캘린더 (macOS)**: 시스템 환경설정 → 인터넷 계정 → 기존 계정 삭제 → 새로 추가
- **Apple 캘린더 (iOS)**: /mobileconfig 다운로드 후 설치
- **Outlook**: 계정 설정에서 서버 URL 변경
- **Thunderbird**: 캘린더 속성에서 URL 변경`,
    responses: {
        200: {
            content: { 'application/json': { schema: RegenerateTokenResponseSchema } },
            description: '새 CalDAV 토큰이 생성되었습니다. 응답에 새 토큰이 포함됩니다.',
        },
        401: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '인증되지 않은 요청입니다. 로그인이 필요합니다.',
        },
    },
})

const regenerateIcsTokenRoute = createRoute({
    method: 'post',
    path: '/regenerate-ics',
    tags: ['Subscription'],
    summary: 'ICS 토큰 재생성',
    description: `ICS 피드용 읽기 전용 토큰을 새로 생성합니다.

## 사용 시기
- ICS URL이 외부에 노출되었을 때
- Google 캘린더 등 외부 서비스와의 공유를 취소하고 싶을 때
- 주기적인 보안 강화를 위해

## 동작 방식
1. 새로운 64자 16진수 토큰이 생성됩니다.
2. 기존 ICS 토큰은 즉시 무효화됩니다.
3. icsUrl이 변경됩니다.

## ⚠️ 주의사항
- 기존 icsUrl로 구독 중인 모든 캘린더의 동기화가 중단됩니다.
- Google 캘린더 등에서 기존 구독을 삭제하고 새 URL로 다시 추가해야 합니다.
- CalDAV 토큰은 영향받지 않습니다 (caldavUrl은 그대로 유지).

## ICS vs CalDAV 토큰 비교
| 구분 | ICS 토큰 | CalDAV 토큰 |
|------|----------|-------------|
| 권한 | 읽기 전용 | 읽기/쓰기 |
| 용도 | Google 캘린더 구독 | Apple/Outlook 동기화 |
| 노출 위험도 | 낮음 (읽기만 가능) | 높음 (수정/삭제 가능) |
| 동기화 방향 | 단방향 (서버→클라이언트) | 양방향 |`,
    responses: {
        200: {
            content: { 'application/json': { schema: RegenerateIcsTokenResponseSchema } },
            description: '새 ICS 토큰이 생성되었습니다. 응답에 새 토큰이 포함됩니다.',
        },
        401: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '인증되지 않은 요청입니다. 로그인이 필요합니다.',
        },
    },
})

const getMobileconfigRoute = createRoute({
    method: 'get',
    path: '/mobileconfig',
    tags: ['Subscription'],
    summary: 'mobileconfig 다운로드',
    description: `Apple 기기용 CalDAV 자동 설정 프로필(.mobileconfig)을 다운로드합니다.

## mobileconfig란?
- Apple에서 제공하는 설정 프로필 형식입니다.
- iOS/iPadOS/macOS에서 복잡한 설정을 자동으로 적용할 수 있습니다.
- 사용자가 CalDAV 서버 URL을 직접 입력할 필요가 없습니다.

## 지원 기기
- iPhone (iOS 14 이상 권장)
- iPad (iPadOS 14 이상 권장)
- Mac (macOS 11 Big Sur 이상 권장)

## 설치 방법

### iPhone/iPad
1. Safari에서 이 엔드포인트에 접속합니다 (로그인 필요).
2. 파일이 다운로드되면 "프로필이 다운로드됨" 알림이 표시됩니다.
3. 설정 앱 → 일반 → VPN 및 기기 관리로 이동합니다.
4. "다운로드된 프로필"에서 B-Calendar 프로필을 탭합니다.
5. "설치"를 탭하고 기기 암호를 입력합니다.
6. 캘린더 앱에서 B-Calendar가 자동으로 나타납니다.

### Mac
1. Safari에서 이 엔드포인트에 접속합니다 (로그인 필요).
2. 다운로드된 .mobileconfig 파일을 더블클릭합니다.
3. 시스템 환경설정이 열리면 "설치"를 클릭합니다.
4. 관리자 암호를 입력합니다.
5. 캘린더 앱에서 B-Calendar가 자동으로 나타납니다.

## 프로필 제거
- 설정 → 일반 → VPN 및 기기 관리에서 프로필을 제거할 수 있습니다.
- 프로필 제거 시 해당 캘린더의 모든 로컬 데이터가 삭제됩니다.

## 토큰 재생성 시
- CalDAV 토큰을 재생성하면 mobileconfig를 다시 설치해야 합니다.
- 기존 프로필을 먼저 제거한 후 새 프로필을 설치하세요.`,
    responses: {
        200: {
            content: { 'application/x-apple-aspen-config': { schema: { type: 'string' } } },
            description: 'mobileconfig 파일이 다운로드됩니다. Content-Disposition 헤더에 파일명(b-calendar.mobileconfig)이 포함됩니다.',
        },
        401: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '인증되지 않은 요청입니다. 로그인이 필요합니다.',
        },
        404: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: '구독이 존재하지 않습니다. POST /api/calendar/subscription으로 구독을 먼저 생성해야 합니다.',
        },
    },
})

export const createSubscriptionRoute = () => {
    const app = new OpenAPIHono<AppEnv>()

    app.openapi(getSubscriptionRoute, async (c) => {
        const session = c.get('session')
        const calendarService = c.get('calendarService')

        const subscription = await calendarService.getSubscription(session.user.id)
        if (!subscription) {
            return c.json({ error: 'Subscription not found' }, 404)
        }

        const host = c.req.header('X-Forwarded-Host') || c.req.header('Host') || 'localhost:3000'
        const proto = c.req.header('X-Forwarded-Proto') || (host.includes('localhost') ? 'http' : 'https')
        const baseUrl = `${proto}://${host}`

        return c.json(
            {
                token: subscription.token,
                icsToken: subscription.icsToken,
                name: subscription.name,
                caldavUrl: `${baseUrl}/caldav/${subscription.token}/`,
                icsUrl: `${baseUrl}/api/calendar/${subscription.icsToken}`,
            },
            200,
        )
    })

    app.openapi(postSubscriptionRoute, async (c) => {
        const session = c.get('session')
        const calendarService = c.get('calendarService')

        const body = await c.req.json().catch(() => ({}))
        const subscription = await calendarService.createSubscription(session.user.id, body?.name)

        const host = c.req.header('X-Forwarded-Host') || c.req.header('Host') || 'localhost:3000'
        const proto = c.req.header('X-Forwarded-Proto') || (host.includes('localhost') ? 'http' : 'https')
        const baseUrl = `${proto}://${host}`

        return c.json(
            {
                token: subscription.token,
                icsToken: subscription.icsToken,
                name: subscription.name,
                caldavUrl: `${baseUrl}/caldav/${subscription.token}/`,
                icsUrl: `${baseUrl}/api/calendar/${subscription.icsToken}`,
            },
            200,
        )
    })

    app.openapi(regenerateTokenRoute, async (c) => {
        const session = c.get('session')
        const calendarService = c.get('calendarService')

        const token = await calendarService.regenerateSubscriptionToken(session.user.id)
        return c.json({ token }, 200)
    })

    app.openapi(regenerateIcsTokenRoute, async (c) => {
        const session = c.get('session')
        const calendarService = c.get('calendarService')

        const icsToken = await calendarService.regenerateIcsToken(session.user.id)
        return c.json({ icsToken }, 200)
    })

    app.openapi(getMobileconfigRoute, async (c) => {
        const session = c.get('session')
        const calendarService = c.get('calendarService')

        const subscription = await calendarService.getSubscription(session.user.id)
        if (!subscription) {
            return c.json({ error: 'Subscription not found' }, 404)
        }

        const host = c.req.header('X-Forwarded-Host') || c.req.header('Host') || 'localhost:3000'
        const proto = c.req.header('X-Forwarded-Proto') || (host.includes('localhost') ? 'http' : 'https')
        const baseUrl = `${proto}://${host}`

        const serverUrl = `${baseUrl}/caldav/${subscription.token}/`
        const config = generateMobileConfig({
            serverUrl,
            calendarName: subscription.name ?? 'B-Calendar',
            username: session.user.email,
        })

        return new Response(config, {
            headers: {
                'Content-Type': 'application/x-apple-aspen-config',
                'Content-Disposition': 'attachment; filename="b-calendar.mobileconfig"',
            },
        })
    })

    return app
}
