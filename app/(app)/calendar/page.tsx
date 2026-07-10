import { getEventsAction, getGroupsAction } from '@/entities/calendar/api'
import { CalendarLoading } from '@/features/calendar/calendar-loading'
import { getMonthGridRange } from '@/shared/lib/calendar-utils'
import { CalendarWidget } from '@/widgets/calendar/calendar-widget'
import { connection } from 'next/server'
import { Suspense } from 'react'

const CalendarContent = async () => {
    await connection()

    const today = new Date().toISOString().slice(0, 10)
    const { startDate, endDate } = getMonthGridRange(today)

    const [events, groups] = await Promise.all([getEventsAction(startDate, endDate), getGroupsAction()])

    return <CalendarWidget today={today} initialEvents={events} initialGroups={groups} />
}

const CalendarPage = () => (
    <Suspense fallback={<CalendarLoading />}>
        <CalendarContent />
    </Suspense>
)

export default CalendarPage
