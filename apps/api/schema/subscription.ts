import { z } from '@hono/zod-openapi'

export const SubscriptionSchema = z
    .object({
        id: z.string().uuid().openapi({
            description: '구독의 고유 식별자입니다. UUID v4 형식으로 시스템에서 자동 생성됩니다.',
            example: '123e4567-e89b-12d3-a456-426614174000',
        }),
        userId: z.string().uuid().openapi({
            description: '이 구독을 소유한 사용자의 고유 식별자입니다. Better Auth 인증 시스템의 사용자 ID와 연결됩니다.',
            example: '123e4567-e89b-12d3-a456-426614174001',
        }),
        token: z.string().length(64).openapi({
            description:
                'CalDAV 접근용 토큰입니다. 64자의 16진수 문자열로, CalDAV URL에 포함되어 사용자 인증에 사용됩니다. 이 토큰을 사용하면 캘린더 이벤트의 읽기/쓰기가 모두 가능합니다. 보안을 위해 이 토큰은 비밀로 유지해야 하며, 노출된 경우 즉시 재생성해야 합니다.',
            example: '0630b1e685fcbec17c18af30e651935468937b6ce4e0c244cebc1ec3865aa70a',
        }),
        icsToken: z.string().length(64).openapi({
            description:
                'ICS 피드 전용 읽기 전용 토큰입니다. 64자의 16진수 문자열로, ICS URL에 포함되어 사용됩니다. 이 토큰으로는 캘린더를 읽기만 가능하고 수정은 불가능합니다. Google 캘린더 등 외부 캘린더 앱에서 구독 형태로 일정을 조회할 때 사용합니다.',
            example: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        }),
        name: z.string().max(255).nullable().openapi({
            description:
                '캘린더 이름입니다. CalDAV 클라이언트에서 표시되는 캘린더 명칭으로, 사용자가 자유롭게 지정할 수 있습니다. null인 경우 기본값 "B-Calendar"가 사용됩니다.',
            example: '내 업무 일정',
        }),
        isActive: z.boolean().openapi({
            description:
                '구독 활성화 상태입니다. false인 경우 이 토큰으로의 모든 접근이 거부됩니다. 보안 문제 발생 시 토큰을 재생성하지 않고 일시적으로 비활성화하는 데 사용할 수 있습니다.',
            example: true,
        }),
        ctag: z.string().openapi({
            description:
                '캘린더 변경 태그(CTag)입니다. 캘린더의 이벤트가 추가/수정/삭제될 때마다 변경됩니다. CalDAV 클라이언트는 이 값을 사용하여 로컬 캐시가 최신 상태인지 확인합니다. 값이 변경되었다면 동기화가 필요함을 의미합니다.',
            example: 'ml4nhub4',
        }),
        lastAccessedAt: z.string().nullable().openapi({
            description:
                '마지막으로 이 구독에 접근한 날짜 및 시간입니다. ISO 8601 형식으로 표현됩니다. CalDAV 또는 ICS 요청이 있을 때마다 갱신됩니다. 접근 기록이 없으면 null입니다.',
            example: '2024-01-15T10:00:00Z',
        }),
    })
    .openapi({
        title: '구독 정보',
        description:
            'B-Calendar 구독 정보 객체입니다. 각 사용자는 하나의 구독을 가지며, 구독에는 CalDAV 접근용 토큰(읽기/쓰기)과 ICS 피드용 토큰(읽기 전용)이 포함됩니다. CalDAV 토큰은 Apple 캘린더, Outlook 등 CalDAV를 지원하는 앱에서 양방향 동기화에 사용되고, ICS 토큰은 Google 캘린더 등에서 단방향 구독에 사용됩니다.',
    })

