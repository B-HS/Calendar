import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import { env } from '$env/dynamic/private'

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set')

export const pool = mysql.createPool(env.DATABASE_URL)

export const db = drizzle(pool, { schema, mode: 'default' })
