# 보안 감사·수정 리포트 — bcalendar (2026-07-10)

> Workflow(opus·xhigh) 심층 감사 + medium 이상 적대적 검증 + 근본 수정.

## 감사 발견

### BCAL-001 [medium] uidSchema 가 문자/포맷 제약 없이 서버 fetch URL 경로에 그대로 삽입 → hub API 경로·메서드 혼동 (검증: real=True, 조정 severity=low)
- 파일: `entities/calendar/validate.ts:56 (uidSchema), entities/calendar/api.ts:74-118 (getEventDetail/updateEvent/deleteEventAction), shared/constant/api.ts:4-7` 56
- 설명: uidSchema = z.string().min(1).max(200) 로 길이만 검증하고 문자/형식(../, /, ? 등)을 제약하지 않는다. 이 uid 는 getEventDetailAction/updateEventAction/deleteEventAction 에서 `${API_URL}/api/calendar/events/detail/${uid}` 및 `/api/calendar/events/${uid}` 처럼 서버측 fetch URL 경로에 문자열로 직접 삽입된다. server action 은 클라이언트에서 임의 인자로 호출 가능하므로, 인증된 사용자가 uid 에 `../../mail/accounts` 같은 값을 넣으면 WHATWG URL 파서가 `..` 세그먼트를 정규화해 의도한 캘린더 엔드포인트가 아닌 hub 의 다른 라우트로 요청이 도달한다(HTTP 메서드는 각 action 이 고정: GET/PATCH/DELETE). 즉 hub API 전 표면에 대한 경로·메서드 혼동 프리미티브가 된다.
- 시나리오: 로그인 사용자가 브라우저 콘솔/직접 호출로 deleteEventAction('../../mail/accounts/123') 실행 → 서버측에서 `${API_URL}/api/calendar/events/../../mail/accounts/123` 이 `/api/mail/accounts/123` 로 정규화되어 DELETE 로 hub 에 전달된다. 현재는 hub 의 모든 라우트가 session.user.id 로 소유권을 스코프하고 role 검사를 하므로 교차 사용자/권한 상승은 발생하지 않는다(공격자는 자기 자신으로만 동작). 그러나 프론트 경계가 uid 를 실제 UID 포맷으로 제한하지 않아, 스코프가 약한 라우트가 hub 에 추가되는 순간 즉시 악용 가능한 잠재 결함이며, security.md §2(경계 Zod 검증)·§3(path traversal) 위반이다.
- 운영영향: 현재 실제 침해는 hub 의 사용자 스코프로 차단되나, 경로 혼동으로 예기치 않은 라우트가 호출되면 404/405 남발 및 로그 오염이 발생할 수 있다.

### BCAL-002 [medium] Content-Security-Policy 헤더 전무 (다른 보안 헤더는 존재) (검증: real=True, 조정 severity=low)
- 파일: `next.config.mjs:5-19` 5
- 설명: next.config.mjs 의 headers() 가 X-Frame-Options(DENY), X-Content-Type-Options(nosniff), Referrer-Policy, HSTS, Permissions-Policy 는 설정하지만 Content-Security-Policy 는 전혀 없다(Report-Only 조차 없음). 코드 전수 grep 결과 앱 어디에도 CSP 선언이 없다. 현재 XSS 표면은 낮다 — dangerouslySetInnerHTML/srcdoc/innerHTML 미사용, 이벤트 제목·설명·위치·그룹명은 모두 React 자동 이스케이프로 텍스트 렌더(calendar-event-detail.tsx, calendar-sidebar.tsx). 그러나 CSP 부재는 인젝션 발생 시 완화선(스크립트 출처 제한·인라인 차단)이 없다는 뜻으로, 심층방어 표준 헤더가 빠진 상태다.
- 시나리오: 향후 어떤 컴포넌트가 사용자/외부 콘텐츠를 dangerouslySetInnerHTML 로 렌더하거나 서드파티 스크립트를 도입해 XSS 가 성립하면, CSP 가 없어 임의 인라인/외부 스크립트 실행을 막을 완화 계층이 존재하지 않는다. 또한 img/connect/frame-src 제약이 없어 데이터 유출 채널 제한도 없다.
- 운영영향: connect-src 를 좁게 잡으면 hub API(별도 서브도메인) 호출이 차단될 수 있으므로 NEXT_PUBLIC_API_URL 오리진을 반드시 포함해야 한다. 미포함 시 캘린더 데이터 로딩 전면 실패.

