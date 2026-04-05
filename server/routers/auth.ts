import z from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  getDb, getUserByEmail, getUserById,
  createPayment, getPaymentsByUserId,
  getSubscriptionInfo, autoSuspendExpiredSubscriptions,
} from "../db";
import { users } from "../../drizzle/schema";
import { sdk } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import { eq } from "drizzle-orm";
import { storagePut } from "../storage";

// Generate a unique openId for local (email/password) users
function generateLocalOpenId(email: string): string {
  return `local-${email.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
}

export const authRouter = router({
  // Get current user info (includes subscription info)
  me: publicProcedure.query(async (opts) => {
    if (!opts.ctx.user) return null;
    const user = opts.ctx.user;
    const subInfo = getSubscriptionInfo(user as any);
    return {
      ...user,
      daysRemaining: subInfo.daysRemaining,
      isExpiringSoon: subInfo.isExpiringSoon,
      isExpired: subInfo.isExpired,
    };
  }),

  // Sign up with email and password
  signup: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const openId = generateLocalOpenId(input.email);
      const result = await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email,
        passwordHash,
        loginMethod: "email",
        role: "user",
        status: "pending",
        subscriptionStatus: "pending",
        lastSignedIn: new Date(),
      });

      const userId = (result as any).insertId ?? (result as any)[0]?.insertId;

      return {
        success: true,
        userId: Number(userId),
        message: "Account created. Please complete payment to activate your account.",
      };
    }),

  // Submit payment info (creates a record in payments table)
  submitPayment: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        paymentMethod: z.enum(["instapay", "paypal"]),
        proofImageBase64: z.string().optional(),
        proofImageMimeType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      let proofImageUrl: string | undefined;

      // Upload proof image to S3 for instapay
      if (input.paymentMethod === "instapay" && input.proofImageBase64) {
        const mimeType = input.proofImageMimeType || "image/jpeg";
        const ext = mimeType.split("/")[1] || "jpg";
        const buffer = Buffer.from(input.proofImageBase64, "base64");
        const key = `payment-proofs/${user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, mimeType);
        proofImageUrl = url;
      }

      // Create a new payment record in the payments table
      const paymentId = await createPayment({
        userId: user.id,
        paymentMethod: input.paymentMethod,
        proofImageUrl: proofImageUrl ?? null,
        paymentStatus: "pending",
        paymentDate: new Date(),
      });

      // Also update legacy fields on users table for backward compat
      await db.update(users).set({
        paymentMethod: input.paymentMethod,
        paymentProofImage: proofImageUrl ?? null,
        paymentStatus: "pending",
        paymentSubmittedAt: new Date(),
      }).where(eq(users.id, input.userId));

      return {
        success: true,
        paymentId,
        message: "Payment submitted. Your account is under review and will be activated soon.",
      };
    }),

  // Get own payment history
  myPayments: protectedProcedure.query(async ({ ctx }) => {
    return await getPaymentsByUserId(ctx.user.id);
  }),

  // Login with email and password (subscription-aware)
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Run auto-suspend check on each login
      await autoSuspendExpiredSubscriptions();

      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      if (!user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "This account uses a different login method" });
      }

      const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      // Check subscription expiry for active users
      const subInfo = getSubscriptionInfo(user as any);
      if (user.status === "active" && subInfo.isExpired) {
        // Auto-suspend this user
        await db.update(users).set({
          status: "suspended",
          subscriptionStatus: "expired",
          suspendedAt: new Date(),
        }).where(eq(users.id, user.id));

        throw new TRPCError({
          code: "FORBIDDEN",
          message: "SUBSCRIPTION_EXPIRED",
        });
      }

      // Suspended users get a special message
      if (user.status === "suspended") {
        const isExpired = user.subscriptionStatus === "expired";
        throw new TRPCError({
          code: "FORBIDDEN",
          message: isExpired ? "SUBSCRIPTION_EXPIRED" : "ACCOUNT_SUSPENDED",
        });
      }

      // Update last signed in
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          paymentStatus: user.paymentStatus,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          daysRemaining: subInfo.daysRemaining,
          isExpiringSoon: subInfo.isExpiringSoon,
        },
      };
    }),

  // Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  // Change own password (authenticated)
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const user = await getUserById(ctx.user.id);
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Password change not available for this account" });
      }

      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      }

      const newHash = await bcrypt.hash(input.newPassword, 10);
      await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, ctx.user.id));

      return { success: true };
    }),
});
