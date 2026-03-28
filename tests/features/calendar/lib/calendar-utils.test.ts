import { describe, test, expect } from 'bun:test'
import dayjs from 'dayjs'
import {
    formatDate,
    parseDate,
    isSameDay,
    isToday,
    isSameMonth,
    getMonthDays,
    addMonths,
    computeWeekLayouts,
    generateId,
} from '@/shared/lib/calendar-utils'
import type { CalendarEvent } from '@/entities/calendar/types'

const makeEvent = (overrides: Partial<CalendarEvent> & { id: string; startDate: string; endDate: string }): CalendarEvent => ({
    title: 'Test',
    groupId: 'g1',
    isAllDay: true,
    ...overrides,
})

describe('formatDate', () => {
    test('Date 객체를 YYYY-MM-DD 형식으로 변환한다', () => {
        expect(formatDate(new Date(2026, 2, 15))).toBe('2026-03-15')
    })

    test('한 자리 월/일에 0을 패딩한다', () => {
        expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    })
})

describe('parseDate', () => {
    test('YYYY-MM-DD 문자열을 Date 객체로 변환한다', () => {
        const d = parseDate('2026-03-15')
        expect(d.getFullYear()).toBe(2026)
        expect(d.getMonth()).toBe(2)
        expect(d.getDate()).toBe(15)
    })
})

describe('isSameDay', () => {
    test('같은 날짜면 true를 반환한다', () => {
        expect(isSameDay(new Date(2026, 2, 15), new Date(2026, 2, 15))).toBe(true)
    })

    test('다른 날짜면 false를 반환한다', () => {
        expect(isSameDay(new Date(2026, 2, 15), new Date(2026, 2, 16))).toBe(false)
    })

    test('시간이 달라도 같은 날이면 true를 반환한다', () => {
        const a = new Date(2026, 2, 15, 9, 0)
        const b = new Date(2026, 2, 15, 18, 30)
        expect(isSameDay(a, b)).toBe(true)
    })
})

describe('isToday', () => {
    test('오늘 날짜면 true를 반환한다', () => {
        expect(isToday(new Date())).toBe(true)
    })

    test('어제 날짜면 false를 반환한다', () => {
        const yesterday = dayjs().subtract(1, 'day').toDate()
        expect(isToday(yesterday)).toBe(false)
    })
})

describe('isSameMonth', () => {
    test('같은 월이면 true를 반환한다', () => {
        expect(isSameMonth(new Date(2026, 2, 1), new Date(2026, 2, 31))).toBe(true)
    })

    test('다른 월이면 false를 반환한다', () => {
        expect(isSameMonth(new Date(2026, 2, 1), new Date(2026, 3, 1))).toBe(false)
    })
})

describe('getMonthDays', () => {
    test('6주 x 7일 = 42일의 그리드를 반환한다', () => {
        const weeks = getMonthDays(2026, 2)
        expect(weeks).toHaveLength(6)
        weeks.forEach((week) => expect(week).toHaveLength(7))
    })

    test('첫 번째 날이 일요일로 시작한다', () => {
        const weeks = getMonthDays(2026, 2)
        expect(weeks[0][0].getDay()).toBe(0)
    })

    test('이전 달과 다음 달 날짜가 포함된다', () => {
        const weeks = getMonthDays(2026, 2)
        const firstDay = weeks[0][0]
        const lastDay = weeks[5][6]
        expect(firstDay.getMonth()).toBeLessThanOrEqual(2)
        expect(lastDay.getMonth()).toBeGreaterThanOrEqual(2)
    })

    test('2월의 그리드를 올바르게 생성한다', () => {
        const weeks = getMonthDays(2026, 1)
        expect(weeks).toHaveLength(6)
        const allDays = weeks.flat()
        const febDays = allDays.filter((d) => d.getMonth() === 1 && d.getFullYear() === 2026)
        expect(febDays).toHaveLength(28)
    })
})

