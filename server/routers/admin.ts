import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getDb, getAllUsers, updateUserStatus, updateUserProfile, deleteUserAndData,
  getPaymentsByUserId, updatePaymentStatus, getAllPayments,
  activateSubscription, getSubscriptionInfo,
} from "../db";
import { users, products, scenarios, payments } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "@shared/const";

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

  // List all users (including subscription info)
  listUsers: adminProcedure.query(async () => {
    const allUsers = await getAllUsers();
    return allUsers.map(u => {
      const subInfo = getSubscriptionInfo(u as any);
      return {
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
        // Subscription
        subscriptionExpiresAt: u.subscriptionExpiresAt,
        subscriptionStatus: u.subscriptionStatus,
        daysRemaining: subInfo.daysRemaining,
        isExpiringSoon: subInfo.isExpiringSoon,
        isExpired: subInfo.isExpired,
        // Legacy payment fields
        paymentMethod: u.paymentMethod,
        paymentProofImage: u.paymentProofImage,
        paymentStatus: u.paymentStatus,
        paymentSubmittedAt: u.paymentSubmittedAt,
      };
    });
  }),

  // Approve a user and activate their subscription for 30 days
  approveUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      // Activate subscription for 30 days
      const expiresAt = await activateSubscription(input.userId);

      // Also update legacy payment status
      await db.update(users).set({ paymentStatus: "verified" }).where(eq(users.id, input.userId));

      // Mark the latest pending payment as verified
      const userPayments = await getPaymentsByUserId(input.userId);
      const pendingPayment = userPayments.filter(p => p.paymentStatus === "pending").pop();
      if (pendingPayment) {
        await updatePaymentStatus(pendingPayment.id, "verified", 0); // 0 = system
      }

      return { success: true, subscriptionExpiresAt: expiresAt };
    }),

  // Verify a specific payment and activate subscription
  verifyPayment: adminProcedure
    .input(z.object({
      paymentId: z.number(),
      userId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Mark payment as verified
      await updatePaymentStatus(input.paymentId, "verified", ctx.user.id, input.notes);

      // Activate subscription for 30 days
      const expiresAt = await activateSubscription(input.userId);

      // Update legacy fields
      await db.update(users).set({ paymentStatus: "verified" }).where(eq(users.id, input.userId));

      return { success: true, subscriptionExpiresAt: expiresAt };
    }),

  // Reject a specific payment
  rejectPayment: adminProcedure
    .input(z.object({
      paymentId: z.number().optional(),
      userId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (input.paymentId) {
        await updatePaymentStatus(input.paymentId, "rejected", ctx.user.id, input.notes);
      }

      // Update legacy fields
      await db.update(users).set({ paymentStatus: "rejected" }).where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Get payment history for a specific user
  getUserPayments: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await getPaymentsByUserId(input.userId);
    }),

  // Get all payments across all users
  listAllPayments: adminProcedure.query(async () => {
    const allPayments = await getAllPayments();
    const allUsers = await getAllUsers();
    const userMap = new Map(allUsers.map(u => [u.id, { name: u.name, email: u.email }]));

    return allPayments.map(p => ({
      ...p,
      userName: userMap.get(p.userId)?.name ?? "Unknown",
      userEmail: userMap.get(p.userId)?.email ?? "Unknown",
    }));
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

  // Reactivate a suspended user (extends subscription by 30 days)
  reactivateUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const expiresAt = await activateSubscription(input.userId);
      return { success: true, subscriptionExpiresAt: expiresAt };
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
  // IMPERSONATION - Admin views dashboard as a specific user
  // ============================================================

  impersonateUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (user.role === "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot impersonate admin accounts" });
      }
      if (user.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only impersonate active users" });
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return { success: true, userName: user.name, userEmail: user.email };
    }),

  // ============================================================
  // PRODUCT MANAGEMENT
  // ============================================================

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

  getUserProducts: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(products).where(eq(products.userId, input.userId)).orderBy(asc(products.id));
    }),

  getProductScenarios: adminProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(scenarios).where(eq(scenarios.productId, input.productId)).orderBy(asc(scenarios.id));
    }),

  // Get stats for admin dashboard
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const allUsers = await getAllUsers();
    const allProducts = await db.select().from(products);
    const allScenarios = await db.select().from(scenarios);
    const allPaymentsData = await getAllPayments();

    const pendingUsers = allUsers.filter(u => u.status === "pending").length;
    const activeUsers = allUsers.filter(u => u.status === "active").length;
    const suspendedUsers = allUsers.filter(u => u.status === "suspended").length;
    const pendingPayments = allPaymentsData.filter(p => p.paymentStatus === "pending").length;

    // Users expiring soon (≤ 2 days)
    const expiringSoon = allUsers.filter(u => {
      const info = getSubscriptionInfo(u as any);
      return info.isExpiringSoon;
    }).length;

    return {
      totalUsers: allUsers.length,
      pendingUsers,
      activeUsers,
      suspendedUsers,
      pendingPayments,
      expiringSoon,
      totalProducts: allProducts.length,
      totalScenarios: allScenarios.length,
    };
  }),
});
