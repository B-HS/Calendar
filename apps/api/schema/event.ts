import { z } from '@hono/zod-openapi'

export const RecurrenceRuleSchema = z
    .object({
        freq: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).openapi({
            description:
                '반복 빈도를 지정합니다. DAILY(매일), WEEKLY(매주), MONTHLY(매월), YEARLY(매년) 중 하나를 선택합니다. RFC 5545 RRULE 스펙을 따릅니다.',
            example: 'WEEKLY',
        }),
        interval: z.number().int().positive().optional().openapi({
            description:
                '반복 간격을 지정합니다. 예를 들어 freq가 WEEKLY이고 interval이 2이면 "2주마다" 반복됩니다. 기본값은 1입니다.',
            example: 1,
        }),
        count: z.number().int().positive().optional().openapi({
            description:
                '반복 횟수를 지정합니다. 이벤트가 총 몇 번 발생할지 정합니다. count와 until 중 하나만 지정할 수 있습니다. 예: count가 10이면 총 10번 반복 후 종료됩니다.',
            example: 10,
        }),
        until: z.string().datetime().optional().openapi({
            description:
                '반복 종료 날짜/시간을 ISO 8601 형식으로 지정합니다. 이 날짜 이후에는 이벤트가 더 이상 반복되지 않습니다. count와 until 중 하나만 지정할 수 있습니다.',
            example: '2024-12-31T23:59:59Z',
        }),
        byDay: z.array(z.string()).optional().openapi({
            description:
                '특정 요일에만 반복되도록 지정합니다. 사용 가능한 값: MO(월), TU(화), WE(수), TH(목), FR(금), SA(토), SU(일). MONTHLY와 함께 사용시 "2TU"처럼 n번째 요일을 지정할 수 있습니다.',
            example: ['MO', 'WE', 'FR'],
        }),
        byMonth: z.array(z.number().int().min(1).max(12)).optional().openapi({
            description: '특정 월에만 반복되도록 지정합니다. 1(1월)부터 12(12월)까지의 숫자 배열입니다.',
            example: [1, 6, 12],
        }),
        byMonthDay: z.array(z.number().int().min(1).max(31)).optional().openapi({
            description: '매월 특정 일에만 반복되도록 지정합니다. 1부터 31까지의 숫자 배열입니다.',
            example: [1, 15],
        }),
    })
    .openapi({
        title: '반복 규칙',
        description:
            'RFC 5545 iCalendar 스펙의 RRULE을 기반으로 한 이벤트 반복 규칙입니다. 이 객체를 통해 매일, 매주, 매월, 매년 반복되는 일정을 정의할 수 있으며, 특정 요일이나 날짜에만 반복되도록 세부 조정이 가능합니다.',
    })

export const EventStatusSchema = z.enum(['TENTATIVE', 'CONFIRMED', 'CANCELLED']).openapi({
    title: '이벤트 상태',
    description:
        '이벤트의 확정 상태를 나타냅니다. TENTATIVE(잠정적/미확정 - 일정이 아직 확정되지 않음), CONFIRMED(확정됨 - 일정이 최종 확정됨), CANCELLED(취소됨 - 일정이 취소됨) 중 하나입니다. RFC 5545 STATUS 속성을 따릅니다.',
})

export const EventTransparencySchema = z.enum(['TRANSPARENT', 'OPAQUE']).openapi({
    title: '이벤트 투명도',
    description:
        '이벤트가 사용자의 시간을 차지하는지 여부를 나타냅니다. OPAQUE(불투명 - 이 시간에 바쁨으로 표시됨, 기본값), TRANSPARENT(투명 - 이 시간에 여유있음으로 표시됨, 예: 기념일, 생일 등 시간을 차지하지 않는 이벤트). Free/Busy 조회 시 OPAQUE 이벤트만 바쁨으로 표시됩니다.',
})

