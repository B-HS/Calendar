import { describe, expect, test } from 'bun:test'
import dayjs from 'dayjs'

import { getMonthDays, getMonthGridRange } from '@/shared/lib/calendar-utils'
import { DATE_FORMAT } from '@/shared/constant/date'

describe('getMonthGridRange', () => {
    test('조회 범위가 6주 그리드의 첫날·마지막날과 정확히 일치한다', () => {
        const monthDate = '2026-02-15'
        const grid = getMonthDays(2026, 1)
        const gridStart = dayjs(grid[0][0]).format(DATE_FORMAT)
        const gridEnd = dayjs(grid[grid.length - 1][6]).format(DATE_FORMAT)

        const range = getMonthGridRange(monthDate)

        expect(range.startDate).toBe(gridStart)
        expect(range.endDate).toBe(gridEnd)
    })

    test('그리드 후행 주가 다음 달로 넘어가도 조회 endDate 가 이를 포함한다', () => {
        const range = getMonthGridRange('2026-02-15')
        const legacyEnd = dayjs('2026-02-15').endOf('month').endOf('week').format(DATE_FORMAT)

        expect(dayjs(range.endDate).isAfter(dayjs(legacyEnd)) || range.endDate === legacyEnd).toBe(true)
        expect(range.endDate).toBe('2026-03-14')
    })
})
