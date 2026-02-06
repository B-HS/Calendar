# CalDAV 서버 구현 문서

## 개요

B-Calendar는 Bun + Hono 기반의 양방향 CalDAV 서버를 구현하여 Apple Calendar, Fantastical 등 CalDAV 클라이언트와 완전한 동기화를 지원합니다.

### 지원 기능
- RFC 4791 CalDAV 프로토콜
- RFC 6578 Collection Synchronization (sync-collection)
- RFC 5545 iCalendar 형식
- Apple Calendar 완전 호환
- 양방향 동기화 (읽기/쓰기/수정/삭제)
- 반복 일정 (RRULE) 및 예외 날짜 (EXDATE) 지원
- Free/Busy 조회 지원
- 토큰 기반 인증 (CalDAV / ICS 분리)

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Apple Calendar                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  CalDAV Endpoint: /caldav/:token/                           │
│  ┌────────────┬────────────┬────────────┬────────────┐     │
│  │  OPTIONS   │  PROPFIND  │   REPORT   │  PUT/DEL   │     │
│  └────────────┴────────────┴────────────┴────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Services                                                   │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  Calendar Service   │  │  CalDAV Service             │  │
│  │  (CRUD, ETag)       │  │  (Properties, Sync, FreeBusy)│  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  MySQL Database (Drizzle ORM)                               │
│  ┌─────────────────┐  ┌──────────────────────────┐         │
│  │ calendar_event  │  │ calendar_subscription    │         │
│  └─────────────────┘  └──────────────────────────┘         │
│  ┌─────────────────────────────┐                           │
│  │ deleted_calendar_event      │                           │
│  └─────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 파일 구조

```
b-calendar/
├── route/
│   ├── caldav/
│   │   └── index.ts              # CalDAV 라우트 핸들러
│   └── calendar/
│       ├── subscription.ts       # 구독 관리 API
│       └── ics.ts                # ICS 읽기 전용 엔드포인트
├── service/
│   ├── calendar.ts               # 캘린더 서비스 (CRUD)
│   ├── calendar.test.ts          # 캘린더 서비스 테스트
│   ├── caldav.ts                 # CalDAV 전용 서비스
│   └── caldav.test.ts            # CalDAV 서비스 테스트
├── utils/
│   ├── xml.ts                    # XML 빌더/파서
│   ├── ics.ts                    # ICS 생성
│   ├── ics-parser.ts             # ICS 파싱
│   └── ics-parser.test.ts        # ICS 파서 테스트
├── db/
│   └── schema.ts                 # 데이터베이스 스키마
├── middleware/
│   ├── index.ts                  # 미들웨어 초기화
│   ├── auth.ts                   # 인증 미들웨어
│   └── service.ts                # 서비스 주입 미들웨어
└── page/
    └── mobileconfig.tsx          # Apple 프로파일 생성
```

---

## 엔드포인트

### 인증 토큰

두 가지 토큰 타입을 지원합니다:

| 토큰 타입 | 용도 | 엔드포인트 |
|-----------|------|-----------|
| `token` | CalDAV (읽기/쓰기) | `/caldav/{token}/` |
| `icsToken` | ICS 구독 (읽기 전용) | `/api/calendar/{icsToken}` |

```
/caldav/{token}/              # CalDAV 캘린더 루트 (읽기/쓰기)
/caldav/{token}/default/      # 기본 캘린더
/caldav/{token}/{event}.ics   # 개별 이벤트
/api/calendar/{icsToken}      # ICS 구독 (읽기 전용)
```

### HTTP 메서드

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `OPTIONS` | `/:token/*` | DAV 기능 응답 |
| `PROPFIND` | `/:token/` | Principal/Calendar 속성 조회 |
| `REPORT` | `/:token/` | 이벤트 목록 조회 |
| `GET` | `/:token/:uid` | ICS 파일 다운로드 |
| `PUT` | `/:token/:uid` | 이벤트 생성/수정 |
| `DELETE` | `/:token/:uid` | 이벤트 삭제 |
| `PROPPATCH` | `/:token/*` | 속성 수정 (더미 응답) |
| `MKCALENDAR` | `/:token/*` | 캘린더 생성 (더미 응답) |

---

## 서비스 레이어

### Calendar Service (`service/calendar.ts`)

이벤트 CRUD 및 구독 관리를 담당합니다.

