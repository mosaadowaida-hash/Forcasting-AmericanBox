import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ============================================================
// MOCK SETUP
// ============================================================

// Mock the db module
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  getAllUsers: vi.fn(),
  updateUserStatus: vi.fn(),
  updateUserProfile: vi.fn(),
  deleteUserAndData: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

import * as db from "./db";

// Mock the sdk module (for session token creation)
vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
    verifySession: vi.fn(),
    authenticateRequest: vi.fn(),
  },
}));

// Mock storage for payment proof uploads
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/proof.jpg", key: "payment-proofs/test.jpg" }),
}));

// Mock drizzle insert/update/select
const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([{ insertId: 999 }]) });
const mockUpdateSet = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{}]) });
const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
const mockSelectFrom = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) });
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

vi.mocked(db.getDb).mockResolvedValue({
  insert: mockInsert,
  update: mockUpdate,
  select: mockSelect,
  delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
} as any);

// Shared mock context factories
const makePublicContext = (): TrpcContext => ({
  user: null,
  req: { protocol: "https", headers: {} } as any,
  res: {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as any,
});

const makeAdminContext = (): TrpcContext => ({
  user: {
    id: 1,
    openId: "local-admin",
    name: "Admin",
    email: "marketer.a.mosaad@gmail.com",
    passwordHash: null,
    loginMethod: "email",
    role: "admin",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    activatedAt: new Date(),
    suspendedAt: null,
  },
  req: { protocol: "https", headers: {} } as any,
  res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
});

const makeUserContext = (overrides: Partial<TrpcContext["user"]> = {}): TrpcContext => ({
  user: {
    id: 78,
    openId: "americanbox-local-user",
    name: "American Box",
    email: "americanbox149@gmail.com",
    passwordHash: null,
    loginMethod: "email",
    role: "user",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    activatedAt: new Date(),
    suspendedAt: null,
    ...overrides,
  } as any,
  req: { protocol: "https", headers: {} } as any,
  res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
});

// ============================================================
// AUTH SIGNUP TESTS
// ============================================================

describe("auth.signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject signup if email already exists", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce({
      id: 99,
      email: "existing@email.com",
      status: "active",
    } as any);

    const caller = appRouter.createCaller(makePublicContext());
    await expect(
      caller.auth.signup({ name: "Test", email: "existing@email.com", password: "password123" })
    ).rejects.toThrow("Email already registered");
  });

  it("should create a pending account on successful signup", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined);
    vi.mocked(db.getDb).mockResolvedValueOnce({
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue([{ insertId: 100 }]),
      }),
    } as any);

    const caller = appRouter.createCaller(makePublicContext());
    const result = await caller.auth.signup({
      name: "New User",
      email: "newuser@email.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    // New flow: message asks to complete payment (not admin approval directly)
    expect(result.message).toContain("payment");
    expect(result.userId).toBeDefined();
  });

  it("should reject signup with short password", async () => {
    const caller = appRouter.createCaller(makePublicContext());
    await expect(
      caller.auth.signup({ name: "Test", email: "test@email.com", password: "short" })
    ).rejects.toThrow();
  });
});

// ============================================================
// AUTH LOGIN TESTS
// ============================================================

describe("auth.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject login with non-existent email", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined);

    const caller = appRouter.createCaller(makePublicContext());
    await expect(
      caller.auth.login({ email: "notfound@email.com", password: "password123" })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should reject login with wrong password", async () => {
    const correctHash = await bcrypt.hash("correctPassword", 10);
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce({
      id: 1,
      email: "user@email.com",
      passwordHash: correctHash,
      status: "active",
      role: "user",
      name: "User",
      openId: "test-openid",
    } as any);

    const caller = appRouter.createCaller(makePublicContext());
    await expect(
      caller.auth.login({ email: "user@email.com", password: "wrongPassword" })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should allow login for pending user (shows payment/pending screen)", async () => {
    const hash = await bcrypt.hash("password123", 10);
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce({
      id: 2,
      email: "pending@email.com",
      passwordHash: hash,
      status: "pending",
      role: "user",
      name: "Pending User",
      openId: "pending-openid",
    } as any);

    // Mock db.update for lastSignedIn update
    vi.mocked(db.getDb).mockResolvedValueOnce({
      update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{}]) }) }),
    } as any);

    const caller = appRouter.createCaller(makePublicContext());
    // Pending users CAN log in now - they see the pending screen in the UI
    const result = await caller.auth.login({ email: "pending@email.com", password: "password123" });
    expect(result.success).toBe(true);
    expect(result.user.status).toBe("pending");
  });

  it("should reject login for suspended user", async () => {
    const hash = await bcrypt.hash("password123", 10);
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce({
      id: 3,
      email: "suspended@email.com",
      passwordHash: hash,
      status: "suspended",
      role: "user",
      name: "Suspended User",
      openId: "suspended-openid",
    } as any);

    const caller = appRouter.createCaller(makePublicContext());
    await expect(
      caller.auth.login({ email: "suspended@email.com", password: "password123" })
    ).rejects.toThrow("suspended");
  });

  it("should successfully login an active user and return session", async () => {
    const hash = await bcrypt.hash("password123", 10);
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce({
      id: 78,
      email: "americanbox149@gmail.com",
      passwordHash: hash,
      status: "active",
      role: "user",
      name: "American Box",
      openId: "americanbox-openid",
    } as any);

    vi.mocked(db.getDb).mockResolvedValueOnce({
      update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{}]) }) }),
    } as any);

    const caller = appRouter.createCaller(makePublicContext());
    const result = await caller.auth.login({ email: "americanbox149@gmail.com", password: "password123" });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("americanbox149@gmail.com");
    expect(result.user.role).toBe("user");
  });
});

