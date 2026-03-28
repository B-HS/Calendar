import { getEventsAction, getGroupsAction } from '@/entities/calendar/api'
import { CalendarLoading } from '@/features/calendar/calendar-loading'
import { DATE_FORMAT } from '@/shared/constant/date'
import { CalendarWidget } from '@/widgets/calendar/calendar-widget'
import dayjs from 'dayjs'
import { connection } from 'next/server'
import { Suspense } from 'react'

const CalendarContent = async () => {
    await connection()

    const today = new Date().toISOString().slice(0, 10)
    const startDate = dayjs(today).startOf('month').startOf('week').format(DATE_FORMAT)
    const endDate = dayjs(today).endOf('month').endOf('week').format(DATE_FORMAT)

    const [events, groups] = await Promise.all([getEventsAction(startDate, endDate), getGroupsAction()])

    return <CalendarWidget today={today} initialEvents={events} initialGroups={groups} />
}

const CalendarPage = () => (
    <Suspense fallback={<CalendarLoading />}>
        <CalendarContent />
    </Suspense>
)

export default CalendarPage
