import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    if (process.env.SQL_HOST) {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else if (process.env.DATABASE_URL) {
      global._postgresPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    if (global._postgresPool) {
      global._postgresPool.on('error', (err) => {
        console.error('Unexpected error on idle SQL pool client:', err);
      });
    }
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = pool ? drizzle(pool, { schema }) : null;

export function getDb() {
  if (!db) {
    const p = createPool();
    return p ? drizzle(p, { schema }) : null;
  }
  return db;
}

export function isDbConnected(): boolean {
  return pool !== null && pool !== undefined;
}

export async function checkDatabase(timeoutMs = 5000): Promise<boolean> {
  const p = createPool();
  if (!p) return false;
  try {
    const res = await p.query('SELECT 1');
    return res.rowCount !== null && res.rowCount > 0;
  } catch (err) {
    return false;
  }
}

export async function closeDatabase(): Promise<void> {
  if (global._postgresPool) {
    await global._postgresPool.end();
    global._postgresPool = undefined;
  }
}

export async function initDatabase() {
  const p = createPool();
  if (!p) {
    console.log('ℹ️ No database credentials found.');
    return;
  }
  try {
    await p.query('SELECT 1');
    console.log(' Connected to PostgreSQL Cloud SQL database successfully via Drizzle.');
  } catch (err: any) {
    console.warn('⚠️ Could not connect to PostgreSQL Cloud SQL:', err?.message || err);
  }
}

export { schema };
