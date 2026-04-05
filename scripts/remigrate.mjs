import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Constants matching original simulator exactly
const EFFECTIVE_DELIVERY_RATE = 0.6883;
const COGS_PERCENTAGE = 0.65;
const SHIPPING_COST = 30;
const UPSELL_MIX = {
  single: { percentage: 0.70, discount: 0 },
  double: { percentage: 0.20, discount: 0.10 },
  triple: { percentage: 0.10, discount: 0.15 },
};

// 3 CPM × 4 CTR × 3 CVR × 4 Basket = 144 scenarios
const CPM_LEVELS = [
  { value: 32.5, label: "Low CPM Cost" },
  { value: 47.5, label: "Medium CPM Cost" },
  { value: 70, label: "High CPM Cost" },
];
const CTR_LEVELS = [
  { value: 0.01, label: "Low CTR" },
  { value: 0.0125, label: "Good CTR" },
  { value: 0.015, label: "Very Good CTR" },
  { value: 0.0175, label: "Excellent CTR" },
];
const CVR_LEVELS = [
  { value: 0.005, label: "Low CVR" },
  { value: 0.01, label: "Good CVR" },
  { value: 0.015, label: "Excellent CVR" },
];
const BASKET_SIZES = [
  { value: 1.0, label: "Single Item" },
  { value: 1.1, label: "Low Basket Size" },
  { value: 1.2, label: "Fair Basket Size" },
  { value: 1.3, label: "Healthy Basket Size" },
];

function round2(n) { return Math.round(n * 100) / 100; }

function calculateAOV(originalPrice, type, discountTwo, discountThree, bundleDiscount) {
  let basePrice = originalPrice;
  if (type === "bundle" && bundleDiscount) {
    basePrice = originalPrice * (1 - bundleDiscount / 100);
  }
  const singlePrice = basePrice;
  const doublePrice = basePrice * 2 * (1 - (discountTwo || UPSELL_MIX.double.discount));
  const triplePrice = basePrice * 3 * (1 - (discountThree || UPSELL_MIX.triple.discount));
  return singlePrice * UPSELL_MIX.single.percentage +
    doublePrice * UPSELL_MIX.double.percentage +
    triplePrice * UPSELL_MIX.triple.percentage;
}

function generateScenarios(product) {
  const scenarios = [];
  const aov = calculateAOV(
    product.original_price, product.type,
    product.discount_two_items, product.discount_three_items,
    product.bundle_discount
  );

  for (const cpmLevel of CPM_LEVELS) {
    for (const ctrLevel of CTR_LEVELS) {
      for (const cvrLevel of CVR_LEVELS) {
        for (const basketSize of BASKET_SIZES) {
          const cpm = cpmLevel.value;
          const ctr = ctrLevel.value;
          const cvr = cvrLevel.value;
          const basket = basketSize.value;

          const cpc = cpm / (ctr * 1000);
          const cpa_dashboard = cpc / cvr;
          const cpa_delivered = cpa_dashboard / EFFECTIVE_DELIVERY_RATE;
          const order_aov = aov * basket;
          const revenue_per_order = order_aov * EFFECTIVE_DELIVERY_RATE;
          const cogs_val = product.original_price * COGS_PERCENTAGE;
          const roas_val = order_aov / cpa_dashboard;
          const net_profit = revenue_per_order - cogs_val - SHIPPING_COST - cpa_delivered;

          // Only use columns that exist in the DB schema:
          // id, product_id, cpm, cpm_label, ctr, ctr_label, cvr, cvr_label,
          // basket_size, basket_label, aov, revenue_per_order, cpa_dashboard,
          // cpa_delivered, cogs, net_profit_per_order, roas, created_at
          scenarios.push({
            id: uuidv4(),
            product_id: product.id,
            cpm: round2(cpm),
            cpm_label: cpmLevel.label,
            ctr: ctr,
            ctr_label: ctrLevel.label,
            cvr: cvr,
            cvr_label: cvrLevel.label,
            basket_size: round2(basket),
            basket_label: basketSize.label,
            aov: round2(order_aov),
            revenue_per_order: round2(revenue_per_order),
            cpa_dashboard: round2(cpa_dashboard),
            cpa_delivered: round2(cpa_delivered),
            cogs: round2(cogs_val),
            net_profit_per_order: round2(net_profit),
            roas: round2(roas_val),
          });
        }
      }
    }
  }
  return scenarios; // exactly 144
}

async function main() {
  console.log("=== Step 1: Delete all old scenarios ===");
  let deleted = 0;
  while (true) {
    const { data, error } = await supabase.from("scenarios").select("id").limit(1000);
    if (error) { console.error("Error:", error.message); break; }
    if (!data || data.length === 0) break;
    const ids = data.map(d => d.id);
    const { error: delErr } = await supabase.from("scenarios").delete().in("id", ids);
    if (delErr) { console.error("Delete error:", delErr.message); break; }
    deleted += ids.length;
    process.stdout.write(`  Deleted ${deleted} scenarios...\r`);
  }
  console.log(`\n✅ Deleted ${deleted} old scenarios`);

  console.log("\n=== Step 2: Get existing products ===");
  const { data: products, error: prodErr } = await supabase.from("products").select("*");
  if (prodErr) { console.error("Error:", prodErr.message); return; }
  console.log(`Found ${products.length} products`);

  console.log("\n=== Step 3: Generate and insert correct 144 scenarios per product ===");
  let totalScenarios = 0;
  let errors = 0;

  for (const product of products) {
    const scenarios = generateScenarios(product);
    let productOk = true;
    for (let i = 0; i < scenarios.length; i += 50) {
      const batch = scenarios.slice(i, i + 50);
      const { error } = await supabase.from("scenarios").insert(batch);
      if (error) {
        console.error(`  ❌ ${product.name}: ${error.message}`);
        errors++;
        productOk = false;
        break;
      }
    }
    if (productOk) {
      totalScenarios += scenarios.length;
      console.log(`  ✅ ${product.name}: ${scenarios.length} scenarios`);
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ Done! ${products.length} products, ${totalScenarios} scenarios`);
  console.log(`Expected: ${products.length * 144} scenarios`);
  if (errors > 0) console.log(`⚠️ ${errors} products had errors`);

  const { count } = await supabase.from("scenarios").select("*", { count: "exact", head: true });
  console.log(`Actual count in DB: ${count}`);
}

main().catch(console.error);