export const CalendarEventSchema = z
    .object({
        uid: z.string().openapi({
            description:
                '이벤트의 고유 식별자입니다. 시스템에서 자동으로 생성되며, 전역적으로 유일한 값입니다. CalDAV 클라이언트와의 동기화에 사용됩니다. 형식: {랜덤ID}@b-calendar',
            example: 'abc123def456@b-calendar',
        }),
        summary: z.string().min(1).max(500).openapi({
            description:
                '이벤트 제목입니다. 캘린더에서 이벤트를 식별하는 주요 텍스트로, 최소 1자 이상 최대 500자까지 입력 가능합니다.',
            example: '주간 팀 미팅',
        }),
        description: z.string().max(5000).optional().openapi({
            description:
                '이벤트에 대한 상세 설명입니다. 회의 안건, 참고 사항, 링크 등을 포함할 수 있으며, 최대 5000자까지 입력 가능합니다.',
            example: '이번 주 스프린트 진행 상황 공유 및 다음 주 계획 수립. 참석 필수.',
        }),
        location: z.string().max(500).optional().openapi({
            description:
                '이벤트 장소입니다. 물리적 주소, 회의실 이름, 화상 회의 링크 등을 입력할 수 있습니다. 최대 500자까지 입력 가능합니다.',
            example: '3층 대회의실 A / https://meet.google.com/abc-defg-hij',
        }),
        dtstart: z.string().datetime().openapi({
            description:
                '이벤트 시작 날짜 및 시간입니다. ISO 8601 형식(YYYY-MM-DDTHH:mm:ssZ)으로 표현되며, UTC 타임존을 기준으로 합니다. 클라이언트에서 로컬 시간으로 변환하여 표시해야 합니다.',
            example: '2024-01-15T10:00:00Z',
        }),
        dtend: z.string().datetime().openapi({
            description:
                '이벤트 종료 날짜 및 시간입니다. ISO 8601 형식(YYYY-MM-DDTHH:mm:ssZ)으로 표현되며, UTC 타임존을 기준으로 합니다. 종료 시간은 시작 시간보다 이후여야 합니다.',
            example: '2024-01-15T11:00:00Z',
        }),
        isAllDay: z.boolean().openapi({
            description:
                '종일 이벤트 여부입니다. true인 경우 이벤트가 하루 전체를 차지하며, 시작/종료 시간이 무시되고 날짜만 사용됩니다. 생일, 휴일, 기념일 등에 사용됩니다.',
            example: false,
        }),
        rrule: RecurrenceRuleSchema.optional().openapi({
            description:
                '반복 규칙입니다. 이 필드가 설정되면 이벤트가 지정된 규칙에 따라 반복됩니다. 반복되지 않는 일회성 이벤트의 경우 이 필드를 생략합니다.',
        }),
        exdate: z.array(z.string()).optional().openapi({
            description:
                '반복 이벤트에서 제외할 날짜 목록입니다. 반복 규칙에 의해 생성되는 인스턴스 중 특정 날짜를 건너뛰어야 할 때 사용합니다. iCalendar EXDATE 형식(예: 20240120T100000Z)으로 지정합니다.',
            example: ['20240120T100000Z', '20240127T100000Z'],
        }),
        status: EventStatusSchema.optional().openapi({
            description:
                '이벤트의 확정 상태입니다. 미팅 수락/거절, 일정 확정 등의 상태를 나타냅니다. 지정하지 않으면 CONFIRMED로 간주됩니다.',
        }),
        transp: EventTransparencySchema.optional().openapi({
            description:
                '이벤트의 시간 투명도입니다. 이 이벤트가 사용자의 시간을 실제로 차지하는지 여부를 나타냅니다. Free/Busy 조회에 영향을 줍니다.',
        }),
        priority: z.number().int().min(0).max(9).optional().openapi({
            description:
                '이벤트의 우선순위입니다. 0(우선순위 미지정)부터 9(가장 낮음)까지의 정수입니다. 1이 가장 높은 우선순위이고, 숫자가 클수록 우선순위가 낮습니다. RFC 5545 PRIORITY 속성을 따릅니다.',
            example: 1,
        }),
        categories: z.array(z.string()).optional().openapi({
            description:
                '이벤트 카테고리/태그 목록입니다. 이벤트를 분류하고 필터링하는 데 사용됩니다. 예: 업무, 개인, 가족, 건강 등',
            example: ['업무', '회의', '중요'],
        }),
        color: z.string().optional().openapi({
            description:
                '이벤트 표시 색상입니다. 캘린더 UI에서 이벤트를 시각적으로 구분하는 데 사용됩니다. 16진수 색상 코드(#RRGGBB) 형식을 권장합니다.',
            example: '#0E61B9',
        }),
        sequence: z.number().int().optional().openapi({
            description:
                '이벤트 수정 순서 번호입니다. 이벤트가 수정될 때마다 1씩 증가합니다. CalDAV 클라이언트 간 동기화 충돌 해결에 사용됩니다. RFC 5545 SEQUENCE 속성을 따릅니다.',
            example: 0,
        }),
        created: z.string().datetime().optional().openapi({
            description:
                '이벤트가 최초 생성된 날짜 및 시간입니다. ISO 8601 형식(YYYY-MM-DDTHH:mm:ssZ)으로 표현됩니다. 시스템에서 자동으로 설정됩니다.',
            example: '2024-01-01T00:00:00Z',
        }),
        lastModified: z.string().datetime().optional().openapi({
            description:
                '이벤트가 마지막으로 수정된 날짜 및 시간입니다. ISO 8601 형식(YYYY-MM-DDTHH:mm:ssZ)으로 표현됩니다. 수정할 때마다 자동으로 갱신됩니다.',
            example: '2024-01-10T15:30:00Z',
        }),
    })
    .openapi({
        title: '캘린더 이벤트',
        description:
            'B-Calendar의 캘린더 이벤트 객체입니다. RFC 5545 iCalendar 표준과 호환되며, CalDAV 클라이언트(Apple 캘린더, Google 캘린더, Outlook 등)와 양방향 동기화가 가능합니다. 일회성 이벤트와 반복 이벤트를 모두 지원합니다.',
    })

