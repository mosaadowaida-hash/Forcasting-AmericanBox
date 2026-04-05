import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { products, scenarios, Product, InsertScenario } from "../../drizzle/schema";
import { eq, asc, and } from "drizzle-orm";

// ============================================================
// CONSTANTS - Verified against original 6,048 scenarios
// ============================================================

// Actual margin = 31.5% (verified: all products)
const ACTUAL_MARGIN = 31.5;

// Shipping cost = 100 EGP for individual products with price ≤ 2600
const SHIPPING_THRESHOLD = 2600;
const SHIPPING_COST = 100;

// ============================================================
// PAYMENT MIX - Delivery Success Rates per method
// ============================================================

// Delivery success rate per payment method
// COD has the lowest rate (returns/cancellations), Card the highest
const PAYMENT_DELIVERY_RATES: Record<string, number> = {
  cod: 0.65,       // Cash on Delivery: 65% success
  instapay: 0.90,  // InstaPay / Wallet: 90% success
  card: 0.92,      // Card Payments: 92% success
};

const DEFAULT_DELIVERY_RATE = 0.65; // fallback = COD only

type PaymentMethod = "cod" | "instapay" | "card";

/**
 * Calculate weighted average delivery rate from a list of payment methods.
 * Equal weight per method (simple average).
 */
function calcDeliveryRate(paymentMix: PaymentMethod[]): number {
  if (!paymentMix || paymentMix.length === 0) return DEFAULT_DELIVERY_RATE;
  const total = paymentMix.reduce((sum, m) => sum + (PAYMENT_DELIVERY_RATES[m] ?? DEFAULT_DELIVERY_RATE), 0);
  return total / paymentMix.length;
}

/**
 * Parse paymentMix JSON string from DB into array.
 */
function parsePaymentMix(raw: string | null | undefined): PaymentMethod[] {
  if (!raw) return ["cod"];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as PaymentMethod[];
  } catch {}
  return ["cod"];
}

// ============================================================
// SCENARIO GRID
// ============================================================

// 3 CPM × 4 CTR × 3 CVR × 4 Basket = 144 scenarios
const CPM_LEVELS = [
  { value: 32.5, label: "Low CPM Cost" },
  { value: 47.5, label: "Medium CPM Cost" },
  { value: 70, label: "High CPM Cost" },
];

const CTR_LEVELS = [
  { value: 0.01, label: "Low CTR (1%)" },
  { value: 0.0125, label: "Good CTR (1.25%)" },
  { value: 0.015, label: "Very Good CTR (1.5%)" },
  { value: 0.0175, label: "Excellent CTR (1.75%)" },
];

const CVR_LEVELS = [
  { value: 0.005, label: "Low CVR (0.5%)" },
  { value: 0.01, label: "Good CVR (1%)" },
  { value: 0.015, label: "Excellent CVR (1.5%)" },
];

const BASKET_SIZES = [
  { value: 1.0, label: "Single Item (1.0)" },
  { value: 1.1, label: "Low Basket (1.1)" },
  { value: 1.2, label: "Fair Basket (1.2)" },
  { value: 1.3, label: "Healthy Basket (1.3)" },
];

// ============================================================
// CALCULATION ENGINE
// ============================================================

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Generate all 144 scenarios for a product.
 *
 * Key formulas:
 * - cpaDashboard = CPC / CVR  (based on ad spend, NOT delivery)
 * - deliveryRate = weighted avg of payment methods
 * - deliveredOrders = clicks × CVR × deliveryRate
 * - cpaDelivered = adSpend / deliveredOrders = cpaDashboard / deliveryRate
 * - AOV = price × basket_size
 * - profit = price × margin% - cpaDashboard - shipping
 */
