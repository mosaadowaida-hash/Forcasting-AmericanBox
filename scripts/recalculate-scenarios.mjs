/**
 * Recalculate all 6,048 scenarios with the fixed engine:
 * - Uses per-product marginPercent (default 31.5)
 * - Fixed COGS = AOV × (1 - margin%)
 * - Fixed breakEvenCpa = grossMargin - shipping
 * - Fixed shipping stored as actual value (not 0)
 */
import mysql from 'mysql2/promise';

// ============================================================
// CONSTANTS
// ============================================================
const DEFAULT_MARGIN = 31.5;
const SHIPPING_THRESHOLD = 2600;
const SHIPPING_COST = 100;

const PAYMENT_DELIVERY_RATES = {
  cod: 0.65,
  instapay: 0.90,
  card: 0.92,
};

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
  if (!paymentMix || paymentMix.length === 0) return 0.65;
  const total = paymentMix.reduce((sum, m) => sum + (PAYMENT_DELIVERY_RATES[m] ?? 0.65), 0);
  return total / paymentMix.length;
}

function parsePaymentMix(raw) {
  if (!raw) return ['cod'];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return ['cod'];
}

function generateScenarios(product) {
  const results = [];
  const price = product.originalPrice;
  const paymentMix = parsePaymentMix(product.paymentMix);
  const deliveryRate = calcDeliveryRate(paymentMix);
  const marginPercent = product.marginPercent ?? DEFAULT_MARGIN;
  const shippingCost = (product.type === 'product' && price <= SHIPPING_THRESHOLD) ? SHIPPING_COST : 0;

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
          const grossMargin = Math.round(aov * marginPercent / 100);

          // FIXED: COGS = AOV × (1 - margin%)
          const cogs = Math.round(aov * (1 - marginPercent / 100));

          const profit = Math.round(grossMargin - cpaDashboard - shippingCost);

          // FIXED: breakEvenCpa = grossMargin - shipping
          const breakEvenCpa = Math.round(grossMargin - shippingCost);

          const roas = round2(aov / cpaDashboard);
          const deliveredRoas = round2(aov / cpaDelivered);
          const profitMargin = round2(aov > 0 ? (profit / aov) * 100 : 0);
          const status = profit > 0 ? 'ربح' : 'خسارة';

          results.push({
            productId: product.id,
            cpm: round2(cpm), cpmLabel: cpmLevel.label,
            ctr, ctrLabel: ctrLevel.label,
            cvr, cvrLabel: cvrLevel.label,
            basketSize: round2(basket), basketLabel: basketLevel.label,
            cpc, cpaDashboard, cpaDelivered,
            aov, revenuePerOrder, cogs,
            shipping: shippingCost,  // FIXED: store actual shipping cost
            roas, deliveredRoas, breakEvenCpa,
            netProfitPerOrder: profit, profitMargin, status,
          });
        }
      }
    }
  }
  return results; // 144 scenarios
}

// ============================================================
// MAIN
// ============================================================
const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Fetching all products...');
const [products] = await conn.execute('SELECT * FROM products');
console.log(`Found ${products.length} products`);

let totalDeleted = 0;
let totalInserted = 0;

for (const product of products) {
  // Delete old scenarios
  const [delResult] = await conn.execute('DELETE FROM scenarios WHERE productId = ?', [product.id]);
  totalDeleted += delResult.affectedRows;

  // Generate new scenarios
  const scenarios = generateScenarios(product);

  // Insert in batches of 50
  for (let i = 0; i < scenarios.length; i += 50) {
    const batch = scenarios.slice(i, i + 50);
    const values = batch.map(s => [
      s.productId, s.cpm, s.cpmLabel, s.ctr, s.ctrLabel, s.cvr, s.cvrLabel,
      s.basketSize, s.basketLabel, s.cpc, s.cpaDashboard, s.cpaDelivered,
      s.aov, s.revenuePerOrder, s.cogs, s.shipping, s.roas, s.deliveredRoas,
      s.breakEvenCpa, s.netProfitPerOrder, s.profitMargin, s.status,
    ]);
    const placeholders = values.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
    await conn.execute(
      `INSERT INTO scenarios (productId,cpm,cpmLabel,ctr,ctrLabel,cvr,cvrLabel,basketSize,basketLabel,cpc,cpaDashboard,cpaDelivered,aov,revenuePerOrder,cogs,shipping,roas,deliveredRoas,breakEvenCpa,netProfitPerOrder,profitMargin,status) VALUES ${placeholders}`,
      values.flat()
    );
    totalInserted += batch.length;
  }

  console.log(`  ✓ ${product.name.substring(0, 30).padEnd(30)} | margin=${product.marginPercent}% | shipping=${(product.type === 'product' && product.originalPrice <= SHIPPING_THRESHOLD) ? 100 : 0} | scenarios=144`);
}

// Verify
const [countResult] = await conn.execute('SELECT COUNT(*) as cnt FROM scenarios');
console.log(`\n✅ Done! Deleted: ${totalDeleted}, Inserted: ${totalInserted}, Total in DB: ${countResult[0].cnt}`);

// Spot check
const [sample] = await conn.execute(`
  SELECT s.cpm, s.ctr, s.cvr, s.basketSize, s.aov, s.cpaDashboard, s.cpaDelivered,
         s.cogs, s.breakEvenCpa, s.shipping, s.netProfitPerOrder, p.marginPercent
  FROM scenarios s JOIN products p ON s.productId = p.id
  WHERE p.userId = 78 LIMIT 3
`);
console.log('\nSpot check (first 3 scenarios):');
sample.forEach(s => {
  const expectedCogs = Math.round(s.aov * (1 - s.marginPercent / 100));
  const expectedBreakEven = Math.round(s.aov * s.marginPercent / 100) - s.shipping;
  console.log(`  CPM=${s.cpm} CTR=${s.ctr} CVR=${s.cvr} Basket=${s.basketSize}`);
  console.log(`    AOV=${s.aov}, margin=${s.marginPercent}%, shipping=${s.shipping}`);
  console.log(`    CPA_D=${s.cpaDashboard}, CPA_Del=${s.cpaDelivered}`);
  console.log(`    COGS=${s.cogs} (expected=${expectedCogs}) ✓=${s.cogs === expectedCogs}`);
  console.log(`    BreakEven=${s.breakEvenCpa} (expected=${expectedBreakEven}) ✓=${s.breakEvenCpa === expectedBreakEven}`);
  console.log(`    Profit=${s.netProfitPerOrder}`);
});

await conn.end();