export const CreateEventSchema = z
    .object({
        summary: z.string().min(1).max(500).openapi({
            description:
                '(필수) 이벤트 제목입니다. 캘린더에서 이벤트를 식별하는 주요 텍스트로, 최소 1자 이상 최대 500자까지 입력해야 합니다.',
            example: '주간 팀 미팅',
        }),
        description: z.string().max(5000).optional().openapi({
            description:
                '(선택) 이벤트에 대한 상세 설명입니다. 회의 안건, 참고 사항 등을 포함할 수 있습니다.',
            example: '이번 주 스프린트 진행 상황 공유',
        }),
        location: z.string().max(500).optional().openapi({
            description: '(선택) 이벤트 장소입니다. 주소, 회의실 이름, 화상 회의 링크 등을 입력합니다.',
            example: '3층 대회의실',
        }),
        dtstart: z.string().datetime().openapi({
            description:
                '(필수) 이벤트 시작 날짜 및 시간입니다. ISO 8601 형식(YYYY-MM-DDTHH:mm:ssZ)으로 UTC 타임존 기준으로 전송해야 합니다.',
            example: '2024-01-15T10:00:00Z',
        }),
        dtend: z.string().datetime().openapi({
            description:
                '(필수) 이벤트 종료 날짜 및 시간입니다. ISO 8601 형식(YYYY-MM-DDTHH:mm:ssZ)으로 UTC 타임존 기준으로 전송해야 합니다. 시작 시간보다 이후여야 합니다.',
            example: '2024-01-15T11:00:00Z',
        }),
        isAllDay: z.boolean().default(false).openapi({
            description:
                '(선택) 종일 이벤트 여부입니다. 생략하면 false로 설정됩니다. true로 설정하면 시간이 무시되고 날짜만 사용됩니다.',
            example: false,
        }),
        rrule: RecurrenceRuleSchema.optional().openapi({
            description:
                '(선택) 반복 규칙입니다. 주기적으로 반복되는 이벤트를 생성할 때 사용합니다. 일회성 이벤트는 이 필드를 생략합니다.',
        }),
        exdate: z.array(z.string()).optional().openapi({
            description: '(선택) 반복에서 제외할 날짜 목록입니다. 반복 이벤트에서 특정 날짜를 건너뛸 때 사용합니다.',
            example: ['20240120T100000Z'],
        }),
        status: EventStatusSchema.optional().openapi({
            description: '(선택) 이벤트 상태입니다. TENTATIVE(미확정), CONFIRMED(확정), CANCELLED(취소) 중 선택합니다.',
        }),
        transp: EventTransparencySchema.optional().openapi({
            description:
                '(선택) 시간 투명도입니다. OPAQUE(바쁨으로 표시)가 기본값이며, TRANSPARENT(여유있음으로 표시)로 설정할 수 있습니다.',
        }),
        priority: z.number().int().min(0).max(9).optional().openapi({
            description: '(선택) 우선순위입니다. 0(미지정)~9(가장 낮음), 1이 가장 높은 우선순위입니다.',
            example: 5,
        }),
        categories: z.array(z.string()).optional().openapi({
            description: '(선택) 카테고리/태그 목록입니다. 이벤트 분류에 사용됩니다.',
            example: ['업무'],
        }),
        color: z.string().optional().openapi({
            description: '(선택) 이벤트 색상입니다. #RRGGBB 형식의 16진수 색상 코드를 사용합니다.',
            example: '#0E61B9',
        }),
    })
    .openapi({
        title: '이벤트 생성 요청',
        description:
            '새로운 캘린더 이벤트를 생성하기 위한 요청 본문입니다. summary, dtstart, dtend는 필수 항목이며, 나머지는 선택 항목입니다. 생성된 이벤트에는 시스템에서 자동으로 uid, sequence, created, lastModified가 할당됩니다.',
    })

