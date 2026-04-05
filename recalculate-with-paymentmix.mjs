/**
 * Recalculate all scenarios using the new Payment Mix delivery rate engine.
 * This script reads each product's paymentMix, calculates the weighted average
 * delivery rate, and regenerates all 144 scenarios with the correct cpaDelivered.
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// ============================================================
// CONSTANTS (must match server/routers/products.ts)
// ============================================================
const ACTUAL_MARGIN = 31.5;
const SHIPPING_THRESHOLD = 2600;
const SHIPPING_COST = 100;

const PAYMENT_DELIVERY_RATES = {
  cod: 0.65,
  instapay: 0.90,
  card: 0.92,
};
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

function round2(n) {
  return Math.round(n * 100) / 100;
}

function parsePaymentMix(raw) {
  if (!raw) return ["cod"];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return ["cod"];
}

function calcDeliveryRate(paymentMix) {
  if (!paymentMix || paymentMix.length === 0) return DEFAULT_DELIVERY_RATE;
  const total = paymentMix.reduce((sum, m) => sum + (PAYMENT_DELIVERY_RATES[m] ?? DEFAULT_DELIVERY_RATE), 0);
  return total / paymentMix.length;
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
          const aov = Math.round(price * basket);
          const revenuePerOrder = aov;
          const profit = Math.round(price * ACTUAL_MARGIN / 100 - cpaDashboard - shippingCost);
          const cogs = revenuePerOrder - cpaDelivered - profit;
          const breakEvenCpa = Math.round(price * ACTUAL_MARGIN / 100);
          const roas = round2(aov / cpaDashboard);
          const deliveredRoas = round2(aov / cpaDelivered);
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
  return results;
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to DB");

  // Get all products with their paymentMix
  const [allProducts] = await conn.query("SELECT * FROM products ORDER BY id");
  console.log(`Found ${allProducts.length} products to recalculate`);

  let totalScenarios = 0;
  let processed = 0;

  for (const product of allProducts) {
    // Delete existing scenarios for this product
    await conn.query("DELETE FROM scenarios WHERE productId = ?", [product.id]);

    // Generate new scenarios
    const scenarioData = generateScenarios(product);

    // Insert in batches of 50
    for (let i = 0; i < scenarioData.length; i += 50) {
      const batch = scenarioData.slice(i, i + 50);
      const values = batch.map(s => [
        s.productId, s.cpm, s.cpmLabel, s.ctr, s.ctrLabel, s.cvr, s.cvrLabel,
        s.basketSize, s.basketLabel, s.cpc, s.cpaDashboard, s.cpaDelivered,
        s.aov, s.revenuePerOrder, s.cogs, s.shipping, s.roas, s.deliveredRoas,
        s.breakEvenCpa, s.netProfitPerOrder, s.profitMargin, s.status
      ]);
      await conn.query(
        `INSERT INTO scenarios (productId, cpm, cpmLabel, ctr, ctrLabel, cvr, cvrLabel,
          basketSize, basketLabel, cpc, cpaDashboard, cpaDelivered,
          aov, revenuePerOrder, cogs, shipping, roas, deliveredRoas,
          breakEvenCpa, netProfitPerOrder, profitMargin, status)
         VALUES ?`,
        [values]
      );
    }

    totalScenarios += scenarioData.length;
    processed++;
    if (processed % 10 === 0) {
      console.log(`  Processed ${processed}/${allProducts.length} products...`);
    }
  }

  // Verify
  const [[{ count }]] = await conn.query("SELECT COUNT(*) as count FROM scenarios");
  console.log(`\n✅ Done! Recalculated ${totalScenarios} scenarios for ${processed} products`);
  console.log(`   DB now has ${count} total scenario rows`);

  await conn.end();
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