### BCAL-003 [low] verifyCsrf 가 Origin 헤더 부재 시 검사를 통째로 건너뜀 (no-op)
- 파일: `entities/calendar/api.ts:39-47` 42
- 설명: verifyCsrf 는 `if (origin && host)` 조건에서만 originHost !== host 를 비교한다. Origin 헤더가 없으면(null) 블록 전체를 건너뛰어 아무 검증 없이 통과한다. 상태변경 server action(create/update/delete/regenerate)의 CSRF 방어 목적 함수인데, Origin 부재라는 가장 흔한 우회 조건에서 무력화된다. 알려진 의심대로 실제 결함이 맞다.
- 시나리오: 이론상 Origin 없는 상태변경 요청을 흘려보낼 수 있으나 실제 익스플로잇은 이중으로 차단된다: (1) 세션 쿠키가 better-auth 기본 SameSite=Lax(hub 에 override 없음 확인) 이라 교차사이트 POST 에는 쿠키가 실리지 않아 뒤이은 requireAuth 가 401 로 실패하고, (2) Next.js server action 은 자체적으로 Origin↔Host 검증 및 Next-Action 헤더(교차오리진 HTML 폼으로 설정 불가, fetch 커스텀 헤더는 preflight 차단)를 요구한다. 따라서 브라우저 기반 CSRF 는 성립하기 어렵고, 쿠키가 없는 비브라우저 클라이언트는 애초에 피해자 세션이 없다. 결함은 명백하나 realized 위험은 낮음.
- 운영영향: 없음(정상 브라우저 요청은 Origin 을 포함). 다만 서버-투-서버 등 Origin 없는 합법 호출 경로가 생기면 조정 필요.

### BCAL-004 [low] updateEventAction/createSubscriptionAction 입력 바디가 Zod 로 검증되지 않음 (경계 검증 누락)
- 파일: `entities/calendar/api.ts:104-118 (updateEventAction), 173-179 (createSubscriptionAction)` 104
- 설명: updateEventAction 은 uid 만 uidSchema 로 검증하고 input(Partial<CalendarEvent>) 은 스키마 검증 없이 그대로 rest 스프레드해 hub 로 전송한다(eventFormSchema 미적용). createSubscriptionAction 도 name 을 검증 없이 전송한다. createEventAction 은 eventFormSchema.parse 로 검증하는 것과 대비되는 커버리지 공백이다. security.md §2 는 외부 입력을 신뢰 경계에서 Zod 검증하도록 요구한다.
- 시나리오: 인증 사용자가 updateEventAction(uid, {임의필드})로 예상 밖 필드·형식을 hub 로 흘려보낼 수 있다. 현재 hub 가 patchEventBodySchema 로 재검증하고 user 스코프하므로 자기 데이터 한정이라 실제 피해는 제한적이나, 프론트 경계 검증 부재로 잘못된 payload 가 hub 까지 도달한다.
- 운영영향: 검증 누락으로 형식 오류가 hub 라운드트립 뒤에야 실패해 UX 피드백이 늦어질 수 있다.

