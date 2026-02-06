import { PUBLIC_API_URL } from '$env/static/public'

class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message)
		this.name = 'ApiError'
	}
}

const handleResponse = async <T>(response: Response): Promise<T> => {
	if (!response.ok) {
		const message = await response.text().catch(() => response.statusText)
		throw new ApiError(response.status, message)
	}
	return response.json()
}

export const apiClient = {
	get: <T>(path: string) =>
		fetch(`${PUBLIC_API_URL}${path}`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		}).then((res) => handleResponse<T>(res)),

	post: <T, B = Record<string, unknown>>(path: string, body?: B) =>
		fetch(`${PUBLIC_API_URL}${path}`, {
			method: 'POST',
			credentials: 'include',
			headers: body ? { 'Content-Type': 'application/json' } : undefined,
			body: body ? JSON.stringify(body) : undefined
		}).then((res) => handleResponse<T>(res)),

	put: <T, B = Record<string, unknown>>(path: string, body: B) =>
		fetch(`${PUBLIC_API_URL}${path}`, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}).then((res) => handleResponse<T>(res)),

	delete: <T>(path: string) =>
		fetch(`${PUBLIC_API_URL}${path}`, {
			method: 'DELETE',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		}).then((res) => handleResponse<T>(res))
}

export { ApiError }
