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

  it("should list all products from Supabase", async () => {
    caller = appRouter.createCaller(mockContext);
    const products = await caller.products.list();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty("id");
    expect(products[0]).toHaveProperty("name");
    expect(products[0]).toHaveProperty("original_price");
  });

  it("should get all scenarios", async () => {
    caller = appRouter.createCaller(mockContext);
    const scenarios = await caller.products.getAllScenarios();
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios[0]).toHaveProperty("product_id");
    expect(scenarios[0]).toHaveProperty("cpm");
    expect(scenarios[0]).toHaveProperty("roas");
  });

  it("should get scenarios for a specific product", async () => {
    caller = appRouter.createCaller(mockContext);
    const products = await caller.products.list();
    if (products.length === 0) {
      console.log("No products found, skipping test");
      return;
    }

    const productId = products[0].id;
    const scenarios = await caller.products.getScenarios(productId);
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBeGreaterThan(0);
    scenarios.forEach(s => {
      expect(s.product_id).toBe(productId);
    });
  });

  it("should calculate correct scenario metrics", async () => {
    caller = appRouter.createCaller(mockContext);
    const products = await caller.products.list();
    if (products.length === 0) {
      console.log("No products found, skipping test");
      return;
    }

    const scenarios = await caller.products.getScenarios(products[0].id);
    if (scenarios.length === 0) {
      console.log("No scenarios found, skipping test");
      return;
    }

    const scenario = scenarios[0];

    // Verify calculations
    expect(scenario.cpm).toBeGreaterThan(0);
    expect(scenario.ctr).toBeGreaterThan(0);
    expect(scenario.cvr).toBeGreaterThan(0);
    expect(scenario.basket_size).toBeGreaterThan(0);
    expect(scenario.aov).toBeGreaterThan(0);
    expect(scenario.cpa_dashboard).toBeGreaterThan(0);
    expect(scenario.cpa_delivered).toBeGreaterThan(0);
    expect(scenario.roas).toBeGreaterThan(0);

    // Verify ROAS calculation: revenue / cpa_dashboard
    const expectedRoas = Math.round((scenario.revenue_per_order / scenario.cpa_dashboard) * 100) / 100;
    expect(scenario.roas).toBe(expectedRoas);
  });

  it("should have 625 scenarios per product", async () => {
    caller = appRouter.createCaller(mockContext);
    const products = await caller.products.list();
    if (products.length === 0) {
      console.log("No products found, skipping test");
      return;
    }

    const scenarios = await caller.products.getScenarios(products[0].id);
    expect(scenarios.length).toBe(625); // 5 CPM * 5 CTR * 5 CVR * 5 Basket = 625
  });
});
