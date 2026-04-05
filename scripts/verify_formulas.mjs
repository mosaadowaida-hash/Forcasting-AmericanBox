import { readFileSync } from 'fs';

const d = JSON.parse(readFileSync('./client/src/data/allScenariosComprehensive.json', 'utf8'));

let errors = 0;
let total = 0;
let maxDiff = 0;

// Group by product
const products = new Map();
d.forEach(s => {
  if (!products.has(s.item_name)) products.set(s.item_name, []);
  products.get(s.item_name).push(s);
});

console.log('Products:', products.size);

// Check each formula
d.forEach(s => {
  total++;
  
  // CPC = CPM / (CTR * 1000)
  const cpc = s.cpm / (s.ctr * 1000);
  if (Math.abs(cpc - s.cpc) > 0.01) { errors++; console.log('CPC error:', s.item_name, cpc, s.cpc); }
  
  // CPA Dashboard = CPC / CVR
  const cpa = cpc / s.cvr;
  if (Math.abs(cpa - s.cpa_dashboard) > 1) { errors++; console.log('CPA error:', s.item_name, cpa, s.cpa_dashboard); }
  
  // Profit = price * actual_margin/100 - cpa_dashboard
  const profit = Math.round(s.selling_price * s.actual_margin / 100 - s.cpa_dashboard);
  const profitDiff = Math.abs(profit - s.profit_per_order);
  if (profitDiff > 1) { errors++; console.log('Profit error:', s.item_name, profit, s.profit_per_order, 'diff:', profitDiff); }
  if (profitDiff > maxDiff) maxDiff = profitDiff;
  
  // Status
  const calcStatus = profit > 0 ? 'Profit' : 'Loss';
  if (calcStatus !== s.status && Math.abs(profit) > 1) {
    errors++;
    console.log('Status error:', s.item_name, calcStatus, s.status, 'profit:', profit);
  }
});

console.log('\nTotal:', total, 'Errors:', errors, 'Max profit diff:', maxDiff);

// AOV formula
console.log('\n=== AOV FORMULA ===');
for (const [name, scenarios] of products) {
  const s1 = scenarios.find(s => s.basket_multiplier === 1);
  if (!s1) continue;
  const baseAov = s1.aov;
  const ratio = (baseAov / s1.selling_price).toFixed(4);
  
  let aovOk = true;
  scenarios.forEach(s => {
    const expectedAov = Math.round(baseAov * s.basket_multiplier);
    if (Math.abs(expectedAov - s.aov) > 1) aovOk = false;
  });
  
  if (!aovOk) console.log('AOV scaling error for:', name);
  
  // Print the base AOV ratio for each product
  console.log(`${name}: baseAOV=${baseAov}, price=${s1.selling_price}, ratio=${ratio}`);
}

// Delivery rate
console.log('\n=== DELIVERY RATE ===');
const deliveryRates = new Set();
d.forEach(s => {
  const rate = (s.revenue_per_order / s.aov).toFixed(4);
  deliveryRates.add(rate);
});
console.log('Unique delivery rates:', [...deliveryRates].sort());

// CPA delivery ratio
console.log('\n=== CPA DELIVERY RATIO ===');
const cpaRatios = new Set();
d.forEach(s => {
  const ratio = (s.cpa_delivered / s.cpa_dashboard).toFixed(4);
  cpaRatios.add(ratio);
});
console.log('Unique CPA delivery ratios:', [...cpaRatios].sort());

// ROAS formula
console.log('\n=== ROAS FORMULA ===');
let roasErrors = 0;
d.forEach(s => {
  const roas = parseFloat((s.aov / s.cpa_dashboard).toFixed(2));
  if (Math.abs(roas - s.roas) > 0.02) {
    roasErrors++;
    if (roasErrors <= 3) console.log('ROAS error:', s.item_name, roas, s.roas);
  }
});
console.log('ROAS errors:', roasErrors, '/ total:', total);

// Delivered ROAS
let dRoasErrors = 0;
d.forEach(s => {
  const droas = parseFloat((s.revenue_per_order / s.cpa_delivered).toFixed(2));
  if (Math.abs(droas - s.delivered_roas) > 0.02) {
    dRoasErrors++;
  }
});
console.log('Delivered ROAS errors:', dRoasErrors);

// Profit margin
console.log('\n=== PROFIT MARGIN ===');
let pmErrors = 0;
d.forEach(s => {
  const pm = parseFloat((s.profit_per_order / s.aov * 100).toFixed(1));
  if (Math.abs(pm - s.profit_margin) > 0.2) {
    pmErrors++;
    if (pmErrors <= 3) console.log('PM error:', s.item_name, pm, s.profit_margin);
  }
});
console.log('Profit margin errors:', pmErrors);

// Break-even CPA
console.log('\n=== BREAK-EVEN CPA ===');
let beErrors = 0;
d.forEach(s => {
  const be = Math.round(s.selling_price * s.actual_margin / 100);
  if (Math.abs(be - s.break_even_cpa) > 1) {
    beErrors++;
    if (beErrors <= 3) console.log('BE error:', s.item_name, be, s.break_even_cpa);
  }
});
console.log('Break-even CPA errors:', beErrors);
