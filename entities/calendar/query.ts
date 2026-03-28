'use client'

import { ko } from '@/shared/lib/i18n'
import type { CalendarEvent, CalendarGroup } from './types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    createEventAction,
    createGroupAction,
    deleteEventAction,
    deleteGroupAction,
    getEventsAction,
    getGroupsAction,
    getSubscriptionAction,
    regenerateIcsTokenAction,
    regenerateTokenAction,
    updateEventAction,
    updateGroupAction,
} from './api'

export const CALENDAR_QUERY_KEY = {
    EVENTS: {
        RANGE: (startDate: string, endDate: string) => ['calendar', 'events', startDate, endDate] as const,
        ALL: ['calendar', 'events'] as const,
    },
    GROUPS: ['calendar', 'groups'] as const,
    SUBSCRIPTION: ['calendar', 'subscription'] as const,
} as const

export const useCalendarEvents = (startDate: string, endDate: string) =>
    useQuery({
        queryKey: CALENDAR_QUERY_KEY.EVENTS.RANGE(startDate, endDate),
        queryFn: () => getEventsAction(startDate, endDate),
    })

export const useCalendarGroups = () =>
    useQuery({
        queryKey: CALENDAR_QUERY_KEY.GROUPS,
        queryFn: () => getGroupsAction(),
    })

export const useCalendarSubscription = () =>
    useQuery({
        queryKey: CALENDAR_QUERY_KEY.SUBSCRIPTION,
        queryFn: () => getSubscriptionAction(),
    })

export const useCreateEvent = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: Omit<CalendarEvent, 'id'>) => createEventAction(input),
        onSuccess: () => toast.success(ko.eventCreated),
        onError: (err) => toast.error(ko.eventCreationFailed(err.message)),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY.EVENTS.ALL })
        },
    })
}

export const useUpdateEvent = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ uid, input }: { uid: string; input: Partial<CalendarEvent> }) => updateEventAction(uid, input),
        onMutate: async ({ uid, input }) => {
            await queryClient.cancelQueries({ queryKey: CALENDAR_QUERY_KEY.EVENTS.ALL })
            const previousQueries = queryClient.getQueriesData<CalendarEvent[]>({ queryKey: CALENDAR_QUERY_KEY.EVENTS.ALL })

            queryClient.setQueriesData<CalendarEvent[]>({ queryKey: CALENDAR_QUERY_KEY.EVENTS.ALL }, (old) =>
                old?.map((e) => (e.id === uid ? { ...e, ...input } : e)),
            )

            return { previousQueries }
        },
        onError: (err, _vars, context) => {
            context?.previousQueries.forEach(([key, data]) => {
                queryClient.setQueryData(key, data)
            })
            toast.error(ko.eventUpdateFailed(err.message))
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY.EVENTS.ALL })
        },
    })
}

export const useDeleteEvent = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (uid: string) => deleteEventAction(uid),
        onMutate: async (uid) => {
            await queryClient.cancelQueries({ queryKey: CALENDAR_QUERY_KEY.EVENTS.ALL })
            const previousQueries = queryClient.getQueriesData<CalendarEvent[]>({ queryKey: CALENDAR_QUERY_KEY.EVENTS.ALL })

            queryClient.setQueriesData<CalendarEvent[]>({ queryKey: CALENDAR_QUERY_KEY.EVENTS.ALL }, (old) => old?.filter((e) => e.id !== uid))

            return { previousQueries }
        },
        onSuccess: () => toast.success(ko.eventDeleted),
        onError: (err, _vars, context) => {
            context?.previousQueries.forEach(([key, data]) => {
                queryClient.setQueryData(key, data)
            })
            toast.error(ko.eventDeletionFailed(err.message))
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY.EVENTS.ALL })
        },
    })
}

export const useCreateGroup = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: { name: string; color: string }) => createGroupAction(input),
        onSuccess: () => toast.success(ko.groupCreated),
        onError: (err) => toast.error(ko.groupCreationFailed(err.message)),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY.GROUPS })
        },
    })
}

export const useUpdateGroup = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: { name?: string; color?: string; sortOrder?: number; isVisible?: boolean } }) =>
            updateGroupAction(id, input),
        onMutate: async ({ id, input }) => {
            await queryClient.cancelQueries({ queryKey: CALENDAR_QUERY_KEY.GROUPS })
            const previous = queryClient.getQueryData<CalendarGroup[]>(CALENDAR_QUERY_KEY.GROUPS)

            queryClient.setQueryData<CalendarGroup[]>(CALENDAR_QUERY_KEY.GROUPS, (old) =>
                old?.map((g) => (g.id === id ? { ...g, ...(input.isVisible !== undefined ? { visible: input.isVisible } : {}), ...input } : g)),
            )

            return { previous }
        },
        onError: (err, _vars, context) => {
            queryClient.setQueryData(CALENDAR_QUERY_KEY.GROUPS, context?.previous)
            toast.error(ko.groupUpdateFailed(err.message))
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY.GROUPS })
        },
    })
}

export const useDeleteGroup = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => deleteGroupAction(id),
        onSuccess: () => toast.success(ko.groupDeleted),
        onError: (err) => toast.error(ko.groupDeletionFailed(err.message)),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY.GROUPS })
        },
    })
}

export const useRegenerateToken = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () => regenerateTokenAction(),
        onSuccess: () => toast.success(ko.caldavTokenRegenerated),
        onError: (err) => toast.error(ko.tokenRegenerationFailed(err.message)),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY.SUBSCRIPTION })
        },
    })
}

export const useRegenerateIcsToken = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () => regenerateIcsTokenAction(),
        onSuccess: () => toast.success(ko.icsTokenRegenerated),
        onError: (err) => toast.error(ko.tokenRegenerationFailed(err.message)),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY.SUBSCRIPTION })
        },
    })
}
