import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, double } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Supports both OAuth-based login and email/password login.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }), // null for OAuth users
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["pending", "active", "suspended"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  activatedAt: timestamp("activatedAt"),
  suspendedAt: timestamp("suspendedAt"),
  // Subscription fields
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"), // null = no active subscription
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "expired", "pending"]).default("pending"),
  // Legacy single payment fields (kept for backward compat, new payments go to payments table)
  paymentMethod: mysqlEnum("paymentMethod", ["instapay", "paypal"]),
  paymentProofImage: text("paymentProofImage"),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "verified", "rejected"]),
  paymentSubmittedAt: timestamp("paymentSubmittedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Payments table - stores full payment history per user (one row per payment attempt)
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["instapay", "paypal"]).notNull(),
  proofImageUrl: text("proofImageUrl"), // S3 URL for InstaPay proof image
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "verified", "rejected"]).default("pending").notNull(),
  paymentDate: timestamp("paymentDate").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"), // when admin approved/rejected
  reviewedBy: int("reviewedBy"), // admin user id
  notes: text("notes"), // optional admin notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Products table - stores all products and bundles
 * Each product belongs to a user (multi-tenant isolation)
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users.id
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["product", "bundle"]).default("product").notNull(),
  originalPrice: double("originalPrice").notNull(),
  discountTwoItems: double("discountTwoItems").default(10),
  discountThreeItems: double("discountThreeItems").default(15),
  bundleDiscount: double("bundleDiscount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Scenarios table - stores 144 calculated scenarios per product
 * 3 CPM × 4 CTR × 3 CVR × 4 Basket = 144 scenarios
 */
export const scenarios = mysqlTable("scenarios", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  cpm: double("cpm").notNull(),
  cpmLabel: varchar("cpmLabel", { length: 64 }).notNull(),
  ctr: double("ctr").notNull(),
  ctrLabel: varchar("ctrLabel", { length: 64 }).notNull(),
  cvr: double("cvr").notNull(),
  cvrLabel: varchar("cvrLabel", { length: 64 }).notNull(),
  basketSize: double("basketSize").notNull(),
  basketLabel: varchar("basketLabel", { length: 64 }).notNull(),
  cpc: double("cpc").notNull(),
  cpaDashboard: double("cpaDashboard").notNull(),
  cpaDelivered: double("cpaDelivered").notNull(),
  aov: double("aov").notNull(),
  revenuePerOrder: double("revenuePerOrder").notNull(),
  cogs: double("cogs").notNull(),
  shipping: double("shipping").notNull().default(30),
  roas: double("roas").notNull(),
  deliveredRoas: double("deliveredRoas").notNull(),
  breakEvenCpa: double("breakEvenCpa").notNull(),
  netProfitPerOrder: double("netProfitPerOrder").notNull(),
  profitMargin: double("profitMargin").notNull(),
  status: varchar("status", { length: 16 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;