export const UpdateEventSchema = z
    .object({
        summary: z.string().min(1).max(500).optional().openapi({
            description: '(선택) 변경할 이벤트 제목입니다. 제공하지 않으면 기존 값이 유지됩니다.',
            example: '주간 팀 미팅 (장소 변경)',
        }),
        description: z.string().max(5000).optional().nullable().openapi({
            description: '(선택) 변경할 이벤트 설명입니다. null을 전송하면 설명이 삭제됩니다.',
            example: '장소가 변경되었습니다',
        }),
        location: z.string().max(500).optional().nullable().openapi({
            description: '(선택) 변경할 장소입니다. null을 전송하면 장소 정보가 삭제됩니다.',
            example: '2층 소회의실 B',
        }),
        dtstart: z.string().datetime().optional().openapi({
            description: '(선택) 변경할 시작 시간입니다. ISO 8601 형식으로 전송합니다.',
            example: '2024-01-15T14:00:00Z',
        }),
        dtend: z.string().datetime().optional().openapi({
            description: '(선택) 변경할 종료 시간입니다. ISO 8601 형식으로 전송합니다.',
            example: '2024-01-15T15:00:00Z',
        }),
        isAllDay: z.boolean().optional().openapi({
            description: '(선택) 변경할 종일 이벤트 여부입니다.',
            example: false,
        }),
        rrule: RecurrenceRuleSchema.optional().nullable().openapi({
            description:
                '(선택) 변경할 반복 규칙입니다. null을 전송하면 반복이 제거되어 일회성 이벤트가 됩니다.',
        }),
        exdate: z.array(z.string()).optional().nullable().openapi({
            description:
                '(선택) 변경할 제외 날짜 목록입니다. 반복 이벤트에서 특정 인스턴스를 건너뛸 때 사용합니다. null을 전송하면 모든 제외 날짜가 삭제됩니다.',
            example: ['20240120T100000Z'],
        }),
        status: EventStatusSchema.optional().nullable().openapi({
            description: '(선택) 변경할 이벤트 상태입니다. null을 전송하면 상태가 초기화됩니다.',
        }),
        transp: EventTransparencySchema.optional().nullable().openapi({
            description: '(선택) 변경할 시간 투명도입니다. null을 전송하면 기본값(OPAQUE)으로 초기화됩니다.',
        }),
        priority: z.number().int().min(0).max(9).optional().nullable().openapi({
            description: '(선택) 변경할 우선순위입니다. null을 전송하면 우선순위가 삭제됩니다.',
            example: 1,
        }),
        categories: z.array(z.string()).optional().nullable().openapi({
            description: '(선택) 변경할 카테고리 목록입니다. null을 전송하면 모든 카테고리가 삭제됩니다.',
            example: ['업무', '긴급'],
        }),
        color: z.string().optional().nullable().openapi({
            description: '(선택) 변경할 이벤트 색상입니다. null을 전송하면 색상이 삭제됩니다.',
            example: '#FF0000',
        }),
    })
    .openapi({
        title: '이벤트 수정 요청',
        description:
            '기존 캘린더 이벤트를 수정하기 위한 요청 본문입니다. 변경하고자 하는 필드만 포함하면 됩니다. 제공되지 않은 필드는 기존 값이 유지됩니다. null을 명시적으로 전송하면 해당 필드의 값이 삭제됩니다. 수정 시 sequence가 자동으로 1 증가하고 lastModified가 현재 시간으로 갱신됩니다.',
    })

