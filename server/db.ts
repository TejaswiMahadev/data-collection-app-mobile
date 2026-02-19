import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set. Database operations will fail if storage is switched to DatabaseStorage.");
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