```typescript
const calendarService = createCalendarService({ db })

// 이벤트 CRUD
calendarService.getAllEvents(userId)
calendarService.getEventByUid(userId, uid)
calendarService.createEvent(userId, data)
calendarService.updateEvent(userId, data)
calendarService.deleteEvent(userId, uid)
calendarService.upsertEventByUid(userId, uid, data)

// 구독 관리
calendarService.getSubscription(userId)
calendarService.getSubscriptionByToken(token)
calendarService.getSubscriptionByIcsToken(icsToken)
calendarService.createSubscription(userId, name)
calendarService.regenerateSubscriptionToken(userId)
calendarService.regenerateIcsToken(userId)

// ETag 생성
calendarService.getEventEtag(event)
```

### CalDAV Service (`service/caldav.ts`)

CalDAV 프로토콜 관련 기능을 담당합니다.

```typescript
const caldavService = createCaldavService({ db })

// 동기화
caldavService.getSyncToken(ctag)
caldavService.parseSyncToken(token)
caldavService.getChangesFromToken(userId, token)  // 변경/삭제 이벤트 반환

// Free/Busy
caldavService.getFreeBusy(userId, start, end)
caldavService.generateFreeBusyICS(periods, start, end, organizer)

// PROPFIND 속성
caldavService.getCalendarProperties(subscription, requestedProps, calendarHref, timezone)
caldavService.generateTimezoneComponent(timezone)
```

---

## REPORT 타입

### calendar-multiget
특정 이벤트들의 ICS 데이터를 요청합니다.

### calendar-query
시간 범위 내 모든 이벤트를 조회합니다.

### sync-collection (RFC 6578)
변경된 이벤트만 조회합니다. 삭제된 이벤트는 404 상태로 반환됩니다.

```typescript
if (report.type === 'sync-collection') {
    const syncResult = await caldavService.getChangesFromToken(userId, report.syncToken)

    // 변경된 이벤트: 200 OK with properties
    // 삭제된 이벤트: 404 Not Found
}
```

### free-busy-query (RFC 4791)
지정된 시간 범위의 바쁨/한가함 정보를 VFREEBUSY 형식으로 반환합니다.

```typescript
if (report.type === 'free-busy-query') {
    const periods = await caldavService.getFreeBusy(userId, start, end)
    const ics = caldavService.generateFreeBusyICS(periods, start, end)
    // VFREEBUSY 반환
}
```

---

## PROPFIND 속성

지원하는 속성:

| 속성 | 네임스페이스 | 설명 |
|------|-------------|------|
| `resourcetype` | DAV: | collection, calendar |
| `displayname` | DAV: | 캘린더 이름 |
| `current-user-principal` | DAV: | principal URL |
| `calendar-home-set` | CalDAV | 캘린더 홈 URL |
| `getctag` | CS: | Collection Tag |
| `sync-token` | DAV: | 동기화 토큰 |
| `supported-calendar-component-set` | CalDAV | VEVENT 지원 |
| `supported-calendar-data` | CalDAV | text/calendar 2.0 |
| `calendar-timezone` | CalDAV | VTIMEZONE 컴포넌트 |
| `calendar-description` | CalDAV | 캘린더 설명 |
| `calendar-color` | Apple | 캘린더 색상 |
| `current-user-privilege-set` | DAV: | read, write, bind, unbind |
| `supported-report-set` | DAV: | 지원 REPORT 목록 |

---

## ICS 필드 지원

### 파싱 (`utils/ics-parser.ts`)

| 필드 | 설명 |
|------|------|
| `UID` | 이벤트 고유 ID |
| `SUMMARY` | 제목 |
| `DESCRIPTION` | 설명 |
| `LOCATION` | 장소 |
| `DTSTART/DTEND` | 시작/종료 시간 |
| `RRULE` | 반복 규칙 |
| `EXDATE` | 예외 날짜 |
| `SEQUENCE` | 버전 번호 |
| `STATUS` | 상태 (TENTATIVE, CONFIRMED, CANCELLED) |
| `TRANSP` | 투명도 (TRANSPARENT, OPAQUE) |
| `PRIORITY` | 우선순위 |
| `CATEGORIES` | 카테고리 |

### 생성 (`utils/ics.ts`)

```typescript
const ics = eventsToICS(events, calendarName, domain, timezone)
```

---

## 데이터베이스 스키마

