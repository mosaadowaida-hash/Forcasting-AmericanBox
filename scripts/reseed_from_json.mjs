import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

const data = JSON.parse(readFileSync('./client/src/data/allScenariosComprehensive.json', 'utf8'));
console.log('Total scenarios in JSON:', data.length);

// Group by product
const productMap = new Map();
data.forEach(s => {
  const key = s.item_name;
  if (!productMap.has(key)) {
    productMap.set(key, {
      name: s.item_name,
      type: s.item_type === 'bundle' ? 'bundle' : 'product',
      price: s.selling_price,
      baseMargin: s.base_margin,
      actualMargin: s.actual_margin,
      scenarios: []
    });
  }
  productMap.get(key).scenarios.push(s);
});

console.log('Unique products:', productMap.size);

async function main() {
  const db = drizzle(process.env.DATABASE_URL);
  
  // 1. Clear existing data
  console.log('Clearing existing data...');
  await db.execute(sql`DELETE FROM scenarios`);
  await db.execute(sql`DELETE FROM products`);
  console.log('Cleared.');
  
  // 2. Insert products and their scenarios
  let totalInserted = 0;
  
  for (const [name, productData] of productMap) {
    // Determine discounts from the product name/type
    // All products have actual_margin=31.5 and base_margin=35
    const discount2 = 10; // default
    const discount3 = 15; // default
    
    // Insert product
    await db.execute(sql`INSERT INTO products (name, type, originalPrice, discountTwoItems, discountThreeItems, bundleDiscount) 
      VALUES (${productData.name}, ${productData.type}, ${productData.price}, ${discount2}, ${discount3}, ${0})`);
    
    // Get the product ID
    const [idResult] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    const productId = idResult[0].id;
    
    console.log(`Product ${productId}: ${name} (${productData.scenarios.length} scenarios)`);
    
    // Insert scenarios in batches
    const scenarios = productData.scenarios;
    for (let i = 0; i < scenarios.length; i += 20) {
      const batch = scenarios.slice(i, i + 20);
      
      for (const s of batch) {
        // Map basket_multiplier to label
        let basketLabel = 'Single Item';
        if (s.basket_multiplier === 1.0) basketLabel = 'Single Item (1.0)';
        else if (s.basket_multiplier === 1.1) basketLabel = 'Low Basket (1.1)';
        else if (s.basket_multiplier === 1.2) basketLabel = 'Fair Basket (1.2)';
        else if (s.basket_multiplier === 1.3) basketLabel = 'Healthy Basket (1.3)';
        
        // Map scenario labels
        const cpmLabel = s.cpm_scenario || (s.cpm <= 35 ? 'Low CPM Cost' : s.cpm <= 50 ? 'Medium CPM Cost' : 'High CPM Cost');
        const ctrLabel = s.ctr_scenario || `CTR ${(s.ctr*100).toFixed(2)}%`;
        const cvrLabel = s.cvr_scenario || `CVR ${(s.cvr*100).toFixed(2)}%`;
        
        // Map status to Arabic
        const status = s.status === 'Profit' ? 'ربح' : 'خسارة';
        
        // Calculate COGS from the data: COGS = revenue - cpa_delivered - profit
        const cogs = Math.round((s.revenue_per_order - s.cpa_delivered - s.profit_per_order) * 100) / 100;
        
        // Calculate delivered ROAS
        const deliveredRoas = s.delivered_roas || (s.cpa_delivered > 0 ? Math.round(s.revenue_per_order / s.cpa_delivered * 100) / 100 : 0);
        
        await db.execute(sql`INSERT INTO scenarios 
          (productId, cpm, cpmLabel, ctr, ctrLabel, cvr, cvrLabel, basketSize, basketLabel, 
           cpc, cpaDashboard, cpaDelivered, aov, revenuePerOrder, cogs, shipping, 
           roas, deliveredRoas, breakEvenCpa, netProfitPerOrder, profitMargin, status)
          VALUES (
            ${productId}, ${s.cpm}, ${cpmLabel}, ${s.ctr}, ${ctrLabel}, ${s.cvr}, ${cvrLabel}, 
            ${s.basket_multiplier}, ${basketLabel},
            ${s.cpc}, ${s.cpa_dashboard}, ${s.cpa_delivered}, ${s.aov}, ${s.revenue_per_order},
            ${cogs}, ${0}, ${s.roas}, ${deliveredRoas}, ${s.break_even_cpa}, 
            ${s.profit_per_order}, ${s.profit_margin}, ${status}
          )`);
      }
    }
    
    totalInserted += scenarios.length;
  }
  
  console.log(`\nDone! Inserted ${productMap.size} products and ${totalInserted} scenarios.`);
  
  // Verify
  const [vCount] = await db.execute(sql`SELECT COUNT(*) as cnt FROM scenarios`);
  const [pCount] = await db.execute(sql`SELECT COUNT(*) as cnt FROM products`);
  console.log(`Verification: ${pCount[0].cnt} products, ${vCount[0].cnt} scenarios in DB`);
  
  // Verify a sample
  const [sample] = await db.execute(sql`SELECT s.*, p.name FROM scenarios s JOIN products p ON s.productId = p.id WHERE p.name LIKE '%DHA 473%' AND s.cpm = 70 AND s.ctr = 0.01 AND s.cvr = 0.005 AND s.basketSize = 1 LIMIT 1`);
  if (sample.length > 0) {
    const r = sample[0];
    console.log('\nSample verification (DHA 473, CPM=70, CTR=1%, CVR=0.5%, Basket=1):');
    console.log('  AOV:', r.aov, '(expected: 4860)');
    console.log('  Revenue:', r.revenuePerOrder, '(expected: 4301)');
    console.log('  CPA:', r.cpaDashboard, '(expected: 1400)');
    console.log('  CPA_D:', r.cpaDelivered, '(expected: 1582)');
    console.log('  Profit:', r.netProfitPerOrder, '(expected: -219)');
    console.log('  ROAS:', r.roas, '(expected: 3.47)');
    console.log('  Status:', r.status, '(expected: خسارة)');
  }
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
