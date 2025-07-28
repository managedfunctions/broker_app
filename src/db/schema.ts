import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  company: text('company'),
  role: text('role').default('user'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const userReceipts = sqliteTable('user_receipts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiptId: text('receipt_id').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer('created_by'),
});

export const otps = sqliteTable('otps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: text('expires_at').notNull(),
  used: integer('used', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserReceipt = typeof userReceipts.$inferSelect;
export type NewUserReceipt = typeof userReceipts.$inferInsert;
export type Otp = typeof otps.$inferSelect;
export type NewOtp = typeof otps.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;