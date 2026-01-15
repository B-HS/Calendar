import { auth } from '$lib/auth.js'

export const load = async ({ request, depends }) => {
    depends('auth:session')

    const sessionInfo = await auth.api.getSession({
        headers: request.headers,
    })

    return {
        sessionInfo,
    }
}
