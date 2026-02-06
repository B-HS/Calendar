import { sequence } from '@sveltejs/kit/hooks'
import { paraglideMiddleware } from '$lib/paraglide/server'
import type { Handle } from '@sveltejs/kit'

const originalHandle: Handle = async ({ event, resolve }) => {
    return resolve(event)
}

const handleParaglide: Handle = ({ event, resolve }) =>
    paraglideMiddleware(event.request, ({ request, locale }) => {
        event.request = request

        return resolve(event, {
            transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
        })
    })

export const handle = sequence(originalHandle, handleParaglide)
