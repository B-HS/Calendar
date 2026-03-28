import { describe, test, expect } from 'bun:test'
import { eventFormSchema } from '@/entities/calendar/validate'

const validEvent = {
    title: '회의',
    startDate: '2026-03-15',
    endDate: '2026-03-15',
    groupId: 'work',
    isAllDay: true,
}

describe('eventFormSchema', () => {
    test('유효한 이벤트 데이터를 통과시킨다', () => {
        const result = eventFormSchema.safeParse(validEvent)
        expect(result.success).toBe(true)
    })

    test('선택 필드가 포함된 데이터를 통과시킨다', () => {
        const result = eventFormSchema.safeParse({
            ...validEvent,
            description: '팀 주간 회의',
            location: '회의실 A',
            status: 'confirmed',
            color: 'bg-blue-500',
        })
        expect(result.success).toBe(true)
    })

    test('빈 제목을 거부한다', () => {
        const result = eventFormSchema.safeParse({ ...validEvent, title: '' })
        expect(result.success).toBe(false)
    })

    test('시작일이 종료일보다 늦으면 거부한다', () => {
        const result = eventFormSchema.safeParse({ ...validEvent, startDate: '2026-03-20', endDate: '2026-03-15' })
        expect(result.success).toBe(false)
    })

    test('같은 날 시작 시간이 종료 시간보다 늦으면 거부한다', () => {
        const result = eventFormSchema.safeParse({
            ...validEvent,
            isAllDay: false,
            startTime: '15:00',
            endTime: '14:00',
        })
        expect(result.success).toBe(false)
    })

    test('종일 이벤트는 시간 필드 없이 통과한다', () => {
        const result = eventFormSchema.safeParse(validEvent)
        expect(result.success).toBe(true)
    })

    test('다른 날이면 시간 역전을 허용한다', () => {
        const result = eventFormSchema.safeParse({
            ...validEvent,
            isAllDay: false,
            startDate: '2026-03-15',
            endDate: '2026-03-16',
            startTime: '23:00',
            endTime: '01:00',
        })
        expect(result.success).toBe(true)
    })

    test('잘못된 날짜 형식을 거부한다', () => {
        const result = eventFormSchema.safeParse({ ...validEvent, startDate: '2026/03/15' })
        expect(result.success).toBe(false)
    })

    test('잘못된 시간 형식을 거부한다', () => {
        const result = eventFormSchema.safeParse({ ...validEvent, isAllDay: false, startTime: '9:00' })
        expect(result.success).toBe(false)
    })

    test('100자 초과 제목을 거부한다', () => {
        const result = eventFormSchema.safeParse({ ...validEvent, title: 'a'.repeat(101) })
        expect(result.success).toBe(false)
    })

    test('유효한 status 값만 허용한다', () => {
        expect(eventFormSchema.safeParse({ ...validEvent, status: 'confirmed' }).success).toBe(true)
        expect(eventFormSchema.safeParse({ ...validEvent, status: 'tentative' }).success).toBe(true)
        expect(eventFormSchema.safeParse({ ...validEvent, status: 'cancelled' }).success).toBe(true)
        expect(eventFormSchema.safeParse({ ...validEvent, status: 'invalid' }).success).toBe(false)
    })
})
