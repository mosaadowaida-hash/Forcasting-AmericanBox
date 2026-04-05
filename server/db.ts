import { eq, and, ne, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, scenarios, payments, InsertPayment } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    // For OAuth users, set status to active automatically
    if (!values.status) {
      values.status = 'active';
      updateSet.status = 'active';
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(users.createdAt);
}

export async function updateUserStatus(
  userId: number,
  status: 'pending' | 'active' | 'suspended',
  timestamps: { activatedAt?: Date; suspendedAt?: Date | null } = {}
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Record<string, unknown> = { status };
  if (timestamps.activatedAt !== undefined) updateData.activatedAt = timestamps.activatedAt;
  if (timestamps.suspendedAt !== undefined) updateData.suspendedAt = timestamps.suspendedAt;
  
  await db.update(users).set(updateData as any).where(eq(users.id, userId));
}

export async function updateUserProfile(
  userId: number,
  data: { name?: string; email?: string; passwordHash?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data as any).where(eq(users.id, userId));
}

export async function deleteUserAndData(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all products for this user
  const userProducts = await db.select({ id: products.id }).from(products).where(eq(products.userId, userId));
  
  // Delete scenarios for all user's products
  for (const product of userProducts) {
    await db.delete(scenarios).where(eq(scenarios.productId, product.id));
  }
  
  // Delete products
  await db.delete(products).where(eq(products.userId, userId));
  
  // Delete payments
  await db.delete(payments).where(eq(payments.userId, userId));
  
  // Delete user
  await db.delete(users).where(eq(users.id, userId));
}

// ============================================================
// PAYMENT HISTORY HELPERS
// ============================================================

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payments).values(data);
  const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
  return Number(insertId);
}

export async function getPaymentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(payments.createdAt);
}

export async function getPaymentById(paymentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  return result[0] ?? undefined;
}

export async function updatePaymentStatus(
  paymentId: number,
  status: 'pending' | 'verified' | 'rejected',
  reviewedBy: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(payments).set({
    paymentStatus: status,
    reviewedAt: new Date(),
    reviewedBy,
    notes: notes ?? null,
  }).where(eq(payments.id, paymentId));
}

export async function getAllPayments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments).orderBy(payments.createdAt);
}

// ============================================================
// SUBSCRIPTION HELPERS
// ============================================================

/**
 * Activate a user's subscription for 30 days from now.
 * Sets status=active, subscriptionStatus=active, subscriptionExpiresAt=now+30days
 */
export async function activateSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  await db.update(users).set({
    status: 'active',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: expiresAt,
    activatedAt: new Date(),
    suspendedAt: null,
  }).where(eq(users.id, userId));
  
  return expiresAt;
}

/**
 * Auto-suspend all users whose subscriptionExpiresAt < now and status=active
 * Returns list of suspended user IDs
 */
export async function autoSuspendExpiredSubscriptions(): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  // Find expired active users
  const expiredUsers = await db.select({ id: users.id }).from(users)
    .where(
      and(
        eq(users.status, 'active'),
        lt(users.subscriptionExpiresAt, now)
      )
    );
  
  if (expiredUsers.length === 0) return [];
  
  // Suspend them
  for (const user of expiredUsers) {
    await db.update(users).set({
      status: 'suspended',
      subscriptionStatus: 'expired',
      suspendedAt: now,
    }).where(eq(users.id, user.id));
  }
  
  return expiredUsers.map(u => u.id);
}

/**
 * Get subscription info for a user: days remaining, status
 */
export function getSubscriptionInfo(user: { subscriptionExpiresAt: Date | null; subscriptionStatus: string | null; status: string }) {
  const now = new Date();
  
  if (!user.subscriptionExpiresAt) {
    return { daysRemaining: null, isExpired: false, isExpiringSoon: false };
  }
  
  const msRemaining = user.subscriptionExpiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 2; // warn at 2 days
  
  return { daysRemaining, isExpired, isExpiringSoon };
}
