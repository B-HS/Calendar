import { mysqlTable, varchar, text, boolean, timestamp, datetime, tinyint, json, mysqlEnum } from 'drizzle-orm/mysql-core'

export const user = mysqlTable('user', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    timezone: varchar('timezone', { length: 64 }).notNull().default('Asia/Seoul'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
})

export const session = mysqlTable('session', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
})

export const account = mysqlTable('account', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    accountId: varchar('account_id', { length: 255 }).notNull(),
    providerId: varchar('provider_id', { length: 255 }).notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    idToken: text('id_token'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
})

export const verification = mysqlTable('verification', {
    id: varchar('id', { length: 36 }).primaryKey(),
    identifier: varchar('identifier', { length: 255 }).notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
})

export const calendarEvent = mysqlTable('calendar_event', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    uid: varchar('uid', { length: 255 }).notNull().unique(),
    summary: varchar('summary', { length: 500 }).notNull(),
    description: text('description'),
    location: varchar('location', { length: 500 }),
    dtstart: datetime('dtstart').notNull(),
    dtend: datetime('dtend').notNull(),
    isAllDay: boolean('is_all_day').notNull().default(false),
    rrule: json('rrule').$type<{
        freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
        interval?: number
        count?: number
        until?: string
        byDay?: string[]
        byMonth?: number[]
        byMonthDay?: number[]
    } | null>(),
    status: mysqlEnum('status', ['TENTATIVE', 'CONFIRMED', 'CANCELLED']).default('CONFIRMED'),
    transp: mysqlEnum('transp', ['TRANSPARENT', 'OPAQUE']).default('OPAQUE'),
    priority: tinyint('priority'),
    categories: json('categories').$type<string[]>(),
    color: varchar('color', { length: 50 }),
    dtstamp: datetime('dtstamp').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
})

export const calendarSubscription = mysqlTable('calendar_subscription', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 64 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    isActive: boolean('is_active').notNull().default(true),
    lastAccessedAt: datetime('last_accessed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
})
