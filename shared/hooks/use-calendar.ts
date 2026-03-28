'use client'

import { createContext, useContext, useState } from 'react'
import dayjs from 'dayjs'

import type { CalendarEvent, CalendarGroup, CalendarLocale, WeekRow } from '@/entities/calendar/types'
import { addMonths, computeWeekLayouts, formatDate, getMonthDays, parseDate } from '@/shared/lib/calendar-utils'
import { ko } from '@/shared/lib/i18n'

type CalendarContextValue = {
    currentDate: Date
    events: CalendarEvent[]
    groups: CalendarGroup[]
    selectedEventId: string | null
    selectedDate: string | null
    locale: CalendarLocale
    weekRows: WeekRow[]

    goToNextMonth: () => void
    goToPrevMonth: () => void
    goToToday: () => void

    addEvent: (event: Omit<CalendarEvent, 'id'>) => void
    updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
    deleteEvent: (id: string) => void
    selectEvent: (id: string | null) => void
    selectDate: (date: string | null) => void

    toggleGroupVisibility: (groupId: string) => void
    moveEventToGroup: (eventId: string, groupId: string) => void
    getGroupById: (groupId?: string) => CalendarGroup | undefined

    createGroup: (input: { name: string; color: string }) => void
    updateGroup: (id: string, input: { name?: string; color?: string }) => void
    deleteGroup: (id: string) => void
}

type UseCalendarProviderProps = {
    events: CalendarEvent[]
    groups: CalendarGroup[]
    locale?: CalendarLocale
    today?: string
    onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void
    onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void
    onDeleteEvent: (id: string) => void
    onToggleGroupVisibility: (groupId: string) => void
    onMoveEventToGroup: (eventId: string, groupId: string) => void
    onCreateGroup: (input: { name: string; color: string }) => void
    onUpdateGroup: (id: string, input: { name?: string; color?: string }) => void
    onDeleteGroup: (id: string) => void
    onMonthChange?: (date: Date) => void
}

export const useCalendarProvider = ({
    events,
    groups,
    locale = ko,
    today,
    onAddEvent,
    onUpdateEvent,
    onDeleteEvent,
    onToggleGroupVisibility,
    onMoveEventToGroup,
    onCreateGroup,
    onUpdateGroup,
    onDeleteGroup,
    onMonthChange,
}: UseCalendarProviderProps) => {
    const todayDate = today ? parseDate(today) : new Date()
    const [currentDate, setCurrentDate] = useState(todayDate)
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<string | null>(today ?? formatDate(todayDate))

    const visibleGroupIds = new Set(groups.filter((g) => g.visible).map((g) => g.id))
    const visibleEvents = events.filter((e) => !e.groupId || visibleGroupIds.has(e.groupId))

    const d = dayjs(currentDate)
    const weeks = getMonthDays(d.year(), d.month())
    const weekRows = weeks.map((weekDays) => computeWeekLayouts(weekDays, visibleEvents))

    const changeMonth = (next: Date) => {
        setCurrentDate(next)
        onMonthChange?.(next)
    }

    const goToNextMonth = () => changeMonth(addMonths(currentDate, 1))
    const goToPrevMonth = () => changeMonth(addMonths(currentDate, -1))
    const goToToday = () => {
        changeMonth(todayDate)
        setSelectedDate(formatDate(todayDate))
    }

    const addEvent = (event: Omit<CalendarEvent, 'id'>) => onAddEvent(event)
    const updateEvent = (id: string, updates: Partial<CalendarEvent>) => onUpdateEvent(id, updates)
    const deleteEvent = (id: string) => {
        onDeleteEvent(id)
        setSelectedEventId((prev) => (prev === id ? null : prev))
    }

    const selectEvent = (id: string | null) => setSelectedEventId(id)
    const selectDate = (date: string | null) => setSelectedDate(date)

    const toggleGroupVisibility = (groupId: string) => onToggleGroupVisibility(groupId)
    const moveEventToGroup = (eventId: string, groupId: string) => onMoveEventToGroup(eventId, groupId)
    const getGroupById = (groupId?: string) => (groupId ? groups.find((g) => g.id === groupId) : undefined)

    const createGroup = (input: { name: string; color: string }) => onCreateGroup(input)
    const updateGroup = (id: string, input: { name?: string; color?: string }) => onUpdateGroup(id, input)
    const deleteGroup = (id: string) => onDeleteGroup(id)

    return {
        currentDate,
        events,
        groups,
        selectedEventId,
        selectedDate,
        locale,
        weekRows,
        goToNextMonth,
        goToPrevMonth,
        goToToday,
        addEvent,
        updateEvent,
        deleteEvent,
        selectEvent,
        selectDate,
        toggleGroupVisibility,
        moveEventToGroup,
        getGroupById,
        createGroup,
        updateGroup,
        deleteGroup,
    } satisfies CalendarContextValue
}

export const CalendarContext = createContext<CalendarContextValue | null>(null)

export const useCalendar = () => {
    const ctx = useContext(CalendarContext)
    if (!ctx) throw new Error('useCalendar must be used within CalendarProvider')
    return ctx
}