// ============================================================
// ADMIN TESTS
// ============================================================

describe("admin.listUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all users for admin", async () => {
    vi.mocked(db.getAllUsers).mockResolvedValueOnce([
      { id: 1, name: "Admin", email: "admin@test.com", role: "admin", status: "active", createdAt: new Date(), activatedAt: new Date() } as any,
      { id: 2, name: "User", email: "user@test.com", role: "user", status: "active", createdAt: new Date(), activatedAt: new Date() } as any,
    ]);

    const caller = appRouter.createCaller(makeAdminContext());
    const result = await caller.admin.listUsers();

    expect(result).toHaveLength(2);
    expect(result[0].role).toBe("admin");
  });

  it("should reject non-admin access", async () => {
    const caller = appRouter.createCaller(makeUserContext());
    await expect(caller.admin.listUsers()).rejects.toThrow("Admin access required");
  });
});

describe("admin.approveUser", () => {
  it("should approve a pending user and set activatedAt", async () => {
    const pendingUser = {
      id: 5,
      name: "New User",
      email: "new@test.com",
      role: "user",
      status: "pending",
    };

    const mockWhere = vi.fn().mockResolvedValue([{}]);
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    const mockUpdateFn = vi.fn().mockReturnValue({ set: mockSet });

    vi.mocked(db.getDb).mockResolvedValueOnce({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([pendingUser]),
          }),
        }),
      }),
      update: mockUpdateFn,
    } as any);

    const caller = appRouter.createCaller(makeAdminContext());
    const result = await caller.admin.approveUser({ userId: 5 });

    expect(result.success).toBe(true);
    // Verify db.update was called (new implementation uses db.update directly)
    expect(mockUpdateFn).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
      status: "active",
      paymentStatus: "verified",
    }));
  });

  it("should reject approving a non-existent user", async () => {
    vi.mocked(db.getDb).mockResolvedValueOnce({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // no user found
          }),
        }),
      }),
    } as any);

    const caller = appRouter.createCaller(makeAdminContext());
    await expect(caller.admin.approveUser({ userId: 9999 })).rejects.toThrow("User not found");
  });
});

describe("admin.suspendUser", () => {
  it("should suspend an active user", async () => {
    const activeUser = { id: 78, role: "user", status: "active" };
    vi.mocked(db.updateUserStatus).mockResolvedValueOnce(undefined);

    vi.mocked(db.getDb).mockResolvedValueOnce({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([activeUser]),
          }),
        }),
      }),
    } as any);

    const caller = appRouter.createCaller(makeAdminContext());
    const result = await caller.admin.suspendUser({ userId: 78 });

    expect(result.success).toBe(true);
    expect(db.updateUserStatus).toHaveBeenCalledWith(78, "suspended", expect.objectContaining({ suspendedAt: expect.any(Date) }));
  });

  it("should reject suspending an admin user", async () => {
    const adminUser = { id: 1, role: "admin", status: "active" };

    vi.mocked(db.getDb).mockResolvedValueOnce({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([adminUser]),
          }),
        }),
      }),
    } as any);

    const caller = appRouter.createCaller(makeAdminContext());
    await expect(caller.admin.suspendUser({ userId: 1 })).rejects.toThrow("Cannot suspend admin");
  });
});

describe("admin.deleteUser", () => {
  it("should delete a non-admin user", async () => {
    const user = { id: 78, role: "user", status: "active" };
    vi.mocked(db.deleteUserAndData).mockResolvedValueOnce(undefined);

    vi.mocked(db.getDb).mockResolvedValueOnce({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([user]),
          }),
        }),
      }),
    } as any);

    const caller = appRouter.createCaller(makeAdminContext());
    const result = await caller.admin.deleteUser({ userId: 78 });

    expect(result.success).toBe(true);
    expect(db.deleteUserAndData).toHaveBeenCalledWith(78);
  });

  it("should reject deleting an admin user", async () => {
    const adminUser = { id: 2, role: "admin", status: "active" };

    vi.mocked(db.getDb).mockResolvedValueOnce({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([adminUser]),
          }),
        }),
      }),
    } as any);

    const caller = appRouter.createCaller(makeAdminContext());
    await expect(caller.admin.deleteUser({ userId: 2 })).rejects.toThrow("Cannot delete admin");
  });
});
