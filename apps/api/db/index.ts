import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

export type Database = ReturnType<typeof createDb>

export const createDb = (pool: mysql.Pool) => drizzle(pool, { schema, mode: 'default' })

export const createPool = (url: string) =>
    mysql.createPool({
        uri: url,
        timezone: '+00:00',
    })

const poolConnection = mysql.createPool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT!),
    user: process.env.DATABASE_USERNAME,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
})

export const db = createDb(poolConnection)