function generateScenarios(product: Product): Omit<InsertScenario, "id">[] {
  const results: Omit<InsertScenario, "id">[] = [];
  const price = product.originalPrice;
  const paymentMix = parsePaymentMix((product as any).paymentMix);
  const deliveryRate = calcDeliveryRate(paymentMix);

  // Shipping: 100 EGP for individual products with price ≤ 2600
  const shippingCost = (product.type === "product" && price <= SHIPPING_THRESHOLD) ? SHIPPING_COST : 0;

  for (const cpmLevel of CPM_LEVELS) {
    for (const ctrLevel of CTR_LEVELS) {
      for (const cvrLevel of CVR_LEVELS) {
        for (const basketLevel of BASKET_SIZES) {
          const cpm = cpmLevel.value;
          const ctr = ctrLevel.value;
          const cvr = cvrLevel.value;
          const basket = basketLevel.value;

          // CPC = CPM / (CTR × 1000)
          const cpc = round2(cpm / (ctr * 1000));

          // CPA Dashboard = CPC / CVR  (ad-platform metric, NOT delivery-adjusted)
          const cpaDashboard = Math.round(cpc / cvr);

          // CPA Delivered = cpaDashboard / deliveryRate  (actual cost per delivered order)
          const cpaDelivered = Math.round(cpaDashboard / deliveryRate);

          // AOV = price × basket_size (no inflation)
          const aov = Math.round(price * basket);

          // Revenue per delivered order = AOV (full price, delivery already in cpaDelivered)
          const revenuePerOrder = aov;

          // Gross margin amount = AOV × margin%  (basket multiplies the revenue AND the margin)
          const grossMargin = Math.round(aov * ACTUAL_MARGIN / 100);

          // Profit = gross margin - cpaDashboard - shipping
          // Using cpaDashboard (not cpaDelivered) as the ad-cost metric, consistent with original logic
          const profit = Math.round(grossMargin - cpaDashboard - shippingCost);

          // COGS = revenue - cpaDelivered - profit
          const cogs = revenuePerOrder - cpaDelivered - profit;

          // Break-even CPA = AOV × margin%  (the max you can spend on ads and still break even)
          const breakEvenCpa = Math.round(aov * ACTUAL_MARGIN / 100);

          // ROAS = AOV / cpaDashboard
          const roas = round2(aov / cpaDashboard);

          // Delivered ROAS = AOV / cpaDelivered
          const deliveredRoas = round2(aov / cpaDelivered);

          // Profit margin = profit / AOV × 100
          const profitMargin = round2(aov > 0 ? (profit / aov) * 100 : 0);

          const status = profit > 0 ? "ربح" : "خسارة";

          results.push({
            productId: product.id,
            cpm: round2(cpm),
            cpmLabel: cpmLevel.label,
            ctr,
            ctrLabel: ctrLevel.label,
            cvr,
            cvrLabel: cvrLevel.label,
            basketSize: round2(basket),
            basketLabel: basketLevel.label,
            cpc,
            cpaDashboard,
            cpaDelivered,
            aov,
            revenuePerOrder,
            cogs,
            shipping: 0,
            roas,
            deliveredRoas,
            breakEvenCpa,
            netProfitPerOrder: profit,
            profitMargin,
            status,
          });
        }
      }
    }
  }

  return results; // Exactly 144
}

// Zod schema for payment mix
const paymentMixSchema = z.array(z.enum(["cod", "instapay", "card"])).min(1).default(["cod"]);

// ============================================================
// tRPC ROUTER - Multi-tenant: each user sees only their data
// ============================================================

