import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private'
import { db } from './server/db'
import * as schema from './server/db/schema'

export const auth = betterAuth({
    secret: BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
        provider: 'mysql',
        schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
        },
    },
})

export type Session = typeof auth.$Infer.Session
