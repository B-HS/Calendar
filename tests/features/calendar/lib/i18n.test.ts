import { describe, test, expect } from 'bun:test'
import { ko, en, ja, locales } from '@/shared/lib/i18n'
import type { CalendarLocale } from '@/entities/calendar/types'

describe('i18n locales', () => {
    const localeEntries: [string, CalendarLocale][] = Object.entries(locales)

    test('모든 locale이 동일한 키를 가진다', () => {
        const koKeys = Object.keys(ko).sort()
        for (const [_, locale] of localeEntries) {
            const keys = Object.keys(locale).sort()
            expect(keys).toEqual(koKeys)
        }
    })

    test.each(localeEntries)('%s locale의 weekdays가 7개이다', (_: string, locale: CalendarLocale) => {
        expect(locale.weekdays).toHaveLength(7)
    })

    test.each(localeEntries)('%s locale의 monthNames가 12개이다', (_: string, locale: CalendarLocale) => {
        expect(locale.monthNames).toHaveLength(12)
    })

    test('ko more 함수가 올바른 형식을 반환한다', () => {
        expect(ko.more(3)).toBe('+3개 더보기')
    })

    test('en more 함수가 올바른 형식을 반환한다', () => {
        expect(en.more(3)).toBe('+3 more')
    })

    test('ja more 함수가 올바른 형식을 반환한다', () => {
        expect(ja.more(3)).toBe('他3件')
    })

    test('모든 locale의 문자열 키가 비어있지 않다', () => {
        for (const [name, locale] of localeEntries) {
            for (const [key, value] of Object.entries(locale)) {
                if (typeof value === 'string') {
                    expect(value.length).toBeGreaterThan(0)
                }
            }
        }
    })
})
