import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('./client/src/data/allScenariosComprehensive.json', 'utf8'));
const p = data.find(d => d.productName.includes('DHA 473'));
if (!p) { console.log('Not found'); process.exit(); }

console.log('Product:', p.productName, 'Price:', p.price);
console.log('Type:', p.type, 'Discount2:', p.discount2Pcs, 'Discount3:', p.discount3Pcs);

const s = p.scenarios;

console.log('\n=== First 4 scenarios (lowest CPM, lowest CTR, lowest CVR, all baskets) ===');
s.slice(0,4).forEach((sc,i) => {
  console.log(`\n--- Scenario ${i+1} ---`);
  console.log('CPM:', sc.cpmValue, 'CTR:', sc.ctrValue, 'CVR:', sc.cvrValue, 'Basket:', sc.basketSize);
  console.log('AOV:', sc.aov, 'Revenue:', sc.revenuePerOrder);
  console.log('CPA Dashboard:', sc.cpaDashboard, 'CPA Delivered:', sc.cpaDelivered);
  console.log('Profit:', sc.profitPerOrder, 'ROAS:', sc.roas);
  console.log('Status:', sc.status);
});

// Now reverse-engineer the formulas
console.log('\n\n=== REVERSE ENGINEERING FORMULAS ===');
const sc1 = s[0]; // CPM=32.5, CTR=1%, CVR=0.5%, Basket=1.0
console.log('\nScenario 1: CPM=32.5, CTR=1%, CVR=0.5%, Basket=1.0');
console.log('Price:', p.price, '= 3750');

// CPA Dashboard = CPM / (CTR * CVR * 1000) ... no that's wrong
// CPA = CPM / CTR / CVR ... let's check
const cpa_calc1 = 32.5 / (0.01 * 0.005) * (1/1000);
console.log('CPA calc attempt 1 (CPM/(CTR*CVR*1000)):', cpa_calc1);
const cpa_calc2 = (32.5 / 0.01) / 0.005;
console.log('CPA calc attempt 2 ((CPM/CTR)/CVR):', cpa_calc2);
const cpa_calc3 = 32.5 / (0.01 * 0.005);
console.log('CPA calc attempt 3 (CPM/(CTR*CVR)):', cpa_calc3);

// CPC = CPM / (CTR * 1000)
const cpc = 32.5 / (0.01 * 1000);
console.log('CPC:', cpc);
// CPA = CPC / CVR
const cpa_from_cpc = cpc / 0.005;
console.log('CPA from CPC/CVR:', cpa_from_cpc);

console.log('Actual CPA Dashboard:', sc1.cpaDashboard);

// AOV for basket 1.0
console.log('\nAOV Analysis:');
s.slice(0,4).forEach(sc => {
  console.log(`Basket ${sc.basketSize}: AOV=${sc.aov}, Price=${p.price}, AOV/Price=${(sc.aov/p.price).toFixed(4)}`);
});

// Revenue analysis
console.log('\nRevenue Analysis:');
s.slice(0,4).forEach(sc => {
  console.log(`Basket ${sc.basketSize}: Revenue=${sc.revenuePerOrder}, AOV=${sc.aov}, Revenue/AOV=${(sc.revenuePerOrder/sc.aov).toFixed(4)}`);
});

// Delivery rate
console.log('\nDelivery Rate Analysis:');
s.slice(0,4).forEach(sc => {
  const deliveryRate = sc.cpaDelivered / sc.cpaDashboard;
  console.log(`Basket ${sc.basketSize}: CPA_D=${sc.cpaDelivered}, CPA=${sc.cpaDashboard}, Ratio=${deliveryRate.toFixed(4)}`);
});

// Profit analysis
console.log('\nProfit Analysis:');
s.slice(0,4).forEach(sc => {
  console.log(`Basket ${sc.basketSize}: Profit=${sc.profitPerOrder}, Revenue=${sc.revenuePerOrder}, CPA_D=${sc.cpaDelivered}`);
  console.log(`  Revenue - CPA_D = ${sc.revenuePerOrder - sc.cpaDelivered}`);
  console.log(`  Profit / Revenue = ${(sc.profitPerOrder/sc.revenuePerOrder).toFixed(4)}`);
});

// Check COGS
console.log('\nCOGS Analysis (trying to find COGS rate):');
s.slice(0,4).forEach(sc => {
  // profit = revenue - cpa_delivered - COGS - shipping
  // COGS = revenue - cpa_delivered - profit - shipping
  const shipping = 30; // assumed
  const cogs_with_shipping = sc.revenuePerOrder - sc.cpaDelivered - sc.profitPerOrder;
  const cogs_no_shipping = sc.revenuePerOrder - sc.cpaDelivered - sc.profitPerOrder - shipping;
  console.log(`Basket ${sc.basketSize}: Rev-CPA_D-Profit=${cogs_with_shipping}, Rev-CPA_D-Profit-30=${cogs_no_shipping}`);
  console.log(`  COGS_rate_with_ship = ${(cogs_with_shipping / sc.aov).toFixed(4)}`);
  console.log(`  COGS_rate_no_ship = ${(cogs_no_shipping / sc.aov).toFixed(4)}`);
  console.log(`  COGS_rate_of_price = ${(cogs_no_shipping / p.price).toFixed(4)}`);
});

// Check a bundle product
console.log('\n\n=== BUNDLE PRODUCT ANALYSIS ===');
const bundle = data.find(d => d.type === 'باندل');
if (bundle) {
  console.log('Bundle:', bundle.productName, 'Price:', bundle.price, 'Type:', bundle.type);
  console.log('Discount2:', bundle.discount2Pcs, 'Discount3:', bundle.discount3Pcs);
  const bs = bundle.scenarios;
  console.log('\nFirst 4 scenarios:');
  bs.slice(0,4).forEach((sc,i) => {
    console.log(`Basket ${sc.basketSize}: AOV=${sc.aov}, Revenue=${sc.revenuePerOrder}, CPA=${sc.cpaDashboard}, CPA_D=${sc.cpaDelivered}, Profit=${sc.profitPerOrder}`);
  });
  
  console.log('\nAOV Analysis for bundle:');
  bs.slice(0,4).forEach(sc => {
    console.log(`Basket ${sc.basketSize}: AOV=${sc.aov}, Price=${bundle.price}, AOV/Price=${(sc.aov/bundle.price).toFixed(4)}`);
  });
}