describe('addMonths', () => {
    test('다음 달로 이동한다', () => {
        const d = addMonths(new Date(2026, 2, 15), 1)
        expect(d.getMonth()).toBe(3)
    })

    test('이전 달로 이동한다', () => {
        const d = addMonths(new Date(2026, 2, 15), -1)
        expect(d.getMonth()).toBe(1)
    })

    test('12월에서 1월로 넘어간다', () => {
        const d = addMonths(new Date(2026, 11, 15), 1)
        expect(d.getFullYear()).toBe(2027)
        expect(d.getMonth()).toBe(0)
    })

    test('1월에서 12월로 넘어간다', () => {
        const d = addMonths(new Date(2026, 0, 15), -1)
        expect(d.getFullYear()).toBe(2025)
        expect(d.getMonth()).toBe(11)
    })
})

describe('computeWeekLayouts', () => {
    const makeWeek = (startDate: string) => {
        const d = dayjs(startDate).startOf('week')
        return Array.from({ length: 7 }, (_, i) => d.add(i, 'day').toDate())
    }

    test('이벤트가 없으면 빈 layouts를 반환한다', () => {
        const week = makeWeek('2026-03-08')
        const result = computeWeekLayouts(week, [])
        expect(result.layouts).toHaveLength(0)
        expect(Object.keys(result.overflowByDay)).toHaveLength(0)
    })

    test('단일 이벤트를 lane 0에 배치한다', () => {
        const week = makeWeek('2026-03-08')
        const events = [makeEvent({ id: '1', startDate: '2026-03-09', endDate: '2026-03-09' })]
        const result = computeWeekLayouts(week, events)
        expect(result.layouts).toHaveLength(1)
        expect(result.layouts[0].lane).toBe(0)
    })

    test('겹치는 이벤트를 다른 lane에 배치한다', () => {
        const week = makeWeek('2026-03-08')
        const events = [
            makeEvent({ id: '1', startDate: '2026-03-09', endDate: '2026-03-09' }),
            makeEvent({ id: '2', startDate: '2026-03-09', endDate: '2026-03-09' }),
        ]
        const result = computeWeekLayouts(week, events)
        expect(result.layouts).toHaveLength(2)
        const lanes = result.layouts.map((l) => l.lane).sort()
        expect(lanes).toEqual([0, 1])
    })

    test('5개 이상 이벤트는 overflow로 처리한다', () => {
        const week = makeWeek('2026-03-08')
        const events = Array.from({ length: 6 }, (_, i) => makeEvent({ id: String(i), startDate: '2026-03-09', endDate: '2026-03-09' }))
        const result = computeWeekLayouts(week, events)
        const overflowCount = Object.values(result.overflowByDay).flat().length
        expect(overflowCount).toBeGreaterThan(0)
    })

    test('멀티데이 이벤트의 span이 올바르다', () => {
        const week = makeWeek('2026-03-08')
        const events = [makeEvent({ id: '1', startDate: '2026-03-09', endDate: '2026-03-11' })]
        const result = computeWeekLayouts(week, events)
        expect(result.layouts[0].span).toBe(3)
    })

    test('주 경계를 넘는 이벤트의 isStart/isEnd를 올바르게 설정한다', () => {
        const week = makeWeek('2026-03-08')
        const events = [makeEvent({ id: '1', startDate: '2026-03-05', endDate: '2026-03-10' })]
        const result = computeWeekLayouts(week, events)
        expect(result.layouts[0].isStart).toBe(false)
        expect(result.layouts[0].isEnd).toBe(true)
    })

    test('이벤트를 길이 기준으로 정렬한다 (긴 것 우선)', () => {
        const week = makeWeek('2026-03-08')
        const events = [
            makeEvent({ id: '1', startDate: '2026-03-09', endDate: '2026-03-09', title: 'Short' }),
            makeEvent({ id: '2', startDate: '2026-03-09', endDate: '2026-03-12', title: 'Long' }),
        ]
        const result = computeWeekLayouts(week, events)
        const longEvent = result.layouts.find((l) => l.event.title === 'Long')
        expect(longEvent?.lane).toBe(0)
    })
})

describe('generateId', () => {
    test('UUID 형식의 문자열을 반환한다', () => {
        const id = generateId()
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })

    test('매 호출마다 고유한 값을 반환한다', () => {
        const ids = Array.from({ length: 100 }, () => generateId())
        const unique = new Set(ids)
        expect(unique.size).toBe(100)
    })
})