### BCAL-005 [low] shadcn CLI 가 dependencies 에 위치해 다수의 취약 전이 의존성을 런타임 트리로 끌어옴
- 파일: `package.json:26 ("shadcn": "^4.13.0")` 26
- 설명: bun audit 결과 33건(high 5/moderate 26/low 2) 중 대부분이 shadcn(빌드/스캐폴딩 CLI)의 전이 의존성(@modelcontextprotocol/sdk → express/hono/qs/path-to-regexp/fast-uri/ip-address 등)에서 발생한다. shadcn 은 컴포넌트 추가용 CLI 로 앱 코드에서 import 되지 않음을 grep 으로 확인했으나(런타임 번들 미포함), dependencies 에 있어 프로덕션 설치 트리와 감사 노이즈를 키운다. ai-process §6.6(의존성 다이어트)·security.md §7 관점의 위생 문제.
- 시나리오: 직접적 원격 악용 경로는 아니다(해당 코드가 배포 런타임에 로드되지 않음). 다만 CI/로컬 설치 시 취약 패키지가 설치되고, 향후 누군가 shadcn 하위 모듈을 참조하면 표면이 된다.
- 운영영향: 없음(기능 영향 없이 설치 트리·감사 결과 정리).

### BCAL-006 [info] generateMobileconfig escapeXml 이 XML 무효 제어문자를 걸러내지 않음 (견고성)
- 파일: `features/calendar/caldav-profile-dialog.tsx:31-32` 31
- 설명: escapeXml 은 &, <, >, ", ' 5개 예약 엔티티를 올바른 순서(& 우선)로 모두 이스케이프하므로 XML 인젝션 관점에서는 완전하다 — name/description/username/password/hostname/principalPath 모든 보간값이 이 함수를 거치고, port 는 URL 파서가 숫자 보장, SSL bool 은 startsWith('https') 파생, UUID 는 crypto 로 인젝션 벡터가 없다. 다만 XML 1.0 이 금지하는 C0 제어문자(0x00–0x08,0x0B,0x0C,0x0E–0x1F)를 제거하지 않아, 사용자가 캘린더 이름/설명에 제어문자를 넣으면 생성된 .mobileconfig 가 파싱 불가한 무효 XML 이 된다.
- 시나리오: 사용자가 자신의 캘린더 이름에 제어문자를 포함 → 자기 자신이 다운로드한 프로파일이 iOS/macOS 에서 열리지 않음. 공격자=피해자 동일(자기 입력·자기 기기)이라 보안 영향 없음, 순수 견고성 이슈.
- 운영영향: 드물게 프로파일 다운로드 파일이 손상돼 CalDAV 자동설정이 실패할 수 있음(사용자 재입력으로 회복).

### BCAL-007 [info] CalDAV/ICS 베어러 토큰이 URL·DOM 에 노출 (설계상, hub 발급)
- 파일: `widgets/calendar/calendar-widget.tsx:100-107, features/calendar/calendar-export.tsx:38-43, hyun-hub/route/calendar/subscription.ts:35-46 및 ics.ts` 38
- 설명: subscription.icsUrl 은 hub 에서 `${baseUrl}/api/calendar/${icsToken}` 형태로 토큰을 URL 경로에 담아 발급하며, bcalendar 는 이를 `<a href={icsUrl} download>` 로 렌더하고 CalDAV 토큰을 readOnly Input 과 .mobileconfig 에 표시한다. ICS 라우트(hub ics.ts)는 세션 없이 icsToken 만으로 사용자 전체 이벤트(getAllEvents)를 반환한다. 이는 캘린더 구독 피드의 통상적 설계(소유자 본인에게 자기 토큰 표시)이며 bcalendar 는 표시자일 뿐이다.
- 시나리오: bcalendar 자체로는 제3자 유출 경로가 없다 — 토큰은 소유자에게만 표시되고, 앱 전역 Referrer-Policy=strict-origin-when-cross-origin 이라 교차오리진(api 서브도메인) 이동 시 토큰 경로가 referrer 로 새지 않는다. 다만 URL 내 베어러 토큰 특성상 브라우저 히스토리·서버 액세스 로그에 토큰이 남는 것은 hub 설계의 상수 위험이다.
- 운영영향: 없음(현행 동작 정상). hub 로그 정책에 따라 토큰이 로그에 축적될 수 있음.

