import { defineConfig } from 'drizzle-kit';

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

export default defineConfig(
  sqlHost && sqlDbName && user && password
    ? {
        schema: './src/db/schema.ts',
        out: './drizzle',
        dialect: 'postgresql',
        dbCredentials: {
          host: sqlHost,
          user: user,
          password: password,
          database: sqlDbName,
          ssl: false,
        },
      }
    : {
        schema: './src/db/schema.ts',
        out: './drizzle',
        dialect: 'postgresql',
        dbCredentials: {
          url:
            process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('@postgres:')
              ? process.env.DATABASE_URL
              : 'postgres://inventory_user:inventory_secure_password@localhost:5432/inventory_db',
        },
      }
);
