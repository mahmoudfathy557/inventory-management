import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlClient: postgres.Sql | null = null;
let isConnected = false;

function getPostgresOptions(): postgres.Options<{}> | string | null {
  // If Cloud SQL instance is provisioned (e.g. in AI Studio / Cloud Run), connect via unix socket
  if (process.env.SQL_HOST) {
    return {
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => {},
    };
  }

  // Fallback to DATABASE_URL only if it is not pointing to an unreachable docker-compose alias
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.includes('@postgres:')) {
    return dbUrl;
  }

  return null;
}

export function getDb() {
  const options = getPostgresOptions();
  if (!options) {
    return null;
  }

  if (!dbInstance) {
    try {
      sqlClient = typeof options === 'string'
        ? postgres(options, {
            max: 10,
            idle_timeout: 20,
            connect_timeout: 10,
            onnotice: () => {},
          })
        : postgres(options);
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

export async function checkDatabase(timeoutMs = 3000): Promise<boolean> {
  const client = sqlClient;
  if (!client) return false;
  try {
    await Promise.race([
      client`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database health check timed out')), timeoutMs)
      ),
    ]);
    isConnected = true;
    return true;
  } catch {
    isConnected = false;
    return false;
  }
}

export async function closeDatabase(): Promise<void> {
  const client = sqlClient;
  if (!client) return;
  try {
    await client.end({ timeout: 5 });
  } finally {
    sqlClient = null;
    dbInstance = null;
    isConnected = false;
  }
}

export async function initDatabase() {
  const db = getDb();
  if (!db || !sqlClient) {
    console.log('ℹ️ Running in memory/client storage mode (Cloud SQL / PostgreSQL not configured).');
    return;
  }

  try {
    // Quick test ping
    await Promise.race([
      sqlClient`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Initial database ping timed out')), 5000)
      ),
    ]);

    // Test connection & ensure tables exist automatically
    try {
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
    } catch (tableErr: any) {
      console.warn('Note on table creation (tables may already exist):', tableErr?.message || tableErr);
    }

    isConnected = true;
    console.log(' Connected to PostgreSQL database successfully via Drizzle.');
  } catch (err: any) {
    isConnected = false;
    console.warn('⚠️ Could not connect to PostgreSQL (will retry on next request):', err?.message || err);
  }
}

export { schema };
