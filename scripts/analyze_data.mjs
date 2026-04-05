import fs from 'fs';
const data = JSON.parse(fs.readFileSync('client/src/data/all_scenarios_v3.json', 'utf8'));

// Get unique products
const products = new Map();
for (const s of data) {
  const key = s.item_name;
  if (!products.has(key)) {
    products.set(key, {
      name: s.item_name,
      type: s.item_type,
      original_price: s.original_price,
      selling_price: s.selling_price,
    });
  }
}

console.log('Total unique products:', products.size);
console.log('Total scenarios:', data.length);
console.log('Scenarios per product:', data.length / products.size);

const s = data[0];
console.log('\nSample scenario:');
console.log('  item:', s.item_name);
console.log('  cpm:', s.cpm, s.cpm_label);
console.log('  ctr:', s.ctr, s.ctr_label);
console.log('  cvr:', s.cvr, s.cvr_label);
console.log('  basket:', s.basket_size, s.basket_label);
console.log('  cpc:', s.cpc);
console.log('  cpa_dashboard:', s.cpa_dashboard);
console.log('  cpa_delivered:', s.cpa_delivered);
console.log('  aov:', s.aov);
console.log('  revenue_per_order:', s.revenue_per_order);
console.log('  cogs_per_order:', s.cogs_per_order);
console.log('  shipping:', s.shipping);
console.log('  net_profit:', s.net_profit_per_order);
console.log('  roas:', s.roas);
console.log('  status:', s.status);
console.log('  max_cpa_allowed:', s.max_cpa_allowed);
console.log('  gross_profit_per_order:', s.gross_profit_per_order);

// List all products
console.log('\n=== All Products ===');
let i = 1;
for (const [name, p] of products) {
  console.log(`${i}. ${name} (${p.type}) - Price: ${p.original_price}`);
  i++;
}

process.exit(0);
