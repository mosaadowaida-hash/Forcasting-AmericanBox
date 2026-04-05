import fs from 'fs';
const data = JSON.parse(fs.readFileSync('client/src/data/all_scenarios_v3.json', 'utf8'));

// Get a few products to compare
const nordic = data.filter(s => s.item_name.includes('Nordic'));
const champix = data.filter(s => s.item_name.includes('Champix'));
const lithium = data.filter(s => s.item_name.includes('Lithium'));
const boneBundle = data.filter(s => s.item_name.includes('العظام'));

function analyze(name, scenarios) {
  const s1 = scenarios.find(s => s.basket_size === 1 && s.cpm === 32.5 && s.ctr === 0.01 && s.cvr === 0.005);
  if (s1 === undefined) {
    console.log(name, ': no matching scenario found');
    return;
  }
  
  console.log('\n=== ' + name + ' ===');
  console.log('original_price:', s1.original_price);
  console.log('selling_price:', s1.selling_price);
  console.log('shipping:', s1.shipping);
  
  // AOV analysis
  const sp = s1.selling_price;
  const calcAOV = 0.7 * sp + 0.2 * (2 * sp * 0.9) + 0.1 * (3 * sp * 0.85);
  console.log('aov:', s1.aov, '| calculated:', calcAOV, '| match:', Math.abs(s1.aov - calcAOV) < 1);
  
  // Revenue analysis
  const deliveryRate = s1.revenue_per_order / s1.aov;
  console.log('revenue:', s1.revenue_per_order, '| delivery_rate:', deliveryRate.toFixed(6));
  
  // COGS analysis
  console.log('cogs:', s1.cogs_per_order);
  console.log('  cogs/original:', (s1.cogs_per_order / s1.original_price).toFixed(4));
  console.log('  cogs/selling:', (s1.cogs_per_order / s1.selling_price).toFixed(4));
  
  // CPA analysis
  const cpc = s1.cpm / (s1.ctr * 1000);
  const cpaDash = cpc / s1.cvr;
  const cpaDeliv = s1.cpa_delivered;
  const deliveryRateCPA = cpaDash / cpaDeliv;
  console.log('cpc:', s1.cpc, '| calculated:', cpc);
  console.log('cpa_dashboard:', s1.cpa_dashboard, '| calculated:', cpaDash);
  console.log('cpa_delivered:', s1.cpa_delivered, '| cpa_dash/cpa_deliv:', deliveryRateCPA.toFixed(6));
  
  // Gross profit
  console.log('gross_profit:', s1.gross_profit_per_order);
  console.log('  calculated (rev - cogs - ship):', (s1.revenue_per_order - s1.cogs_per_order - s1.shipping).toFixed(2));
  
  // Net profit
  console.log('net_profit:', s1.net_profit_per_order);
  console.log('  calculated (rev - cogs - ship - cpa_deliv):', (s1.revenue_per_order - s1.cogs_per_order - s1.shipping - s1.cpa_delivered).toFixed(2));
  
  // ROAS
  console.log('roas:', s1.roas, '| calculated (aov/cpa_dash):', (s1.aov / s1.cpa_dashboard).toFixed(2));
}

analyze('Nordic DHA (product, ship=0)', nordic);
analyze('Champix (product, ship=0)', champix);
analyze('Lithium (product, ship=85)', lithium);
analyze('Bundle العظام (bundle, ship=0)', boneBundle);

// Now check: is the delivery rate the same for all?
console.log('\n=== Delivery Rate Analysis ===');
const rates = new Set();
for (const s of data) {
  if (s.basket_size === 1) {
    const rate = (s.revenue_per_order / s.aov).toFixed(6);
    rates.add(rate);
  }
}
console.log('Unique delivery rates:', [...rates]);

// CPA delivery rate analysis
console.log('\n=== CPA Delivery Rate Analysis ===');
const cpaRates = new Set();
for (const s of data) {
  const cpc = s.cpm / (s.ctr * 1000);
  const cpaDash = cpc / s.cvr;
  const rate = (cpaDash / s.cpa_delivered).toFixed(6);
  cpaRates.add(rate);
}
console.log('Unique CPA delivery rates:', [...cpaRates]);

process.exit(0);
