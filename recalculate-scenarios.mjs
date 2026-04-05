/**
 * Recalculate all scenarios with the fixed AOV formula:
 * AOV = price × basket_size (no AOV_RATIO inflation)
 */
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
config();

const DELIVERY_RATE = 0.885;
const CPA_DELIVERY_FACTOR = 1.13;
const ACTUAL_MARGIN = 31.5;
const SHIPPING_THRESHOLD = 2600;
const SHIPPING_COST = 100;

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

function generateScenarios(product) {
  const results = [];
  const price = product.originalPrice;
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
          const cpaDelivered = Math.round(cpaDashboard * CPA_DELIVERY_FACTOR);
          // FIXED: AOV = price × basket_size (no inflation)
          const aov = Math.round(price * basket);
          const revenuePerOrder = Math.round(aov * DELIVERY_RATE);
          const profit = Math.round(price * ACTUAL_MARGIN / 100 - cpaDashboard - shippingCost);
          const cogs = revenuePerOrder - cpaDelivered - profit;
          const breakEvenCpa = Math.round(price * ACTUAL_MARGIN / 100);
          const roas = round2(aov / cpaDashboard);
          const deliveredRoas = round2(aov / cpaDelivered);
          const profitMargin = round2(aov > 0 ? (profit / aov) * 100 : 0);
          const status = profit > 0 ? "ربح" : "خسارة";

          results.push([
            product.id, round2(cpm), cpmLevel.label,
            ctr, ctrLevel.label, cvr, cvrLevel.label,
            round2(basket), basketLevel.label,
            cpc, cpaDashboard, cpaDelivered, aov, revenuePerOrder,
            cogs, 0, roas, deliveredRoas, breakEvenCpa, profit, profitMargin, status
          ]);
        }
      }
    }
  }
  return results;
}

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  // Get all products
  const [allProducts] = await conn.execute("SELECT * FROM products");
  console.log(`Found ${allProducts.length} products to recalculate`);

  // Delete ALL existing scenarios at once
  await conn.execute("DELETE FROM scenarios");
  console.log("Deleted all existing scenarios");

  // Build one massive batch insert
  const allRows = [];
  for (const product of allProducts) {
    const rows = generateScenarios(product);
    allRows.push(...rows);
  }

  console.log(`Inserting ${allRows.length} scenarios in batch...`);
  
  // Insert in chunks of 500
  const CHUNK_SIZE = 500;
  for (let i = 0; i < allRows.length; i += CHUNK_SIZE) {
    const chunk = allRows.slice(i, i + CHUNK_SIZE);
    const placeholders = chunk.map(() => "(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").join(",");
    const values = chunk.flat();
    await conn.execute(
      `INSERT INTO scenarios (productId, cpm, cpmLabel, ctr, ctrLabel, cvr, cvrLabel, basketSize, basketLabel, cpc, cpaDashboard, cpaDelivered, aov, revenuePerOrder, cogs, shipping, roas, deliveredRoas, breakEvenCpa, netProfitPerOrder, profitMargin, status)
       VALUES ${placeholders}`,
      values
    );
    process.stdout.write(`  Inserted ${Math.min(i + CHUNK_SIZE, allRows.length)}/${allRows.length}\r`);
  }

  console.log(`\n✅ Done! Recalculated ${allRows.length} scenarios for ${allProducts.length} products`);
  
  // Verify: check AOV for a product with basket=1.0
  const [check] = await conn.execute(
    "SELECT p.name, p.originalPrice, s.basketSize, s.aov FROM scenarios s JOIN products p ON s.productId = p.id WHERE s.basketSize = 1.0 LIMIT 3"
  );
  console.log("\nVerification (basket=1.0, AOV should equal price):");
  for (const row of check) {
    const match = row.aov === row.originalPrice ? "✓" : "✗ MISMATCH";
    console.log(`  ${row.name}: price=${row.originalPrice}, AOV=${row.aov} ${match}`);
  }
  
  await conn.end();
}

main().catch(console.error);
