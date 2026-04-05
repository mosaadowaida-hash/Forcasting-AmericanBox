import fs from 'fs';
const data = JSON.parse(fs.readFileSync('client/src/data/all_scenarios_v3.json', 'utf8'));

// Check shipping per product
const productShipping = new Map();
for (const s of data) {
  if (productShipping.has(s.item_name) === false) {
    productShipping.set(s.item_name, s.shipping);
  }
}
console.log('Products with shipping=85:');
for (const [name, ship] of productShipping) {
  if (ship === 85) console.log('  ', name);
}
console.log('\nProducts with shipping=0:');
for (const [name, ship] of productShipping) {
  if (ship === 0) console.log('  ', name);
}

// Check AOV calculation for a product
const p1 = data.find(s => s.item_name.includes('Nordic') && s.basket_size === 1);
console.log('\nNordic DHA (basket=1):');
console.log('  original_price:', p1.original_price);
console.log('  selling_price:', p1.selling_price);
console.log('  aov:', p1.aov);
console.log('  revenue_per_order:', p1.revenue_per_order);
console.log('  cogs:', p1.cogs_per_order);

// AOV = 0.7*price + 0.2*(2*price*0.9) + 0.1*(3*price*0.85)
const price = p1.selling_price;
const calcAOV = 0.7 * price + 0.2 * (2 * price * 0.9) + 0.1 * (3 * price * 0.85);
console.log('  calculated AOV (from selling_price):', calcAOV);

// delivery_rate = revenue / aov
const delivery_rate = p1.revenue_per_order / p1.aov;
console.log('  delivery_rate:', delivery_rate);

// COGS ratio
console.log('  COGS / original_price:', p1.cogs_per_order / p1.original_price);
console.log('  COGS / selling_price:', p1.cogs_per_order / p1.selling_price);

// Check a product with basket > 1
const p2 = data.find(s => s.item_name.includes('Nordic') && s.basket_size === 1.3);
console.log('\nNordic DHA (basket=1.3):');
console.log('  aov:', p2.aov);
console.log('  expected aov (calcAOV * 1.3):', calcAOV * 1.3);
console.log('  revenue_per_order:', p2.revenue_per_order);
console.log('  cogs:', p2.cogs_per_order);
console.log('  net_profit:', p2.net_profit_per_order);

// Check bundle
const b1 = data.find(s => s.item_type === 'bundle' && s.basket_size === 1);
console.log('\nBundle (basket=1):');
console.log('  name:', b1.item_name);
console.log('  original_price:', b1.original_price);
console.log('  selling_price:', b1.selling_price);
console.log('  aov:', b1.aov);
console.log('  cogs:', b1.cogs_per_order);
console.log('  COGS/original:', b1.cogs_per_order / b1.original_price);
console.log('  COGS/selling:', b1.cogs_per_order / b1.selling_price);

// Check if bundle AOV = selling_price (no upsell for bundles?)
console.log('  aov === selling_price?', b1.aov === b1.selling_price);

// Check all unique selling_price vs original_price ratios for bundles
console.log('\n=== Bundle discount analysis ===');
const bundles = new Map();
for (const s of data) {
  if (s.item_type === 'bundle' && bundles.has(s.item_name) === false) {
    bundles.set(s.item_name, {
      name: s.item_name,
      original: s.original_price,
      selling: s.selling_price,
      discount: ((s.original_price - s.selling_price) / s.original_price * 100).toFixed(1),
    });
  }
}
for (const [name, b] of bundles) {
  console.log(`  ${name}: ${b.original} -> ${b.selling} (${b.discount}% off)`);
}

process.exit(0);
