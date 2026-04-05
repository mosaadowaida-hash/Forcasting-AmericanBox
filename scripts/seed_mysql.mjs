import fs from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

const data = JSON.parse(fs.readFileSync('client/src/data/all_scenarios_v3.json', 'utf8'));
console.log('Loaded', data.length, 'scenarios from JSON');

// Extract unique products
const productMap = new Map();
for (const s of data) {
  if (!productMap.has(s.item_name)) {
    productMap.set(s.item_name, {
      name: s.item_name,
      type: s.item_type === 'bundle' ? 'bundle' : 'product',
      originalPrice: s.original_price,
      sellingPrice: s.selling_price,
      shipping: s.shipping,
      // For bundles: discount = (original - selling) / original * 100
      bundleDiscount: s.item_type === 'bundle' 
        ? Math.round((s.original_price - s.selling_price) / s.original_price * 100)
        : 0,
      // For products: discounts are 10% and 15% (standard upsell)
      discountTwoItems: s.item_type === 'product' ? 10 : 0,
      discountThreeItems: s.item_type === 'product' ? 15 : 0,
    });
  }
}

console.log('Found', productMap.size, 'unique products');

async function main() {
  try {
    // Clear existing data
    console.log('\n=== Clearing existing data ===');
    await db.execute(sql`DELETE FROM scenarios`);
    await db.execute(sql`DELETE FROM products`);
    console.log('Cleared');

    // Insert products
    console.log('\n=== Inserting products ===');
    const productIds = new Map(); // name -> id
    
    for (const [name, p] of productMap) {
      const [result] = await db.execute(sql`INSERT INTO products (name, type, originalPrice, discountTwoItems, discountThreeItems, bundleDiscount) VALUES (${p.name}, ${p.type}, ${p.originalPrice}, ${p.discountTwoItems}, ${p.discountThreeItems}, ${p.bundleDiscount})`);
      productIds.set(name, result.insertId);
      console.log(`  ✅ ${name} (id: ${result.insertId})`);
    }

    // Insert scenarios in batches
    console.log('\n=== Inserting scenarios ===');
    let totalInserted = 0;
    
    // Group scenarios by product
    const scenariosByProduct = new Map();
    for (const s of data) {
      if (!scenariosByProduct.has(s.item_name)) {
        scenariosByProduct.set(s.item_name, []);
      }
      scenariosByProduct.get(s.item_name).push(s);
    }

    for (const [productName, scenarios] of scenariosByProduct) {
      const productId = productIds.get(productName);
      if (!productId) {
        console.error(`  ❌ No product ID for ${productName}`);
        continue;
      }

      // Insert in batches of 50
      for (let i = 0; i < scenarios.length; i += 50) {
        const batch = scenarios.slice(i, i + 50);
        const values = batch.map(s => {
          const cpc = s.cpc;
          const deliveredRoas = s.revenue_per_order > 0 && s.cpa_delivered > 0 
            ? s.revenue_per_order / s.cpa_delivered : 0;
          const breakEvenCpa = s.gross_profit_per_order || (s.revenue_per_order - s.cogs_per_order - s.shipping);
          const profitMargin = s.revenue_per_order > 0 
            ? (s.net_profit_per_order / s.revenue_per_order) * 100 : 0;
          
          return `(${productId}, ${s.cpm}, '${s.cpm_label.replace(/'/g, "''")}', ${s.ctr}, '${s.ctr_label.replace(/'/g, "''")}', ${s.cvr}, '${s.cvr_label.replace(/'/g, "''")}', ${s.basket_size}, '${s.basket_label.replace(/'/g, "''")}', ${cpc.toFixed(2)}, ${s.cpa_dashboard.toFixed(2)}, ${s.cpa_delivered.toFixed(2)}, ${s.aov.toFixed(2)}, ${s.revenue_per_order.toFixed(2)}, ${s.cogs_per_order.toFixed(2)}, ${s.shipping}, ${s.roas.toFixed(2)}, ${deliveredRoas.toFixed(2)}, ${breakEvenCpa.toFixed(2)}, ${s.net_profit_per_order.toFixed(2)}, ${profitMargin.toFixed(2)}, '${s.status}')`;
        }).join(',\n');

        await db.execute(sql.raw(`INSERT INTO scenarios (productId, cpm, cpmLabel, ctr, ctrLabel, cvr, cvrLabel, basketSize, basketLabel, cpc, cpaDashboard, cpaDelivered, aov, revenuePerOrder, cogs, shipping, roas, deliveredRoas, breakEvenCpa, netProfitPerOrder, profitMargin, status) VALUES ${values}`));
      }
      
      totalInserted += scenarios.length;
      console.log(`  ✅ ${productName}: ${scenarios.length} scenarios`);
    }

    console.log(`\n========================================`);
    console.log(`✅ Done! ${productMap.size} products, ${totalInserted} scenarios`);

    // Verify
    const [countResult] = await db.execute(sql`SELECT COUNT(*) as cnt FROM scenarios`);
    console.log(`Verified: ${countResult[0].cnt} scenarios in DB`);
    
    const [prodCount] = await db.execute(sql`SELECT COUNT(*) as cnt FROM products`);
    console.log(`Verified: ${prodCount[0].cnt} products in DB`);

  } catch (err) {
    console.error('Error:', err);
  }
  
  process.exit(0);
}

main();
