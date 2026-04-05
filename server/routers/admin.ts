import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb, getAllUsers, updateUserStatus, updateUserProfile, deleteUserAndData } from "../db";
import { users, products, scenarios } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ============================================================
  // USER MANAGEMENT
  // ============================================================

  // List all users
  listUsers: adminProcedure.query(async () => {
    const allUsers = await getAllUsers();
    // Don't expose password hashes
    return allUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      loginMethod: u.loginMethod,
      createdAt: u.createdAt,
      activatedAt: u.activatedAt,
      suspendedAt: u.suspendedAt,
      lastSignedIn: u.lastSignedIn,
    }));
  }),

  // Approve a pending user
  approveUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (user.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User is not in pending status" });
      }

      await updateUserStatus(input.userId, "active", { activatedAt: new Date() });
      return { success: true };
    }),

  // Reject a pending user (delete them)
  rejectUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (user.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only reject pending users" });
      }

      await deleteUserAndData(input.userId);
      return { success: true };
    }),

  // Suspend an active user
  suspendUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (user.role === "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot suspend admin accounts" });
      }

      await updateUserStatus(input.userId, "suspended", { suspendedAt: new Date() });
      return { success: true };
    }),

  // Reactivate a suspended user
  reactivateUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      await updateUserStatus(input.userId, "active", { suspendedAt: null });
      return { success: true };
    }),

  // Update user email and/or password
  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        password: z.string().min(8).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const updateData: { name?: string; email?: string; passwordHash?: string } = {};
      if (input.name) updateData.name = input.name;
      if (input.email) updateData.email = input.email;
      if (input.password) {
        updateData.passwordHash = await bcrypt.hash(input.password, 10);
      }

      if (Object.keys(updateData).length > 0) {
        await updateUserProfile(input.userId, updateData);
      }

      return { success: true };
    }),

  // Delete a user and all their data
  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (user.id === ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete your own account" });
      }
      if (user.role === "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete admin accounts" });
      }

      await deleteUserAndData(input.userId);
      return { success: true };
    }),

  // ============================================================
  // PRODUCT MANAGEMENT (Admin can see/manage all products)
  // ============================================================

  // List all products across all users
  listAllProducts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allProducts = await db.select().from(products).orderBy(asc(products.userId), asc(products.id));
    const allUsers = await getAllUsers();
    const userMap = new Map(allUsers.map(u => [u.id, { name: u.name, email: u.email }]));

    return allProducts.map(p => ({
      ...p,
      ownerName: userMap.get(p.userId)?.name ?? "Unknown",
      ownerEmail: userMap.get(p.userId)?.email ?? "Unknown",
    }));
  }),

  // Delete any product (admin only)
  deleteProduct: adminProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

      await db.delete(scenarios).where(eq(scenarios.productId, input.productId));
      await db.delete(products).where(eq(products.id, input.productId));

      return { success: true };
    }),

  // Get products for a specific user (admin view)
  getUserProducts: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(products).where(eq(products.userId, input.userId)).orderBy(asc(products.id));
    }),

  // Get scenarios for a specific product (admin view)
  getProductScenarios: adminProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(scenarios).where(eq(scenarios.productId, input.productId)).orderBy(asc(scenarios.id));
    }),

  // Get stats for all users (admin dashboard)
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const allUsers = await getAllUsers();
    const allProducts = await db.select().from(products);
    const allScenarios = await db.select().from(scenarios);

    const pendingUsers = allUsers.filter(u => u.status === "pending").length;
    const activeUsers = allUsers.filter(u => u.status === "active").length;
    const suspendedUsers = allUsers.filter(u => u.status === "suspended").length;

    return {
      totalUsers: allUsers.length,
      pendingUsers,
      activeUsers,
      suspendedUsers,
      totalProducts: allProducts.length,
      totalScenarios: allScenarios.length,
    };
  }),
});