export const EventListSchema = z.array(CalendarEventSchema).openapi({
    title: '이벤트 목록',
    description:
        '캘린더 이벤트 배열입니다. 조회 조건(년/월)에 해당하는 모든 이벤트가 포함됩니다. 반복 이벤트의 경우 원본 이벤트만 포함되며, 개별 인스턴스는 클라이언트에서 반복 규칙(rrule)을 기반으로 계산해야 합니다.',
})

export const EventParamsSchema = z.object({
    uid: z.string().openapi({
        description:
            '조회/수정/삭제할 이벤트의 고유 식별자(UID)입니다. 이벤트 생성 시 자동으로 할당된 값을 사용합니다. @b-calendar 접미사는 생략 가능합니다.',
        param: { name: 'uid', in: 'path' },
        example: 'abc123def456',
    }),
})

export const MonthQuerySchema = z.object({
    year: z
        .string()
        .regex(/^\d{4}$/)
        .transform(Number)
        .openapi({
            description: '조회할 연도입니다. 4자리 숫자(예: 2024)로 입력합니다.',
            param: { name: 'year', in: 'query' },
            example: '2024',
        }),
    month: z
        .string()
        .regex(/^\d{1,2}$/)
        .transform(Number)
        .refine((m) => m >= 0 && m <= 11, 'month는 0부터 11 사이의 값이어야 합니다 (0=1월, 11=12월)')
        .openapi({
            description:
                '조회할 월입니다. JavaScript Date 객체와 동일하게 0부터 11까지의 값을 사용합니다 (0=1월, 1=2월, ..., 11=12월). 주의: 1-12가 아닌 0-11 범위입니다.',
            param: { name: 'month', in: 'query' },
            example: '0',
        }),
})

export type RecurrenceRule = z.infer<typeof RecurrenceRuleSchema>
export type EventStatus = z.infer<typeof EventStatusSchema>
export type EventTransparency = z.infer<typeof EventTransparencySchema>
export type CalendarEvent = z.infer<typeof CalendarEventSchema>
export type CreateEvent = z.infer<typeof CreateEventSchema>
export type UpdateEvent = z.infer<typeof UpdateEventSchema>
export type EventParams = z.infer<typeof EventParamsSchema>
export type MonthQuery = z.infer<typeof MonthQuerySchema>
