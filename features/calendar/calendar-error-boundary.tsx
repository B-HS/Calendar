'use client'

import { Button } from '@/shared/ui/button'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ko } from '@/shared/lib/i18n'
import type { CalendarLocale } from '@/entities/calendar/types'

type Props = { children: ReactNode; fallbackMessage?: string; locale?: CalendarLocale }
type State = { hasError: boolean }

export class CalendarErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[CalendarErrorBoundary]', error, info)
    }

    render() {
        if (this.state.hasError) {
            const locale = this.props.locale ?? ko
            return (
                <div className='flex h-full flex-col items-center justify-center gap-3 p-8 text-center'>
                    <p className='text-sm text-muted-foreground'>{this.props.fallbackMessage ?? locale.errorOccurred}</p>
                    <Button variant='outline' size='sm' onClick={() => this.setState({ hasError: false })}>
                        {locale.retry}
                    </Button>
                </div>
            )
        }
        return this.props.children
    }
}
