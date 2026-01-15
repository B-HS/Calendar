import { auth } from '$lib/auth'
import { svelteKitHandler } from 'better-auth/svelte-kit'
import { building } from '$app/environment'

export const handle = async ({ event, resolve }) => svelteKitHandler({ event, resolve, auth, building })
