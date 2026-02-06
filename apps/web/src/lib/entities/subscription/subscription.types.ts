export interface SubscriptionResponse {
	token: string
	icsToken: string
	name: string | null
	caldavUrl: string
	icsUrl: string
}

export interface CreateSubscriptionInput {
	name?: string
}

export interface RegenerateTokenResponse {
	token: string
}

export interface RegenerateIcsTokenResponse {
	icsToken: string
}
