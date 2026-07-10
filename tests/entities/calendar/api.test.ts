import { describe, test, expect, mock, beforeEach, afterAll } from 'bun:test'
import type { CalendarEventResponse } from '@/entities/calendar/types'

mock.module('next/headers', () => ({
    cookies: async () => ({ toString: () => 'session=test-cookie' }),
    headers: async () => ({ get: () => null }),
}))

const SESSION_PATH = 'get-session'

const eventResponse: CalendarEventResponse = {
    id: 'e1',
    uid: 'e1',
    title: '회의',
    startDate: '2026-03-16',
    endDate: '2026-03-16',
    startTime: null,
    endTime: null,
    isAllDay: true,
    groupId: 'work',
    sequence: 0,
}

let updateBody: Record<string, unknown> | null = null
const originalFetch = globalThis.fetch

const captureUpdateFetch = (async (url: string, init?: RequestInit) => {
    if (String(url).includes(SESSION_PATH)) {
        return { ok: true, status: 200, json: async () => ({ session: { id: 's' } }) } as Response
    }
    updateBody = init?.body ? JSON.parse(String(init.body)) : null
    return { status: 200, json: async () => ({ success: true, data: eventResponse }) } as Response
}) as typeof fetch

const runUpdate = async (input: Parameters<typeof import('@/entities/calendar/api').updateEventAction>[1]) => {
    const { updateEventAction } = await import('@/entities/calendar/api')
    await updateEventAction('e1', input)
    return updateBody
}

beforeEach(() => {
    updateBody = null
    globalThis.fetch = captureUpdateFetch
})

afterAll(() => {
    globalThis.fetch = originalFetch
})

describe('updateEventAction payload', () => {
    test('드래그/리사이즈 업데이트(groupId 미포함)는 payload 에 groupId 를 넣지 않는다', async () => {
        const body = await runUpdate({ startDate: '2026-03-16', endDate: '2026-03-16', isAllDay: true })
        expect(body).not.toBeNull()
        expect('groupId' in body!).toBe(false)
    })

    test('groupId 를 전달하면 payload 에 그대로 포함한다', async () => {
        const body = await runUpdate({ groupId: 'work' })
        expect(body?.groupId).toBe('work')
    })

    test('빈 문자열 groupId(그룹 해제)는 null 로 전송한다', async () => {
        const body = await runUpdate({ groupId: '' })
        expect(body?.groupId).toBeNull()
    })
})
