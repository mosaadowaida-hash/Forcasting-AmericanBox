import { eq, and, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, scenarios } from "../drizzle/schema";
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
  
  // Delete user
  await db.delete(users).where(eq(users.id, userId));
}
