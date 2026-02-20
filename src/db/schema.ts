import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// User roles
export type UserRole = 'user' | 'organizer' | 'admin';

// User status enum values
export const USER_STATUSES = ['active', 'inactive', 'banned'] as const;
export type UserStatus = typeof USER_STATUSES[number];

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  renaissanceId: text('renaissanceId').unique(), // Renaissance app user ID
  phone: text('phone').unique(), // Primary login method
  email: text('email'), // Optional
  username: text('username'),
  name: text('name'), // Display name
  pfpUrl: text('pfpUrl'), // Profile picture URL
  displayName: text('displayName'), // App-specific name (editable)
  profilePicture: text('profilePicture'), // App-specific profile picture (editable)
  accountAddress: text('accountAddress'), // Wallet address
  pinHash: text('pinHash'), // bcrypt hash of 4-digit PIN
  failedPinAttempts: integer('failedPinAttempts').default(0), // Failed PIN attempts counter
  lockedAt: integer('lockedAt', { mode: 'timestamp' }), // Timestamp when account was locked
  status: text('status').$type<UserStatus>().default('active'), // User status: active, inactive, banned
  role: text('role').$type<UserRole>().default('user').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Vendor outreach status
export const VENDOR_STATUSES = ['candidate', 'contacted', 'responded', 'converted', 'dismissed'] as const;
export type VendorStatus = typeof VENDOR_STATUSES[number];

// Vendors table — businesses discovered via Facebook Graph API and/or Google Places API
export const vendors = sqliteTable('vendors', {
  id: text('id').primaryKey(),
  // Source IDs — nullable since a vendor may exist in only one source
  facebookPageId: text('facebookPageId').unique(),
  facebookPageUrl: text('facebookPageUrl'),
  instagramUrl: text('instagramUrl'),
  googlePlaceId: text('googlePlaceId').unique(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  rating: text('rating'), // stored as text e.g. "4.5"
  reviewCount: integer('reviewCount'),
  categories: text('categories'), // JSON: string[]
  hasWebsite: integer('hasWebsite', { mode: 'boolean' }).default(false).notNull(),
  websiteUrl: text('websiteUrl'),
  websiteQuality: text('websiteQuality'), // 'none' | 'poor' | 'basic' | 'good' | null
  email: text('email'), // from Facebook emails field, Custom Search, or manual entry
  coverPhotoUrl: text('coverPhotoUrl'), // direct image URL (Facebook cover or Google Places photo)
  topReviews: text('topReviews'), // JSON: { text, rating, authorName, publishTime }[]
  menuItems: text('menuItems'), // JSON: { name, description, price? }[] — inferred by Gemini
  recentPosts: text('recentPosts'), // JSON: { message, createdTime }[] — from Facebook page feed
  status: text('status').$type<VendorStatus>().default('candidate').notNull(),
  notes: text('notes'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Outreach email status
export const EMAIL_STATUSES = ['draft', 'sent', 'bounced'] as const;
export type EmailStatus = typeof EMAIL_STATUSES[number];

// Outreach emails table — log of drafted and sent emails
export const outreachEmails = sqliteTable('outreach_emails', {
  id: text('id').primaryKey(),
  vendorId: text('vendorId').notNull().references(() => vendors.id),
  subject: text('subject').notNull(),
  bodyHtml: text('bodyHtml').notNull(),
  status: text('status').$type<EmailStatus>().default('draft').notNull(),
  gmailMessageId: text('gmailMessageId'), // set after successful send
  sentAt: integer('sentAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Convenience types for use throughout the app
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
export type OutreachEmail = typeof outreachEmails.$inferSelect;
export type NewOutreachEmail = typeof outreachEmails.$inferInsert;
