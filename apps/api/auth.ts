import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@db/index'
import * as schema from '@db/schema'

const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

if (!BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET is not set')
if (!GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID is not set')
if (!GOOGLE_CLIENT_SECRET) throw new Error('GOOGLE_CLIENT_SECRET is not set')

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

if (!BETTER_AUTH_URL) throw new Error('BETTER_AUTH_URL is not set')

export const auth = betterAuth({
    baseURL: BETTER_AUTH_URL,
    secret: BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
        provider: 'mysql',
        schema,
    }),
    trustedOrigins: [FRONTEND_URL, BETTER_AUTH_URL],
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

export type AuthSession = typeof auth.$Infer.Session
