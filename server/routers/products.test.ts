import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

const mockContext: TrpcContext = {
  user: null,
  req: {
    protocol: "https",
    headers: {},
  } as any,
  res: {} as any,
};

describe("Products Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  it("should list all 42 products from MySQL", async () => {
    caller = appRouter.createCaller(mockContext);
    const products = await caller.products.list();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(42);
    expect(products[0]).toHaveProperty("id");
    expect(products[0]).toHaveProperty("name");
    expect(products[0]).toHaveProperty("originalPrice");
  });

  it("should get all 6048 scenarios", async () => {
    caller = appRouter.createCaller(mockContext);
    const scenarios = await caller.products.getAllScenarios();
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBe(6048); // 42 products * 144 scenarios each
  });

  it("should get 144 scenarios for a specific product", async () => {
    caller = appRouter.createCaller(mockContext);
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
    caller = appRouter.createCaller(mockContext);
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
    caller = appRouter.createCaller(mockContext);
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
    caller = appRouter.createCaller(mockContext);

    const newProduct = await caller.products.create({
      name: "Test Vitest Product",
      type: "product",
      originalPrice: 3000,
      discount2: 10,
      discount3: 15,
    });

    expect(newProduct).toHaveProperty("id");
    expect(newProduct.name).toBe("Test Vitest Product");
    expect(newProduct.originalPrice).toBe(3000);

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
    caller = appRouter.createCaller(mockContext);

    // Create a test product
    const product = await caller.products.create({
      name: "Test Update Product",
      type: "product",
      originalPrice: 2000,
      discount2: 5,
      discount3: 10,
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
});
