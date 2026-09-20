import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlClient: postgres.Sql | null = null;
let isConnected = false;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!dbInstance) {
    try {
      sqlClient = postgres(process.env.DATABASE_URL, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        onnotice: () => {},
      });
      dbInstance = drizzle(sqlClient, { schema });
    } catch (err) {
      console.warn('PostgreSQL connection initialization note:', err);
      return null;
    }
  }

  return dbInstance;
}

export function isDbConnected(): boolean {
  return isConnected;
}

export async function initDatabase() {
  const db = getDb();
  if (!db || !sqlClient) {
    console.log('ℹ️ DATABASE_URL not set or unreachable. Running in memory/client storage mode until PostgreSQL is connected.');
    return;
  }

  try {
    // Test connection & ensure tables exist automatically
    await sqlClient`
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        username text NOT NULL UNIQUE,
        full_name text NOT NULL,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role text NOT NULL DEFAULT 'INVENTORY_USER',
        department text,
        active boolean NOT NULL DEFAULT true,
        permission_overrides jsonb,
        last_login_at timestamp,
        created_at timestamp NOT NULL DEFAULT NOW(),
        updated_at timestamp NOT NULL DEFAULT NOW()
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS app_entities (
        id serial PRIMARY KEY,
        entity_type text NOT NULL UNIQUE,
        data jsonb NOT NULL,
        updated_by text,
        updated_at timestamp NOT NULL DEFAULT NOW()
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id text PRIMARY KEY,
        date text NOT NULL,
        time text NOT NULL,
        user_id text,
        user_name text NOT NULL,
        user_role text,
        action text NOT NULL,
        document_type text NOT NULL,
        document_number text NOT NULL,
        old_value text,
        new_value text,
        details text NOT NULL,
        created_at timestamp NOT NULL DEFAULT NOW()
      );
    `;

    isConnected = true;
    console.log(' Connected to PostgreSQL database successfully via Drizzle.');
  } catch (err: any) {
    isConnected = false;
    console.warn('⚠️ Could not connect to PostgreSQL (will retry on next request):', err?.message || err);
  }
}

export { schema };