export const productsRouter = router({
  // Get all products for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return await db.select().from(products)
      .where(eq(products.userId, ctx.user.id))
      .orderBy(asc(products.id));
  }),

  // Get product by ID (must belong to current user)
  getById: protectedProcedure.input(z.number()).query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(products)
      .where(and(eq(products.id, input), eq(products.userId, ctx.user.id)))
      .limit(1);
    return result[0] ?? null;
  }),

  // Get all scenarios for a product (must belong to current user)
  getScenarios: protectedProcedure.input(z.number()).query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return [];
    // Verify product belongs to user
    const product = await db.select().from(products)
      .where(and(eq(products.id, input), eq(products.userId, ctx.user.id)))
      .limit(1);
    if (!product[0]) return [];
    return await db.select().from(scenarios)
      .where(eq(scenarios.productId, input))
      .orderBy(asc(scenarios.id));
  }),

  // Get all scenarios across all user's products
  getAllScenarios: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const userProducts = await db.select({ id: products.id }).from(products)
      .where(eq(products.userId, ctx.user.id));
    if (userProducts.length === 0) return [];
    const productIds = userProducts.map(p => p.id);
    const allScenarios = await db.select().from(scenarios).orderBy(asc(scenarios.id));
    return allScenarios.filter(s => productIds.includes(s.productId));
  }),

  // Get overview stats for current user's products
  getOverviewStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const userProducts = await db.select().from(products).where(eq(products.userId, ctx.user.id));
    if (userProducts.length === 0) {
      return {
        totalProducts: 0,
        totalScenarios: 0,
        profitableScenarios: 0,
        profitabilityRate: 0,
        medianProfit: 0,
        avgRoas: 0,
      };
    }

    const productIds = userProducts.map(p => p.id);
    const allScenarios = await db.select().from(scenarios).orderBy(asc(scenarios.id));
    const userScenarios = allScenarios.filter(s => productIds.includes(s.productId));

    const totalProducts = userProducts.length;
    const totalScenarios = userScenarios.length;
    const profitableScenarios = userScenarios.filter(s => s.netProfitPerOrder > 0).length;
    const profitabilityRate = totalScenarios > 0 ? (profitableScenarios / totalScenarios) * 100 : 0;

    const profits = userScenarios.map(s => s.netProfitPerOrder).sort((a, b) => a - b);
    const medianProfit = profits.length > 0 ? profits[Math.floor(profits.length / 2)] : 0;

    const avgRoas = userScenarios.length > 0
      ? userScenarios.reduce((sum, s) => sum + s.roas, 0) / userScenarios.length
      : 0;

    return {
      totalProducts,
      totalScenarios,
      profitableScenarios,
      profitabilityRate: round2(profitabilityRate),
      medianProfit: round2(medianProfit),
      avgRoas: round2(avgRoas),
    };
  }),

  // Get ranking data for current user's products
  getRanking: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const userProducts = await db.select().from(products)
      .where(eq(products.userId, ctx.user.id))
      .orderBy(asc(products.id));
    if (userProducts.length === 0) return [];

    const productIds = userProducts.map(p => p.id);
    const allScenarios = await db.select().from(scenarios).orderBy(asc(scenarios.id));
    const userScenarios = allScenarios.filter(s => productIds.includes(s.productId));

    const scenariosByProduct = new Map<number, typeof userScenarios>();
    for (const s of userScenarios) {
      if (!scenariosByProduct.has(s.productId)) {
        scenariosByProduct.set(s.productId, []);
      }
      scenariosByProduct.get(s.productId)!.push(s);
    }

    return userProducts.map(product => {
      const productScenarios = scenariosByProduct.get(product.id) || [];
      const totalScenarios = productScenarios.length;
      const profitableScenarios = productScenarios.filter(s => s.netProfitPerOrder > 0).length;
      const profitabilityRate = totalScenarios > 0 ? (profitableScenarios / totalScenarios) * 100 : 0;

      const profits = productScenarios.map(s => s.netProfitPerOrder).sort((a, b) => a - b);
      const medianProfit = profits.length > 0 ? profits[Math.floor(profits.length / 2)] : 0;

      const roasValues = productScenarios.map(s => s.roas).sort((a, b) => a - b);
      const medianRoas = roasValues.length > 0 ? roasValues[Math.floor(roasValues.length / 2)] : 0;

      return {
        product,
        totalScenarios,
        profitableScenarios,
        profitabilityRate: round2(profitabilityRate),
        medianProfit: round2(medianProfit),
        medianRoas: round2(medianRoas),
      };
    }).sort((a, b) => b.profitabilityRate - a.profitabilityRate);
  }),

  // ============================================================
  // EXPORT PROCEDURES
  // ============================================================

  // Export all scenarios for the current user (all products)
  exportScenarios: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const userProducts = await db.select().from(products)
      .where(eq(products.userId, ctx.user.id))
      .orderBy(asc(products.id));
    if (userProducts.length === 0) return [];

    const productIds = userProducts.map(p => p.id);
    const productMap = new Map(userProducts.map(p => [p.id, p.name]));

    const allScenarios = await db.select().from(scenarios).orderBy(asc(scenarios.id));
    const userScenarios = allScenarios.filter(s => productIds.includes(s.productId));

    return userScenarios.map(s => ({
      productName: productMap.get(s.productId) ?? "Unknown",
      cpm: s.cpm,
      ctr: s.ctr,
      cvr: s.cvr,
      basketSize: s.basketSize,
      aov: s.aov,
      cpaDashboard: s.cpaDashboard,
      cpaDelivered: s.cpaDelivered,
      revenue: s.revenuePerOrder,
      profit: s.netProfitPerOrder,
      status: s.status,
      roas: s.roas,
    }));
  }),

  // Export filtered scenarios
  exportFilteredScenarios: protectedProcedure
    .input(z.object({
      productId: z.number().optional(),
      cpmMin: z.number().optional(),
      cpmMax: z.number().optional(),
      ctrMin: z.number().optional(),
      ctrMax: z.number().optional(),
      cvrMin: z.number().optional(),
      cvrMax: z.number().optional(),
      aovMin: z.number().optional(),
      aovMax: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const userProducts = await db.select().from(products)
        .where(eq(products.userId, ctx.user.id))
        .orderBy(asc(products.id));
      if (userProducts.length === 0) return [];

      const productIds = userProducts.map(p => p.id);
      const productMap = new Map(userProducts.map(p => [p.id, p.name]));

      const allScenarios = await db.select().from(scenarios).orderBy(asc(scenarios.id));
      let filtered = allScenarios.filter(s => productIds.includes(s.productId));

      // Apply filters
      if (input.productId) filtered = filtered.filter(s => s.productId === input.productId);
      if (input.cpmMin !== undefined) filtered = filtered.filter(s => s.cpm >= input.cpmMin!);
      if (input.cpmMax !== undefined) filtered = filtered.filter(s => s.cpm <= input.cpmMax!);
      if (input.ctrMin !== undefined) filtered = filtered.filter(s => s.ctr >= input.ctrMin!);
      if (input.ctrMax !== undefined) filtered = filtered.filter(s => s.ctr <= input.ctrMax!);
      if (input.cvrMin !== undefined) filtered = filtered.filter(s => s.cvr >= input.cvrMin!);
      if (input.cvrMax !== undefined) filtered = filtered.filter(s => s.cvr <= input.cvrMax!);
      if (input.aovMin !== undefined) filtered = filtered.filter(s => s.aov >= input.aovMin!);
      if (input.aovMax !== undefined) filtered = filtered.filter(s => s.aov <= input.aovMax!);

      return filtered.map(s => ({
        productName: productMap.get(s.productId) ?? "Unknown",
        cpm: s.cpm,
        ctr: s.ctr,
        cvr: s.cvr,
        basketSize: s.basketSize,
        aov: s.aov,
        cpaDashboard: s.cpaDashboard,
        cpaDelivered: s.cpaDelivered,
        revenue: s.revenuePerOrder,
        profit: s.netProfitPerOrder,
        status: s.status,
        roas: s.roas,
      }));
    }),

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  // Create a new product for current user and calculate 144 scenarios
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["product", "bundle"]),
        originalPrice: z.number().positive(),
        discountTwoItems: z.number().min(0).max(100).optional().default(10),
        discountThreeItems: z.number().min(0).max(100).optional().default(15),
        bundleDiscount: z.number().min(0).max(100).optional().default(0),
        paymentMix: paymentMixSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.insert(products).values({
        userId: ctx.user.id,
        name: input.name,
        type: input.type,
        originalPrice: input.originalPrice,
        discountTwoItems: input.discountTwoItems,
        discountThreeItems: input.discountThreeItems,
        bundleDiscount: input.bundleDiscount,
        paymentMix: JSON.stringify(input.paymentMix),
      });

      const productId = Number(result[0].insertId);
      const [createdProduct] = await db.select().from(products).where(eq(products.id, productId));

      // Generate 144 scenarios using payment mix
      const scenarioData = generateScenarios(createdProduct);
      for (let i = 0; i < scenarioData.length; i += 50) {
        const batch = scenarioData.slice(i, i + 50);
        await db.insert(scenarios).values(batch as InsertScenario[]);
      }

      return createdProduct;
    }),

  // Update product (must belong to current user) and recalculate 144 scenarios
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        type: z.enum(["product", "bundle"]).optional(),
        originalPrice: z.number().positive().optional(),
        discountTwoItems: z.number().min(0).max(100).optional(),
        discountThreeItems: z.number().min(0).max(100).optional(),
        bundleDiscount: z.number().min(0).max(100).optional(),
        paymentMix: paymentMixSchema.optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updates } = input;

      // Verify ownership
      const [existing] = await db.select().from(products)
        .where(and(eq(products.id, id), eq(products.userId, ctx.user.id)))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

      // Build update object
      const updateObj: Record<string, any> = {};
      if (updates.name !== undefined) updateObj.name = updates.name;
      if (updates.type !== undefined) updateObj.type = updates.type;
      if (updates.originalPrice !== undefined) updateObj.originalPrice = updates.originalPrice;
      if (updates.discountTwoItems !== undefined) updateObj.discountTwoItems = updates.discountTwoItems;
      if (updates.discountThreeItems !== undefined) updateObj.discountThreeItems = updates.discountThreeItems;
      if (updates.bundleDiscount !== undefined) updateObj.bundleDiscount = updates.bundleDiscount;
      if (updates.paymentMix !== undefined) updateObj.paymentMix = JSON.stringify(updates.paymentMix);

      if (Object.keys(updateObj).length > 0) {
        await db.update(products).set(updateObj).where(eq(products.id, id));
      }

      const [updatedProduct] = await db.select().from(products).where(eq(products.id, id));

      // Delete old scenarios and regenerate with new payment mix
      await db.delete(scenarios).where(eq(scenarios.productId, id));
      const scenarioData = generateScenarios(updatedProduct);
      for (let i = 0; i < scenarioData.length; i += 50) {
        const batch = scenarioData.slice(i, i + 50);
        await db.insert(scenarios).values(batch as InsertScenario[]);
      }

      return updatedProduct;
    }),

  // Delete product (must belong to current user) and its scenarios
  delete: protectedProcedure.input(z.number()).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Verify ownership
    const [existing] = await db.select().from(products)
      .where(and(eq(products.id, input), eq(products.userId, ctx.user.id)))
      .limit(1);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

    await db.delete(scenarios).where(eq(scenarios.productId, input));
    await db.delete(products).where(eq(products.id, input));

    return { success: true };
  }),
});
