/**
 * Recalculate all scenarios using the FIXED Core Engine:
 * - profit = AOV × margin% - cpaDashboard - shipping  (was: price × margin% - ...)
 * - breakEvenCpa = AOV × margin%                       (was: price × margin%)
 */
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const ACTUAL_MARGIN = 31.5;
const SHIPPING_THRESHOLD = 2600;
const SHIPPING_COST = 100;

const PAYMENT_DELIVERY_RATES = { cod: 0.65, instapay: 0.90, card: 0.92 };
const DEFAULT_DELIVERY_RATE = 0.65;

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

function round2(n) { return Math.round(n * 100) / 100; }

function calcDeliveryRate(paymentMix) {
  if (!paymentMix || paymentMix.length === 0) return DEFAULT_DELIVERY_RATE;
  const total = paymentMix.reduce((s, m) => s + (PAYMENT_DELIVERY_RATES[m] ?? DEFAULT_DELIVERY_RATE), 0);
  return total / paymentMix.length;
}

function parsePaymentMix(raw) {
  if (!raw) return ["cod"];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p) && p.length > 0) return p;
  } catch {}
  return ["cod"];
}

function generateScenarios(product) {
  const results = [];
  const price = product.originalPrice;
  const paymentMix = parsePaymentMix(product.paymentMix);
  const deliveryRate = calcDeliveryRate(paymentMix);
  const shippingCost = (product.type === "product" && price <= SHIPPING_THRESHOLD) ? SHIPPING_COST : 0;

  for (const cpmLevel of CPM_LEVELS) {
    for (const ctrLevel of CTR_LEVELS) {
      for (const cvrLevel of CVR_LEVELS) {
        for (const basketLevel of BASKET_SIZES) {
          const cpm = cpmLevel.value;
          const ctr = ctrLevel.value;
          const cvr = cvrLevel.value;
          const basket = basketLevel.value;

          const cpc = round2(cpm / (ctr * 1000));
          const cpaDashboard = Math.round(cpc / cvr);
          const cpaDelivered = Math.round(cpaDashboard / deliveryRate);

          // FIXED: AOV = price × basket
          const aov = Math.round(price * basket);
          const revenuePerOrder = aov;

          // FIXED: grossMargin = AOV × margin% (not price × margin%)
          const grossMargin = Math.round(aov * ACTUAL_MARGIN / 100);
          const profit = Math.round(grossMargin - cpaDashboard - shippingCost);

          const cogs = revenuePerOrder - cpaDelivered - profit;

          // FIXED: breakEvenCpa = AOV × margin%
          const breakEvenCpa = Math.round(aov * ACTUAL_MARGIN / 100);

          const roas = round2(aov / cpaDashboard);
          const deliveredRoas = round2(aov / cpaDelivered);
          const profitMargin = round2(aov > 0 ? (profit / aov) * 100 : 0);
          const status = profit > 0 ? "ربح" : "خسارة";

          results.push({
            cpm: round2(cpm), cpmLabel: cpmLevel.label,
            ctr, ctrLabel: ctrLevel.label,
            cvr, cvrLabel: cvrLevel.label,
            basketSize: round2(basket), basketLabel: basketLevel.label,
            cpc, cpaDashboard, cpaDelivered,
            aov, revenuePerOrder, cogs,
            roas, deliveredRoas, breakEvenCpa,
            netProfitPerOrder: profit, profitMargin, status,
          });
        }
      }
    }
  }
  return results;
}

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [productRows] = await conn.execute("SELECT id, originalPrice, type, paymentMix FROM products");
  console.log(`Found ${productRows.length} products. Recalculating...`);

  let total = 0;
  for (const product of productRows) {
    const scenarios = generateScenarios(product);

    // Delete existing scenarios for this product
    await conn.execute("DELETE FROM scenarios WHERE productId = ?", [product.id]);

    // Batch insert new scenarios
    const BATCH = 50;
    for (let i = 0; i < scenarios.length; i += BATCH) {
      const batch = scenarios.slice(i, i + BATCH);
      const values = batch.map(s => [
        product.id, s.cpm, s.cpmLabel, s.ctr, s.ctrLabel, s.cvr, s.cvrLabel,
        s.basketSize, s.basketLabel, s.cpc, s.cpaDashboard, s.cpaDelivered,
        s.aov, s.revenuePerOrder, s.cogs, 0, s.roas, s.deliveredRoas,
        s.breakEvenCpa, s.netProfitPerOrder, s.profitMargin, s.status,
      ]);
      await conn.query(
        `INSERT INTO scenarios (
          productId, cpm, cpmLabel, ctr, ctrLabel, cvr, cvrLabel,
          basketSize, basketLabel, cpc, cpaDashboard, cpaDelivered,
          aov, revenuePerOrder, cogs, shipping, roas, deliveredRoas,
          breakEvenCpa, netProfitPerOrder, profitMargin, status
        ) VALUES ?`,
        [values]
      );
    }
    total += scenarios.length;
    process.stdout.write(`\r  Product ${product.id}: ${scenarios.length} scenarios recalculated (total: ${total})`);
  }

  console.log(`\n✅ Done! Recalculated ${total} scenarios for ${productRows.length} products.`);
} finally {
  await conn.end();
}
