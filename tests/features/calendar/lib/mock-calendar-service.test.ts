import { describe, test, expect, beforeEach } from 'bun:test'
import { createMockCalendarService } from '@/tests/mock/mock-calendar-service'
import type { CalendarService } from '@/tests/mock/calendar-service'
import type { CalendarEvent, CalendarGroup } from '@/entities/calendar/types'

const seedEvents: CalendarEvent[] = [
    { id: '1', title: '이벤트 1', startDate: '2026-03-10', endDate: '2026-03-10', groupId: 'g1', isAllDay: true },
    { id: '2', title: '이벤트 2', startDate: '2026-03-15', endDate: '2026-03-17', groupId: 'g1', isAllDay: true },
    { id: '3', title: '이벤트 3', startDate: '2026-04-05', endDate: '2026-04-05', groupId: 'g2', isAllDay: true },
]

const seedGroups: CalendarGroup[] = [
    { id: 'g1', name: '개인', color: 'bg-blue-500', visible: true },
    { id: 'g2', name: '직장', color: 'bg-red-500', visible: true },
]

let service: CalendarService

beforeEach(() => {
    service = createMockCalendarService([...seedEvents], [...seedGroups])
})

describe('MockCalendarService - Events', () => {
    test('날짜 범위로 이벤트를 필터링한다', async () => {
        const result = await service.getEvents({ startDate: '2026-03-01', endDate: '2026-03-31' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data).toHaveLength(2)
        }
    })

    test('이벤트를 ID로 조회한다', async () => {
        const result = await service.getEvent('1')
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.title).toBe('이벤트 1')
        }
    })

    test('존재하지 않는 이벤트 조회 시 에러를 반환한다', async () => {
        const result = await service.getEvent('nonexistent')
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.code).toBe('EVENT_NOT_FOUND')
        }
    })

    test('이벤트를 생성한다', async () => {
        const result = await service.createEvent({
            title: '새 이벤트',
            startDate: '2026-03-20',
            endDate: '2026-03-20',
            groupId: 'g1',
            isAllDay: true,
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.title).toBe('새 이벤트')
            expect(result.data.id).toBeDefined()
        }

        const all = await service.getEvents({ startDate: '2026-03-01', endDate: '2026-03-31' })
        if (all.success) {
            expect(all.data).toHaveLength(3)
        }
    })

    test('이벤트를 수정한다', async () => {
        const result = await service.updateEvent('1', { title: '수정된 이벤트' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.title).toBe('수정된 이벤트')
            expect(result.data.startDate).toBe('2026-03-10')
        }
    })

    test('존재하지 않는 이벤트 수정 시 에러를 반환한다', async () => {
        const result = await service.updateEvent('nonexistent', { title: 'X' })
        expect(result.success).toBe(false)
    })

    test('이벤트를 삭제한다', async () => {
        const result = await service.deleteEvent('1')
        expect(result.success).toBe(true)

        const check = await service.getEvent('1')
        expect(check.success).toBe(false)
    })

    test('존재하지 않는 이벤트 삭제 시 에러를 반환한다', async () => {
        const result = await service.deleteEvent('nonexistent')
        expect(result.success).toBe(false)
    })
})

describe('MockCalendarService - Groups', () => {
    test('모든 그룹을 조회한다', async () => {
        const result = await service.getGroups()
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data).toHaveLength(2)
        }
    })

    test('그룹을 생성한다', async () => {
        const result = await service.createGroup({ name: '가족', color: 'bg-green-500', visible: true })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.name).toBe('가족')
            expect(result.data.id).toBeDefined()
        }
    })

    test('그룹을 수정한다', async () => {
        const result = await service.updateGroup('g1', { name: '나의 일정' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.name).toBe('나의 일정')
            expect(result.data.color).toBe('bg-blue-500')
        }
    })

    test('존재하지 않는 그룹 수정 시 에러를 반환한다', async () => {
        const result = await service.updateGroup('nonexistent', { name: 'X' })
        expect(result.success).toBe(false)
    })

    test('그룹을 삭제한다', async () => {
        const result = await service.deleteGroup('g2')
        expect(result.success).toBe(true)

        const all = await service.getGroups()
        if (all.success) {
            expect(all.data).toHaveLength(1)
        }
    })

    test('존재하지 않는 그룹 삭제 시 에러를 반환한다', async () => {
        const result = await service.deleteGroup('nonexistent')
        expect(result.success).toBe(false)
    })
})