export const SubscriptionResponseSchema = z
    .object({
        token: z.string().length(64).openapi({
            description:
                'CalDAV 접근용 토큰입니다. 64자의 16진수 문자열로, 이 토큰을 caldavUrl에 사용하면 캘린더의 읽기/쓰기가 가능합니다. Apple 캘린더, Outlook, Thunderbird 등 CalDAV 클라이언트 설정 시 필요합니다.',
            example: '0630b1e685fcbec17c18af30e651935468937b6ce4e0c244cebc1ec3865aa70a',
        }),
        icsToken: z.string().length(64).openapi({
            description:
                'ICS 피드 전용 읽기 전용 토큰입니다. 64자의 16진수 문자열로, icsUrl에 사용됩니다. Google 캘린더에서 "URL로 캘린더 추가" 기능을 사용할 때 이 URL을 입력하면 됩니다. 읽기 전용이므로 Google 캘린더에서는 일정을 조회만 할 수 있고 수정할 수 없습니다.',
            example: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        }),
        name: z.string().nullable().openapi({
            description:
                '캘린더 이름입니다. CalDAV 클라이언트에서 표시되는 이름이며, mobileconfig 프로필에도 이 이름이 사용됩니다.',
            example: '내 업무 일정',
        }),
        caldavUrl: z.string().url().openapi({
            description:
                'CalDAV 서버 URL입니다. 이 URL을 CalDAV 클라이언트(Apple 캘린더, Outlook, Thunderbird 등)의 서버 주소로 입력하면 됩니다. 사용자 이름과 비밀번호 입력이 필요 없는 토큰 기반 인증입니다. 이 URL로 이벤트 조회, 생성, 수정, 삭제가 모두 가능합니다.',
            example: 'https://calendar.example.com/caldav/0630b1e685fcbec17c18af30e651935468937b6ce4e0c244cebc1ec3865aa70a/',
        }),
        icsUrl: z.string().url().openapi({
            description:
                'ICS 피드 URL입니다. 이 URL을 캘린더 앱의 "URL로 구독" 기능에 입력하면 읽기 전용으로 캘린더를 구독할 수 있습니다. Google 캘린더에서 "URL로 캘린더 추가" 시 이 URL을 사용합니다. 표준 iCalendar(.ics) 형식으로 전체 일정을 제공합니다.',
            example: 'https://calendar.example.com/api/calendar/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        }),
    })
    .openapi({
        title: '구독 응답',
        description:
            '구독 정보 API 응답 객체입니다. CalDAV URL(양방향 동기화용)과 ICS URL(읽기 전용 구독용)을 모두 포함합니다. 클라이언트 앱 종류에 따라 적절한 URL을 선택하여 사용하면 됩니다. CalDAV를 지원하는 앱(Apple 캘린더, Outlook)은 caldavUrl을, 지원하지 않는 앱(Google 캘린더)은 icsUrl을 사용합니다.',
    })

export const CreateSubscriptionSchema = z
    .object({
        name: z.string().max(255).optional().openapi({
            description:
                '(선택) 캘린더 이름입니다. CalDAV 클라이언트에서 표시될 캘린더 이름을 지정합니다. 생략하면 기본값 "B-Calendar"가 사용됩니다. 나중에 수정할 수 있습니다.',
            example: '내 업무 일정',
        }),
    })
    .openapi({
        title: '구독 생성 요청',
        description:
            '새로운 캘린더 구독을 생성하기 위한 요청 본문입니다. 요청 본문은 선택 사항이며, 빈 객체 {}를 전송하거나 본문 없이 요청해도 됩니다. 이미 구독이 존재하는 경우 기존 구독 정보가 반환됩니다. 구독 생성 시 CalDAV 토큰과 ICS 토큰이 각각 자동으로 생성됩니다.',
    })

export const RegenerateTokenResponseSchema = z
    .object({
        token: z.string().length(64).openapi({
            description:
                '새로 생성된 CalDAV 토큰입니다. 64자의 16진수 문자열입니다. 기존 토큰은 즉시 무효화되므로, 모든 CalDAV 클라이언트에서 새 토큰으로 URL을 업데이트해야 합니다. Apple 캘린더의 경우 기존 계정을 삭제하고 새 URL로 다시 추가하거나, mobileconfig를 다시 설치해야 합니다.',
            example: '9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        }),
    })
    .openapi({
        title: 'CalDAV 토큰 재생성 응답',
        description:
            'CalDAV 토큰 재생성 API의 응답 객체입니다. 보안상의 이유로 토큰이 노출되었거나, 주기적인 토큰 갱신이 필요할 때 이 API를 사용합니다. 주의: 토큰을 재생성하면 기존 토큰으로 설정된 모든 CalDAV 클라이언트의 동기화가 중단됩니다. ICS 토큰은 영향받지 않습니다.',
    })

export const RegenerateIcsTokenResponseSchema = z
    .object({
        icsToken: z.string().length(64).openapi({
            description:
                '새로 생성된 ICS 피드 토큰입니다. 64자의 16진수 문자열입니다. 기존 ICS 토큰은 즉시 무효화되므로, Google 캘린더 등에서 구독 URL을 업데이트해야 합니다. Google 캘린더의 경우 기존 구독을 삭제하고 새 URL로 다시 추가해야 합니다.',
            example: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
        }),
    })
    .openapi({
        title: 'ICS 토큰 재생성 응답',
        description:
            'ICS 피드 토큰 재생성 API의 응답 객체입니다. ICS URL이 외부에 노출되었을 때 이 API를 사용하여 토큰을 변경합니다. 주의: 토큰을 재생성하면 기존 ICS URL로 구독 중인 모든 외부 캘린더의 동기화가 중단됩니다. CalDAV 토큰은 영향받지 않습니다.',
    })

export type Subscription = z.infer<typeof SubscriptionSchema>
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>
export type CreateSubscription = z.infer<typeof CreateSubscriptionSchema>
export type RegenerateTokenResponse = z.infer<typeof RegenerateTokenResponseSchema>
export type RegenerateIcsTokenResponse = z.infer<typeof RegenerateIcsTokenResponseSchema>
