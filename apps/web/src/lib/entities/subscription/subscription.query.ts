import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
import { subscriptionApi } from './subscription.api'
import type { CreateSubscriptionInput } from './subscription.types'

export const subscriptionKeys = {
	all: ['subscription'] as const,
	detail: () => [...subscriptionKeys.all, 'detail'] as const
}

export const createSubscriptionQuery = () =>
	createQuery(() => ({
		queryKey: subscriptionKeys.detail(),
		queryFn: () => subscriptionApi.getSubscription(),
		retry: false
	}))

export const createCreateSubscriptionMutation = () => {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (data?: CreateSubscriptionInput | void) =>
			subscriptionApi.createSubscription(data ?? undefined),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
		}
	}))
}

export const createRegenerateTokenMutation = () => {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (_?: void) => subscriptionApi.regenerateToken(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
		}
	}))
}

export const createRegenerateIcsTokenMutation = () => {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (_?: void) => subscriptionApi.regenerateIcsToken(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
		}
	}))
}
