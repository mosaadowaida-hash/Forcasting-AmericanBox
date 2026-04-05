import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, double, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table - stores all products and bundles
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
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
