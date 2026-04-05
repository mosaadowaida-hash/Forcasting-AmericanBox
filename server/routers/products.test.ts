import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock user context - American Box user (id=78) who owns the 42 products
const mockUserContext: TrpcContext = {
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
  },
  req: {
    protocol: "https",
    headers: {},
  } as any,
  res: {} as any,
};

// Admin user context
const mockAdminContext: TrpcContext = {
  user: {
    id: 1,
    openId: "local-marketer.a.mosaad@gmail.com",
    name: "Ahmed Mosaad",
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
  req: {
    protocol: "https",
    headers: {},
  } as any,
  res: {} as any,
};

// Unauthenticated context
const mockPublicContext: TrpcContext = {
  user: null,
  req: {
    protocol: "https",
    headers: {},
  } as any,
  res: {} as any,
};

describe("Products Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  it("should list all 42 products for American Box user", async () => {
    caller = appRouter.createCaller(mockUserContext);
    const products = await caller.products.list();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(42);
    expect(products[0]).toHaveProperty("id");
    expect(products[0]).toHaveProperty("name");
    expect(products[0]).toHaveProperty("originalPrice");
    // All products should belong to user 78
    expect(products.every(p => p.userId === 78)).toBe(true);
  });

  it("should get all 6048 scenarios for American Box user", async () => {
    caller = appRouter.createCaller(mockUserContext);
    const scenarios = await caller.products.getAllScenarios();
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBe(6048); // 42 products * 144 scenarios each
  });

  it("should get 144 scenarios for a specific product", async () => {
    caller = appRouter.createCaller(mockUserContext);
    const products = await caller.products.list();
    expect(products.length).toBeGreaterThan(0);

    const productId = products[0].id;
    const scenarios = await caller.products.getScenarios(productId);
    expect(scenarios.length).toBe(144); // 3 CPM * 4 CTR * 3 CVR * 4 Basket = 144
    scenarios.forEach(s => {
      expect(s.productId).toBe(productId);
    });
  });

  it("should have correct CPM/CTR/CVR/Basket combinations", async () => {
    caller = appRouter.createCaller(mockUserContext);
    const products = await caller.products.list();
    const scenarios = await caller.products.getScenarios(products[0].id);

    // Extract unique values
    const cpms = [...new Set(scenarios.map(s => s.cpm))].sort((a, b) => a - b);
    const ctrs = [...new Set(scenarios.map(s => s.ctr))].sort((a, b) => a - b);
    const cvrs = [...new Set(scenarios.map(s => s.cvr))].sort((a, b) => a - b);
    const baskets = [...new Set(scenarios.map(s => s.basketSize))].sort((a, b) => a - b);

    // Verify the exact parameter ranges
    expect(cpms).toEqual([32.5, 47.5, 70]);
    expect(ctrs).toEqual([0.01, 0.0125, 0.015, 0.0175]);
    expect(cvrs).toEqual([0.005, 0.01, 0.015]);
    expect(baskets).toEqual([1, 1.1, 1.2, 1.3]);

    // 3 * 4 * 3 * 4 = 144
    expect(cpms.length * ctrs.length * cvrs.length * baskets.length).toBe(144);
  });

  it("should have correct scenario fields with proper values", async () => {
    caller = appRouter.createCaller(mockUserContext);
    const products = await caller.products.list();
    const scenarios = await caller.products.getScenarios(products[0].id);
    const scenario = scenarios[0];

    // Verify all required fields exist
    expect(scenario).toHaveProperty("cpm");
    expect(scenario).toHaveProperty("ctr");
    expect(scenario).toHaveProperty("cvr");
    expect(scenario).toHaveProperty("basketSize");
    expect(scenario).toHaveProperty("aov");
    expect(scenario).toHaveProperty("cpaDashboard");
    expect(scenario).toHaveProperty("cpaDelivered");
    expect(scenario).toHaveProperty("revenuePerOrder");
    expect(scenario).toHaveProperty("netProfitPerOrder");
    expect(scenario).toHaveProperty("roas");
    expect(scenario).toHaveProperty("status");

    // Verify numeric values are reasonable
    expect(scenario.cpm).toBeGreaterThan(0);
    expect(scenario.ctr).toBeGreaterThan(0);
    expect(scenario.cvr).toBeGreaterThan(0);
    expect(scenario.aov).toBeGreaterThan(0);
    expect(scenario.cpaDashboard).toBeGreaterThan(0);
    expect(scenario.cpaDelivered).toBeGreaterThan(0);
    expect(scenario.roas).toBeGreaterThan(0);

    // Verify status is either "ربح" or "خسارة"
    expect(["ربح", "خسارة"]).toContain(scenario.status);

    // Verify additional fields
    expect(scenario).toHaveProperty("breakEvenCpa");
    expect(scenario).toHaveProperty("cogs");
    expect(scenario).toHaveProperty("profitMargin");
    expect(scenario).toHaveProperty("deliveredRoas");
  });

  it("should add a new product with 144 calculated scenarios", async () => {
    caller = appRouter.createCaller(mockUserContext);

    const newProduct = await caller.products.create({
      name: "Test Vitest Product",
      type: "product",
      originalPrice: 3000,
    });

    expect(newProduct).toHaveProperty("id");
    expect(newProduct.name).toBe("Test Vitest Product");
    expect(newProduct.originalPrice).toBe(3000);
    expect(newProduct.userId).toBe(78); // Should belong to American Box

    // Verify 144 scenarios were created
    const scenarios = await caller.products.getScenarios(newProduct.id);
    expect(scenarios.length).toBe(144);

    // Verify scenarios have correct CPM/CTR/CVR/Basket ranges
    const cpms = [...new Set(scenarios.map(s => s.cpm))].sort((a, b) => a - b);
    expect(cpms).toEqual([32.5, 47.5, 70]);

    // Clean up - delete the test product
    await caller.products.delete(newProduct.id);

    // Verify deletion
    const productsAfter = await caller.products.list();
    expect(productsAfter.find(p => p.id === newProduct.id)).toBeUndefined();
  });

  it("should update a product and recalculate scenarios", async () => {
    caller = appRouter.createCaller(mockUserContext);

    // Create a test product
    const product = await caller.products.create({
      name: "Test Update Product",
      type: "product",
      originalPrice: 2000,
    });

    // Get original scenarios
    const originalScenarios = await caller.products.getScenarios(product.id);
    expect(originalScenarios.length).toBe(144);

    // Update the price
    const updated = await caller.products.update({
      id: product.id,
      originalPrice: 4000,
    });
    expect(updated.originalPrice).toBe(4000);

    // Get updated scenarios
    const updatedScenarios = await caller.products.getScenarios(product.id);
    expect(updatedScenarios.length).toBe(144);

    // Verify scenarios changed (higher price = different AOV/revenue)
    const origAov = originalScenarios[0].aov;
    const updatedAov = updatedScenarios[0].aov;
    expect(updatedAov).not.toBe(origAov);
    expect(updatedAov).toBeGreaterThan(origAov); // Higher price = higher AOV

    // Clean up
    await caller.products.delete(product.id);
  });

  it("should create product with paymentMix and verify CPA Delivered changes", async () => {
    caller = appRouter.createCaller(mockUserContext);

    // Create product with COD only (65% delivery rate)
    const codProduct = await caller.products.create({
      name: "Test COD Product",
      type: "product",
      originalPrice: 3000,
      paymentMix: ["cod"],
    });
    const codScenarios = await caller.products.getScenarios(codProduct.id);
    const codCpaDelivered = codScenarios[0].cpaDelivered;

    // Create product with Card only (92% delivery rate)
    const cardProduct = await caller.products.create({
      name: "Test Card Product",
      type: "product",
      originalPrice: 3000,
      paymentMix: ["card"],
    });
    const cardScenarios = await caller.products.getScenarios(cardProduct.id);
    const cardCpaDelivered = cardScenarios[0].cpaDelivered;

    // COD has lower delivery rate → higher CPA Delivered (same CPA Dashboard)
    expect(codCpaDelivered).toBeGreaterThan(cardCpaDelivered);
    // CPA Dashboard should be the same (not affected by payment mix)
    expect(codScenarios[0].cpaDashboard).toBeCloseTo(cardScenarios[0].cpaDashboard, 2);

    // Clean up
    await caller.products.delete(codProduct.id);
    await caller.products.delete(cardProduct.id);
  });

  it("should export all scenarios for user", async () => {
    caller = appRouter.createCaller(mockUserContext);
    const exported = await caller.products.exportScenarios();
    expect(Array.isArray(exported)).toBe(true);
    expect(exported.length).toBe(6048); // 42 products * 144 scenarios
    // Verify export fields
    const row = exported[0];
    expect(row).toHaveProperty("productName");
    expect(row).toHaveProperty("cpm");
    expect(row).toHaveProperty("ctr");
    expect(row).toHaveProperty("cvr");
    expect(row).toHaveProperty("aov");
    expect(row).toHaveProperty("cpaDashboard");
    expect(row).toHaveProperty("cpaDelivered");
    expect(row).toHaveProperty("revenue");
    expect(row).toHaveProperty("profit");
    expect(row).toHaveProperty("roas");
    expect(row).toHaveProperty("status");
  });

  it("should export filtered scenarios", async () => {
    caller = appRouter.createCaller(mockUserContext);
    const products = await caller.products.list();
    const firstProductId = products[0].id;

    // Filter by product ID
    const filtered = await caller.products.exportFilteredScenarios({ productId: firstProductId });
    expect(Array.isArray(filtered)).toBe(true);
    expect(filtered.length).toBe(144); // Only 1 product's scenarios
    expect(filtered.every(s => s.productName === products[0].name)).toBe(true);

    // Filter by CPM range
    const cpmFiltered = await caller.products.exportFilteredScenarios({ cpmMin: 40, cpmMax: 60 });
    expect(cpmFiltered.every(s => s.cpm >= 40 && s.cpm <= 60)).toBe(true);
  });

  it("should return paymentMix in getById", async () => {
    caller = appRouter.createCaller(mockUserContext);
    const products = await caller.products.list();
    const productId = products[0].id;
    const product = await caller.products.getById(productId);
    expect(product).not.toBeNull();
    expect(product).toHaveProperty("paymentMix");
    // paymentMix should be a JSON string containing an array
    const mix = JSON.parse(product!.paymentMix ?? '["cod"]');
    expect(Array.isArray(mix)).toBe(true);
    expect(mix.length).toBeGreaterThan(0);
    expect(["cod", "instapay", "card"]).toEqual(expect.arrayContaining(mix));
  });

  it("should reject empty paymentMix array on create", async () => {
    caller = appRouter.createCaller(mockUserContext);
    // Empty array should fail Zod validation (min(1))
    await expect(
      caller.products.create({
        name: "Test Empty PaymentMix",
        type: "product",
        originalPrice: 1000,
        paymentMix: [] as any,
      })
    ).rejects.toThrow();
  });

  it("should reject invalid paymentMix method on create", async () => {
    caller = appRouter.createCaller(mockUserContext);
    // Invalid method should fail Zod enum validation
    await expect(
      caller.products.create({
        name: "Test Invalid PaymentMix",
        type: "product",
        originalPrice: 1000,
        paymentMix: ["cash"] as any,
      })
    ).rejects.toThrow();
  });

  it("should use per-product marginPercent in profit, COGS, and break-even calculations", async () => {
    caller = appRouter.createCaller(mockUserContext);

    // Create product with 40% margin
    const highMarginProduct = await caller.products.create({
      name: "Test High Margin 40%",
      type: "product",
      originalPrice: 2000,
      marginPercent: 40,
      paymentMix: ["cod"],
    });
    const highScenarios = await caller.products.getScenarios(highMarginProduct.id);

    // Create product with 20% margin (same price)
    const lowMarginProduct = await caller.products.create({
      name: "Test Low Margin 20%",
      type: "product",
      originalPrice: 2000,
      marginPercent: 20,
      paymentMix: ["cod"],
    });
    const lowScenarios = await caller.products.getScenarios(lowMarginProduct.id);

    // Same CPM/CTR/CVR/Basket scenario (first one)
    const highS = highScenarios[0];
    const lowS = lowScenarios[0];

    // Both have same AOV (same price + basket)
    expect(highS.aov).toBe(lowS.aov);

    // Higher margin = higher profit
    expect(highS.netProfitPerOrder).toBeGreaterThan(lowS.netProfitPerOrder);

    // COGS should be correct: AOV × (1 - margin%)
    const expectedHighCogs = Math.round(highS.aov * (1 - 40 / 100));
    const expectedLowCogs = Math.round(lowS.aov * (1 - 20 / 100));
    expect(highS.cogs).toBe(expectedHighCogs);
    expect(lowS.cogs).toBe(expectedLowCogs);

    // Higher margin = lower COGS
    expect(highS.cogs).toBeLessThan(lowS.cogs);

    // Break-even CPA = gross_margin - shipping
    // price=2000, type=product, price <= 2600 → shipping=100
    const highGrossMargin = Math.round(highS.aov * 40 / 100);
    const lowGrossMargin = Math.round(lowS.aov * 20 / 100);
    expect(highS.breakEvenCpa).toBe(highGrossMargin - 100);
    expect(lowS.breakEvenCpa).toBe(lowGrossMargin - 100);

    // Shipping column should store actual shipping cost (100 for product ≤ 2600)
    expect(highS.shipping).toBe(100);
    expect(lowS.shipping).toBe(100);

    // Clean up
    await caller.products.delete(highMarginProduct.id);
    await caller.products.delete(lowMarginProduct.id);
  });

  it("should store shipping=0 for bundles and products with price > 2600", async () => {
    caller = appRouter.createCaller(mockUserContext);

    // Bundle (no shipping)
    const bundleProduct = await caller.products.create({
      name: "Test Bundle No Shipping",
      type: "bundle",
      originalPrice: 1500,
      marginPercent: 30,
      paymentMix: ["cod"],
    });
    const bundleScenarios = await caller.products.getScenarios(bundleProduct.id);
    expect(bundleScenarios[0].shipping).toBe(0);

    // Product with price > 2600 (no shipping)
    const expensiveProduct = await caller.products.create({
      name: "Test Expensive No Shipping",
      type: "product",
      originalPrice: 3000,
      marginPercent: 30,
      paymentMix: ["cod"],
    });
    const expensiveScenarios = await caller.products.getScenarios(expensiveProduct.id);
    expect(expensiveScenarios[0].shipping).toBe(0);

    // Product with price ≤ 2600 (shipping = 100)
    const cheapProduct = await caller.products.create({
      name: "Test Cheap With Shipping",
      type: "product",
      originalPrice: 1200,
      marginPercent: 30,
      paymentMix: ["cod"],
    });
    const cheapScenarios = await caller.products.getScenarios(cheapProduct.id);
    expect(cheapScenarios[0].shipping).toBe(100);

    // Clean up
    await caller.products.delete(bundleProduct.id);
    await caller.products.delete(expensiveProduct.id);
    await caller.products.delete(cheapProduct.id);
  }, 20000); // 20s timeout - creates 3 products × 144 scenarios each

  it("should reject unauthenticated access to protected routes", async () => {
    const publicCaller = appRouter.createCaller(mockPublicContext);
    await expect(publicCaller.products.list()).rejects.toThrow();
  });

  it("should not allow user to access other user's products", async () => {
    // Admin user (id=1) has no products, so should get empty list
    const adminCaller = appRouter.createCaller(mockAdminContext);
    const adminProducts = await adminCaller.products.list();
    expect(adminProducts.length).toBe(0);
  });
});
