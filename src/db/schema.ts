import { pgTable, text, timestamp, boolean, jsonb, serial, integer } from 'drizzle-orm/pg-core';

// Users table with secure authentication & RBAC
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('INVENTORY_USER'), // ADMIN, INVENTORY_USER, PRODUCTION_USER, QUALITY_USER, FINANCE_USER, MANAGEMENT_USER
  department: text('department'),
  active: boolean('active').notNull().default(true),
  permissionOverrides: jsonb('permission_overrides'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// App State / Data Storage table
// Stores synced ERP state modules: warehouses, materials, products, receipts, production orders, quality, ledger, audit, etc.
export const appEntities = pgTable('app_entities', {
  id: serial('id').primaryKey(),
  entityType: text('entity_type').notNull().unique(), // e.g. 'warehouses', 'receipts', 'productionOrders', 'ledger', 'auditLogs', 'app_state'
  data: jsonb('data').notNull(),
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Audit log entries table for full system traceability
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  userId: text('user_id'),
  userName: text('user_name').notNull(),
  userRole: text('user_role'),
  action: text('action').notNull(),
  documentType: text('document_type').notNull(),
  documentNumber: text('document_number').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
