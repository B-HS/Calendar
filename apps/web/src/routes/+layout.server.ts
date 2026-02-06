import { PUBLIC_API_URL } from '$env/static/public'

export const load = async ({ request, depends, fetch }) => {
	depends('auth:session')

	try {
		const response = await fetch(`${PUBLIC_API_URL}/api/auth/get-session`, {
			headers: {
				cookie: request.headers.get('cookie') ?? ''
			}
		})

		if (!response.ok) {
			return { sessionInfo: null }
		}

		const sessionInfo = await response.json()
		return { sessionInfo }
	} catch {
		return { sessionInfo: null }
	}
}
