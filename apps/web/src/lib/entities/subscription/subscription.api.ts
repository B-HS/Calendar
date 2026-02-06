import { apiClient } from '$lib/api/client'
import { PUBLIC_API_URL } from '$env/static/public'
import type {
	SubscriptionResponse,
	CreateSubscriptionInput,
	RegenerateTokenResponse,
	RegenerateIcsTokenResponse
} from './subscription.types'

export const subscriptionApi = {
	getSubscription: () => apiClient.get<SubscriptionResponse>('/api/calendar/subscription'),

	createSubscription: (data?: CreateSubscriptionInput) =>
		apiClient.post<SubscriptionResponse, CreateSubscriptionInput | undefined>(
			'/api/calendar/subscription',
			data
		),

	regenerateToken: () =>
		apiClient.post<RegenerateTokenResponse, undefined>(
			'/api/calendar/subscription/regenerate',
			undefined
		),

	regenerateIcsToken: () =>
		apiClient.post<RegenerateIcsTokenResponse, undefined>(
			'/api/calendar/subscription/regenerate-ics',
			undefined
		),

	getMobileconfigUrl: () => `${PUBLIC_API_URL}/api/calendar/subscription/mobileconfig`
}
