import { redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
	const { sessionInfo } = await parent()
	if (!sessionInfo?.user) {
		throw redirect(302, '/login')
	}
	return {
		user: sessionInfo.user
	}
}