## 수정 내역

### BCAL-001 — fixed
- 변경: entities/calendar/validate.ts 의 uidSchema 를 z.string().min(1).max(200) 에서 .regex(/^[A-Za-z0-9._@-]+$/) + .refine((value) => value !== '.' && !value.includes('..')) 로 제한. 이 스키마는 api.ts 의 getEventDetailAction/updateEventAction/deleteEventAction/updateGroupAction/deleteGroupAction 에서 uid·groupId 를 파싱하며, 그 값이 API_PATH.EVENTS.DETAIL(uid) 등 fetch URL 경로에 그대로 삽입된다.
- 근본원인 해결: 제약 없는 문자열이 서버 fetch URL 경로 세그먼트에 raw 삽입돼 경로 조립 오염(path injection)이 가능했다. 실제 UID(`${crypto.randomUUID()}@b-calendar`)와 그룹 id(crypto.randomUUID())는 [A-Za-z0-9-@] 만 사용하므로, 이 규격과 호환되는 화이트리스트 정규식으로 입력을 경계에서 좁혀 근본 차단했다. 정규식만으로는 char class 에 포함된 '.' 때문에 '..' 이 통과하므로, refine 으로 상대경로 세그먼트('.', '..' 포함 문자열)를 추가 거부해 경로 traversal 여지를 닫았다.
- 파일: entities/calendar/validate.ts

## 후속(followUps)

- 방어심화: api.ts 의 API_PATH.EVENTS.DETAIL/UPDATE/DELETE, API_PATH.GROUPS.UPDATE/DELETE 경로 조립부에 encodeURIComponent(uid) 병행 적용 검토. 단 hub 백엔드 라우트(별도 레포, 현재 워크스페이스에 없어 검증 불가)가 URL-encoded 경로 세그먼트를 디코드해 UID/groupId 조회에 정상 매칭하는지 먼저 확인 필요. 확인 전 적용 시 정상 UID('@' → %40) 조회가 깨질 수 있어 보류함.
- groupId 드래그 버그(별도 단계) — 지시대로 이번에 건드리지 않음.

## 검증
- typecheck: bunx tsc --noEmit → 통과 (TSC_OK, 에러 0)
- test: bun test → 68 pass / 0 fail (272 expect, 5 files) — 68 pass 유지. 추가로 scratchpad 스크립트로 정상 UID/groupId 4종 accept·공격벡터 11종('../groups','..','.','a/b','a?b','a#b','공백','개행','탭','빈문자열','201자') reject 확인(ALL_GOOD), 스크립트는 삭제함

## 의존성 취약점
bun audit 실행(bun v1.3.11): 총 33건(high 5 / moderate 26 / low 2). 대부분이 배포 런타임에 로드되지 않는 dev/CLI 전이 의존성에서 발생 — shadcn(dependencies 에 오배치된 CLI) → @modelcontextprotocol/sdk → express/hono/qs/path-to-regexp/fast-uri/ip-address/@hono/node-server, 그리고 eslint·@babel/core·js-yaml·brace-expansion(개발 툴체인). grep 으로 shadcn/hono/express 가 앱 코드에서 import 되지 않음을 확인했으므로 이들은 배포 공격표면이 아니다. 실제 런타임 관련 항목은 2개: (1) better-auth › defu <=6.1.4 — high, __proto__ 프로토타입 오염(단, bcalendar 는 better-auth 를 클라이언트(createAuthClient)로만 사용, 서버 인증은 hub 담당 → 실위험 낮음), (2) postcss <8.5.10 — moderate, CSS Stringify </style> XSS(빌드타임 툴, 공격자 제어 입력 아님). 권고: shadcn 을 devDependencies 로 이동, better-auth·postcss 최신화 후 bun audit 재실행. 조치 후 런타임 트리 잔여 취약점은 사실상 0에 수렴할 것으로 판단.
