import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
import { eventApi } from './event.api'
import type { MonthQuery, CreateEventInput, UpdateEventInput, CalendarEvent } from './event.types'

export const eventKeys = {
	all: ['events'] as const,
	month: (query: MonthQuery) => [...eventKeys.all, query] as const
}

export const createEventsQuery = (query: () => MonthQuery) =>
	createQuery(() => ({
		queryKey: eventKeys.month(query()),
		queryFn: () => eventApi.getEvents(query())
	}))

export const createCreateEventMutation = () => {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (data: CreateEventInput) => eventApi.createEvent(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: eventKeys.all })
		}
	}))
}

export const createUpdateEventMutation = () => {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ uid, data }: { uid: string; data: UpdateEventInput }) =>
			eventApi.updateEvent(uid, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: eventKeys.all })
		}
	}))
}

export const createDeleteEventMutation = () => {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (uid: string) => eventApi.deleteEvent(uid),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: eventKeys.all })
		}
	}))
}

export const createOptimisticUpdateEventMutation = () => {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ uid, data }: { uid: string; data: UpdateEventInput }) =>
			eventApi.updateEvent(uid, data),
		onMutate: async ({ uid, data }) => {
			await queryClient.cancelQueries({ queryKey: eventKeys.all })
			const previousEvents = queryClient.getQueriesData<CalendarEvent[]>({
				queryKey: eventKeys.all
			})

			queryClient.setQueriesData<CalendarEvent[]>({ queryKey: eventKeys.all }, (old) =>
				old?.map((event) => {
					if (event.uid !== uid) return event
					return {
						...event,
						dtstart: data.dtstart ? new Date(data.dtstart) : event.dtstart,
						dtend: data.dtend ? new Date(data.dtend) : event.dtend
					}
				})
			)

			return { previousEvents }
		},
		onError: (_err, _variables, context) => {
			if (context?.previousEvents) {
				context.previousEvents.forEach(([queryKey, events]) => {
					queryClient.setQueryData(queryKey, events)
				})
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: eventKeys.all })
		}
	}))
}

export const createOptimisticDeleteEventMutation = () => {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (uid: string) => eventApi.deleteEvent(uid),
		onMutate: async (uid) => {
			await queryClient.cancelQueries({ queryKey: eventKeys.all })
			const previousEvents = queryClient.getQueriesData<CalendarEvent[]>({
				queryKey: eventKeys.all
			})

			queryClient.setQueriesData<CalendarEvent[]>({ queryKey: eventKeys.all }, (old) =>
				old?.filter((event) => event.uid !== uid)
			)

			return { previousEvents }
		},
		onError: (_err, _variables, context) => {
			if (context?.previousEvents) {
				context.previousEvents.forEach(([queryKey, events]) => {
					queryClient.setQueryData(queryKey, events)
				})
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: eventKeys.all })
		}
	}))
}
