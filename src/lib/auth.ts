import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { BETTER_AUTH_SECRET } from '$env/static/private'
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
})

export type Session = typeof auth.$Infer.Session
