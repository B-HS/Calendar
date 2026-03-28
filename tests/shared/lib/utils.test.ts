import { describe, test, expect } from 'bun:test'
import { cn } from '@/shared/lib/utils'

describe('cn', () => {
    test('클래스명을 병합한다', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    test('Tailwind 충돌 클래스를 올바르게 병합한다', () => {
        expect(cn('p-4', 'p-2')).toBe('p-2')
        expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })

    test('falsy 값을 무시한다', () => {
        expect(cn('foo', false, null, undefined, 0, 'bar')).toBe('foo bar')
    })

    test('조건부 클래스를 처리한다', () => {
        const isActive = true
        const isDisabled = false
        expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active')
    })

    test('빈 입력이면 빈 문자열을 반환한다', () => {
        expect(cn()).toBe('')
    })
})
