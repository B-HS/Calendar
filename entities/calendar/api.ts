'use server'

import { cookies, headers } from 'next/headers'
import type { CalendarEvent } from './types'
import { API_PATH, ERROR_CODE } from '@/shared/constant/api'
import type { ApiResponse, CalendarEventResponse, CalendarGroupResponse, SubscriptionResponse } from './types'
import { toCalendarEvent, toCalendarGroup } from './types'
import { dateRangeSchema, eventFormSchema, groupFormSchema, groupUpdateSchema, uidSchema } from './validate'
import dayjs from 'dayjs'

const toExclusiveEndDate = (endDate: string) => dayjs(endDate).add(1, 'day').format('YYYY-MM-DD')
const toInclusiveEndDate = (endDate: string) => dayjs(endDate).subtract(1, 'day').format('YYYY-MM-DD')

const toClientEvent = (r: CalendarEventResponse): CalendarEvent => {
    const event = toCalendarEvent(r)
    return event.isAllDay ? { ...event, endDate: toInclusiveEndDate(event.endDate) } : event
}

const API_URL = process.env.API_URL ?? 'http://localhost:9999'

const requireAuth = async () => {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.toString()
    if (!cookieHeader) throw new Error('Unauthorized')

    const res = await fetch(`${API_URL}/api/auth/get-session`, {
        headers: { Cookie: cookieHeader },
    })

    if (!res.ok) throw new Error('Unauthorized')
    const session = await res.json()
    if (!session?.session) throw new Error('Unauthorized')

    return cookieHeader
}

const verifyCsrf = async () => {
    const headerStore = await headers()
    const origin = headerStore.get('origin')
    const host = headerStore.get('host')
    if (origin && host) {
        const originHost = new URL(origin).host
        if (originHost !== host) throw new Error('CSRF validation failed')
    }
}

const serverFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
    await verifyCsrf()
    const cookieHeader = await requireAuth()
    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieHeader,
            ...init?.headers,
        },
    })

    if (res.status === 204) return undefined as T

    return res.json()
}

export const getEventsAction = async (startDate: string, endDate: string) => {
    dateRangeSchema.parse({ startDate, endDate })
    const res = await serverFetch<ApiResponse<CalendarEventResponse[]>>(`${API_PATH.EVENTS.RANGE}?startDate=${startDate}&endDate=${endDate}`)
    if (!res.success) throw new Error(res.error.message)
    return res.data.map(toClientEvent)
}

export const getEventDetailAction = async (uid: string) => {
    uidSchema.parse(uid)
    const res = await serverFetch<ApiResponse<CalendarEventResponse>>(API_PATH.EVENTS.DETAIL(uid))
    if (!res.success) throw new Error(res.error.message)
    return toClientEvent(res.data)
}

export const createEventAction = async (input: Omit<CalendarEvent, 'id'>) => {
    eventFormSchema.parse(input)
    const body = {
        title: input.title,
        startDate: input.startDate,
        endDate: input.isAllDay ? toExclusiveEndDate(input.endDate) : input.endDate,
        startTime: input.startTime,
        endTime: input.endTime,
        isAllDay: input.isAllDay,
        groupId: input.groupId || null,
        description: input.description,
        location: input.location,
        status: input.status?.toUpperCase(),
        color: input.color,
    }
    const res = await serverFetch<ApiResponse<CalendarEventResponse>>(API_PATH.EVENTS.CREATE, {
        method: 'POST',
        body: JSON.stringify(body),
    })
    if (!res.success) throw new Error(res.error.message)
    return toClientEvent(res.data)
}

export const updateEventAction = async (uid: string, input: Partial<CalendarEvent>) => {
    uidSchema.parse(uid)
    const { ...rest } = input
    const isAllDay = rest.isAllDay ?? false
    const body = {
        ...rest,
        endDate: rest.endDate ? (isAllDay ? toExclusiveEndDate(rest.endDate) : rest.endDate) : undefined,
        groupId: rest.groupId || null,
        status: rest.status?.toUpperCase(),
    }
    const res = await serverFetch<ApiResponse<CalendarEventResponse>>(API_PATH.EVENTS.UPDATE(uid), {
        method: 'PATCH',
        body: JSON.stringify(body),
    })
    if (!res.success) throw new Error(res.error.message)
    return toClientEvent(res.data)
}

export const deleteEventAction = async (uid: string) => {
    uidSchema.parse(uid)
    await serverFetch<void>(API_PATH.EVENTS.DELETE(uid), { method: 'DELETE' })
}

export const getGroupsAction = async () => {
    const res = await serverFetch<ApiResponse<CalendarGroupResponse[]>>(API_PATH.GROUPS.LIST)
    if (!res.success) throw new Error(res.error.message)
    return res.data.map(toCalendarGroup)
}

export const createGroupAction = async (input: { name: string; color: string }) => {
    groupFormSchema.parse(input)
    const res = await serverFetch<ApiResponse<CalendarGroupResponse>>(API_PATH.GROUPS.CREATE, {
        method: 'POST',
        body: JSON.stringify(input),
    })
    if (!res.success) throw new Error(res.error.message)
    return toCalendarGroup(res.data)
}

export const updateGroupAction = async (id: string, input: { name?: string; color?: string; sortOrder?: number; isVisible?: boolean }) => {
    uidSchema.parse(id)
    groupUpdateSchema.parse(input)
    const res = await serverFetch<ApiResponse<CalendarGroupResponse>>(API_PATH.GROUPS.UPDATE(id), {
        method: 'PATCH',
        body: JSON.stringify(input),
    })
    if (!res.success) throw new Error(res.error.message)
    return toCalendarGroup(res.data)
}

export const deleteGroupAction = async (id: string) => {
    uidSchema.parse(id)
    await serverFetch<void>(API_PATH.GROUPS.DELETE(id), { method: 'DELETE' })
}

export const getSubscriptionAction = async () => {
    const res = await serverFetch<ApiResponse<SubscriptionResponse>>(API_PATH.SUBSCRIPTION.GET)
    if (!res.success) {
        if (res.error.code === ERROR_CODE.SUBSCRIPTION_NOT_FOUND) {
            return createSubscriptionAction()
        }
        throw new Error(res.error.message)
    }
    return res.data
}

export const createSubscriptionAction = async (name?: string) => {
    const res = await serverFetch<ApiResponse<SubscriptionResponse>>(API_PATH.SUBSCRIPTION.CREATE, {
        method: 'POST',
        body: JSON.stringify({ name }),
    })
    if (!res.success) throw new Error(res.error.message)
    return res.data
}

export const regenerateTokenAction = async () => {
    const res = await serverFetch<ApiResponse<{ token: string }>>(API_PATH.SUBSCRIPTION.REGENERATE_TOKEN, { method: 'POST' })
    if (!res.success) throw new Error(res.error.message)
    return res.data
}

export const regenerateIcsTokenAction = async () => {
    const res = await serverFetch<ApiResponse<{ icsToken: string }>>(API_PATH.SUBSCRIPTION.REGENERATE_ICS, { method: 'POST' })
    if (!res.success) throw new Error(res.error.message)
    return res.data
}
