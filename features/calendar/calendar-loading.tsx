'use client'

import type { FC } from 'react'

export const CalendarLoading: FC = () => (
    <div className='flex h-full flex-col'>
        <div className='h-10 border-b' />
        <div className='grid flex-1 grid-cols-7'>
            {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className='animate-pulse border-b border-r bg-muted/20 p-2'>
                    <div className='h-3 w-6 rounded-xs bg-muted' />
                </div>
            ))}
        </div>
    </div>
)
