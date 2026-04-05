import { readFileSync } from 'fs';

const d = JSON.parse(readFileSync('./client/src/data/allScenariosComprehensive.json', 'utf8'));

const products = new Map();
d.forEach(s => {
  const arr = products.get(s.item_name) || [];
  arr.push(s);
  products.set(s.item_name, arr);
});

for (const [name, scenarios] of products) {
  const diffs = scenarios.map(s => {
    const calc = s.selling_price * s.actual_margin / 100 - s.cpa_dashboard;
    return Math.round(calc - s.profit_per_order);
  });
  const uniqueDiffs = [...new Set(diffs)];
  if (uniqueDiffs.length === 1 && uniqueDiffs[0] === 0) {
    console.log(`${name}: EXACT (offset=0, price=${scenarios[0].selling_price}, margin=${scenarios[0].actual_margin})`);
  } else {
    console.log(`${name}: offset=${uniqueDiffs.join(',')} (price=${scenarios[0].selling_price}, margin=${scenarios[0].actual_margin})`);
  }
}
