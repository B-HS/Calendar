import { describe, expect, test } from 'bun:test'
import { appendAssistantDelta, buildAiMessages, buildCalendarContextText, dropTrailingEmptyAssistant } from '@/entities/ai/context'
import type { AiChatMessage } from '@/entities/ai/types'
import type { CalendarEvent, CalendarGroup } from '@/entities/calendar/types'
import { AI_SYSTEM_PROMPT } from '@/shared/constant/ai'

const groups: CalendarGroup[] = [{ id: 'g1', name: '업무', color: 'bg-blue-500', visible: true }]

const events: CalendarEvent[] = [
    {
        id: 'e2',
        title: '스탠드업',
        startDate: '2026-07-13',
        endDate: '2026-07-13',
        startTime: '09:00',
        endTime: '09:30',
        groupId: 'g1',
        isAllDay: false,
        status: 'confirmed',
    },
    { id: 'e1', title: '워크숍', startDate: '2026-07-12', endDate: '2026-07-12', groupId: 'g1', isAllDay: true, location: '서울' },
]

describe('buildCalendarContextText', () => {
    test('오늘 날짜·그룹·일정 개수·제목을 포함한다', () => {
        const text = buildCalendarContextText(events, groups, '2026-07-10')
        expect(text).toContain('[오늘 날짜] 2026-07-10')
        expect(text).toContain('업무')
        expect(text).toContain('총 2개')
        expect(text).toContain('워크숍')
        expect(text).toContain('스탠드업')
    })

    test('일정을 시작일 오름차순으로 정렬한다', () => {
        const text = buildCalendarContextText(events, groups, '2026-07-10')
        expect(text.indexOf('워크숍')).toBeLessThan(text.indexOf('스탠드업'))
    })

    test('일정이 없으면 (일정 없음) 을 표시한다', () => {
        const text = buildCalendarContextText([], groups, '2026-07-10')
        expect(text).toContain('총 0개')
        expect(text).toContain('(일정 없음)')
    })
})

describe('buildAiMessages', () => {
    test('첫 메시지는 system 지침, 두 번째는 컨텍스트, 이후 대화 순서다', () => {
        const history: AiChatMessage[] = [{ role: 'user', content: '내일 일정 알려줘' }]
        const messages = buildAiMessages({ contextText: 'CTX', history })
        expect(messages[0]).toEqual({ role: 'system', content: AI_SYSTEM_PROMPT })
        expect(messages[1]?.role).toBe('system')
        expect(messages[1]?.content).toContain('CTX')
        expect(messages[2]).toEqual({ role: 'user', content: '내일 일정 알려줘' })
    })
})

describe('appendAssistantDelta', () => {
    test('마지막이 assistant 가 아니면 새 assistant 메시지를 추가한다', () => {
        const result = appendAssistantDelta([{ role: 'user', content: '질문' }], '답')
        expect(result).toHaveLength(2)
        expect(result[1]).toEqual({ role: 'assistant', content: '답' })
    })

    test('마지막이 assistant 면 델타를 이어붙인다', () => {
        const result = appendAssistantDelta(
            [
                { role: 'user', content: '질문' },
                { role: 'assistant', content: '안' },
            ],
            '녕',
        )
        expect(result).toHaveLength(2)
        expect(result[1]?.content).toBe('안녕')
    })
})

describe('dropTrailingEmptyAssistant', () => {
    test('마지막 빈 assistant 를 제거한다', () => {
        const result = dropTrailingEmptyAssistant([
            { role: 'user', content: '질문' },
            { role: 'assistant', content: '' },
        ])
        expect(result).toHaveLength(1)
    })

    test('내용이 있으면 그대로 둔다', () => {
        const input: AiChatMessage[] = [
            { role: 'user', content: '질문' },
            { role: 'assistant', content: '답' },
        ]
        expect(dropTrailingEmptyAssistant(input)).toHaveLength(2)
    })
})
