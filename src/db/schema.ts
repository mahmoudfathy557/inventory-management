import { pgTable, text, timestamp, boolean, jsonb, serial, integer, doublePrecision } from 'drizzle-orm/pg-core';

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

// SAP Business One Item + Location Balances Table (OITW Equivalent)
export const itemLocationBalances = pgTable('item_location_balances', {
  id: text('id').primaryKey(), // `${itemId}:::${locationId}`
  itemId: text('item_id').notNull(),
  locationId: text('location_id').notNull(),
  warehouseId: text('warehouse_id').notNull(),
  onHandQty: doublePrecision('on_hand_qty').notNull().default(0),
  inventoryValue: doublePrecision('inventory_value').notNull().default(0),
  movingAverageCost: doublePrecision('moving_average_cost').notNull().default(0),
  lastDocumentNumber: text('last_document_number'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// SAP Business One Authoritative Inventory Ledger / Transactions Table (OINM Equivalent)
export const inventoryTransactions = pgTable('inventory_transactions', {
  id: text('id').primaryKey(),
  transactionCode: integer('transaction_code').notNull(), // 1 to 13
  transactionType: text('transaction_type').notNull(),
  documentNumber: text('document_number').notNull(),
  itemId: text('item_id').notNull(),
  itemCode: text('item_code').notNull(),
  itemName: text('item_name').notNull(),
  locationId: text('location_id').notNull(),
  destLocationId: text('dest_location_id'),
  quantity: doublePrecision('quantity').notNull(),
  unitCost: doublePrecision('unit_cost').notNull(),
  totalValue: doublePrecision('total_value').notNull(),
  preOnHandQty: doublePrecision('pre_on_hand_qty').notNull(),
  preInventoryValue: doublePrecision('pre_inventory_value').notNull(),
  preMovingAverageCost: doublePrecision('pre_moving_average_cost').notNull(),
  postOnHandQty: doublePrecision('post_on_hand_qty').notNull(),
  postInventoryValue: doublePrecision('post_inventory_value').notNull(),
  postMovingAverageCost: doublePrecision('post_moving_average_cost').notNull(),
  sourceDocumentType: text('source_document_type'),
  sourceDocumentNumber: text('source_document_number'),
  sourceDocumentId: text('source_document_id'),
  reference: text('reference'),
  notes: text('notes'),
  status: text('status').notNull().default('POSTED'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
