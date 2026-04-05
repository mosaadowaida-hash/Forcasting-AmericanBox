import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb, getUserByEmail, getUserById } from "../db";
import { users } from "../../drizzle/schema";
import { sdk } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";

// Generate a unique openId for local (email/password) users
function generateLocalOpenId(email: string): string {
  return `local-${email.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
}

export const authRouter = router({
  // Get current user info
  me: publicProcedure.query(async (opts) => {
    return opts.ctx.user ?? null;
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

      // Check if email already exists
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create user with pending status
      const openId = generateLocalOpenId(input.email);
      await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email,
        passwordHash,
        loginMethod: "email",
        role: "user",
        status: "pending",
        lastSignedIn: new Date(),
      });

      return {
        success: true,
        message: "Account created successfully. Please wait for admin approval.",
      };
    }),

  // Login with email and password
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

      // Find user by email
      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Check password
      if (!user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This account uses a different login method",
        });
      }

      const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Check account status
      if (user.status === "pending") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account is pending admin approval. Please wait.",
        });
      }

      if (user.status === "suspended") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account has been suspended. Please contact the administrator.",
        });
      }

      // Update last signed in
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      // Create session token using the existing SDK
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
      });

      // Set session cookie
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