### calendar_event

```sql
CREATE TABLE calendar_event (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES user(id),
    uid VARCHAR(255) NOT NULL UNIQUE,
    summary VARCHAR(500) NOT NULL,
    description TEXT,
    location VARCHAR(500),
    dtstart DATETIME NOT NULL,
    dtend DATETIME NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    rrule JSON,
    exdate JSON,                    -- 예외 날짜 배열
    status ENUM('TENTATIVE', 'CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED',
    transp ENUM('TRANSPARENT', 'OPAQUE') DEFAULT 'OPAQUE',
    priority TINYINT,
    categories JSON,
    color VARCHAR(50),
    sequence TINYINT DEFAULT 0,     -- 버전 번호
    dtstamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### calendar_subscription

```sql
CREATE TABLE calendar_subscription (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES user(id),
    token VARCHAR(64) NOT NULL UNIQUE,       -- CalDAV 읽기/쓰기 토큰
    ics_token VARCHAR(64) NOT NULL UNIQUE,   -- ICS 읽기 전용 토큰
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    ctag VARCHAR(64) DEFAULT '0',
    last_accessed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### deleted_calendar_event

삭제된 이벤트를 추적하여 sync-collection에서 404 응답을 반환합니다.

```sql
CREATE TABLE deleted_calendar_event (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES user(id),
    uid VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_token VARCHAR(64) NOT NULL
);
```

---

## CTag / ETag 동기화

### CTag (Collection Tag)

캘린더 전체의 변경을 감지합니다.

```typescript
const incrementCtag = async (userId: string) => {
    const newCtag = Date.now().toString(36)
    await db.update(calendarSubscription).set({ ctag: newCtag }).where(...)
}
```

### ETag (Entity Tag)

개별 이벤트의 버전을 식별합니다.

```typescript
const getEventEtag = (event: CalendarEvent): string => {
    const timestamp = event.lastModified?.getTime() ?? Date.now()
    return `${timestamp.toString(36)}-${event.uid.slice(0, 8)}`
}
```

### SEQUENCE

이벤트 수정 시 자동으로 증가합니다 (RFC 5545).

```typescript
const updateEvent = async (userId: string, data: CalendarEvent) => {
    const newSequence = (data.sequence ?? 0) + 1
    await db.update(calendarEvent).set({ sequence: newSequence, ... })
}
```

---

## 테스트

### 실행

```bash
bun test
```

### 테스트 파일

- `service/calendar.test.ts` - Calendar Service 테스트
- `service/caldav.test.ts` - CalDAV Service 테스트
- `utils/ics-parser.test.ts` - ICS 파서 테스트

---

## Apple Calendar 연동

### 연동 방법

1. **자동 설정 (권장)**
   - `/calendar/subscription/mobileconfig` 엔드포인트에서 프로파일 다운로드
   - iOS/macOS에서 프로파일 설치

2. **수동 설정**
   - 계정 유형: CalDAV
   - 서버: `https://your-domain.com/caldav/{token}/`
   - 사용자명/비밀번호: 불필요 (토큰 인증)

---

## 트러블슈팅

### 이벤트가 표시되지 않음

1. **CTag 확인**: 클라이언트가 캐시된 CTag를 사용하고 있을 수 있음
2. **UID 매칭**: `getEventByUid`가 접미사 유무에 관계없이 검색하는지 확인
3. **REPORT 응답**: `calendar-multiget` 응답에서 404 반환 여부 확인

### 삭제가 동기화되지 않음

1. **deleted_calendar_event 테이블**: 삭제 기록이 저장되는지 확인
2. **sync-collection 응답**: 삭제된 이벤트가 404 상태로 반환되는지 확인

### 수정사항이 반영되지 않음

1. **SEQUENCE**: 수정 시 sequence가 증가하는지 확인
2. **ETag 변경**: 수정 후 새로운 ETag 반환 여부 확인
3. **CTag 업데이트**: 이벤트 변경 시 `incrementCtag` 호출 여부 확인

---

## 참고 자료

- [RFC 4791 - CalDAV](https://datatracker.ietf.org/doc/html/rfc4791)
- [RFC 6578 - Collection Synchronization](https://datatracker.ietf.org/doc/html/rfc6578)
- [RFC 5545 - iCalendar](https://datatracker.ietf.org/doc/html/rfc5545)
