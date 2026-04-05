import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

async function main() {
  const db = drizzle(process.env.DATABASE_URL);
  
  // Check first product scenarios
  const [rows] = await db.execute(sql`SELECT s.*, p.name FROM scenarios s JOIN products p ON s.productId = p.id WHERE p.name LIKE '%DHA 473%' LIMIT 4`);
  console.log('DHA 473 first 4 scenarios:');
  for (const r of rows) {
    console.log('CPM:', r.cpm, 'CTR:', r.ctr, 'CVR:', r.cvr, 'Basket:', r.basketSize);
    console.log('  AOV:', r.aov, 'Revenue:', r.revenuePerOrder, 'CPA:', r.cpaDashboard, 'CPA_D:', r.cpaDelivered);
    console.log('  Profit:', r.netProfitPerOrder, 'ROAS:', r.roas, 'Status:', r.status);
  }
  
  // Count total
  const [count] = await db.execute(sql`SELECT COUNT(*) as cnt FROM scenarios`);
  console.log('\nTotal scenarios:', count[0].cnt);
  
  const [pcount] = await db.execute(sql`SELECT COUNT(*) as cnt FROM products`);
  console.log('Total products:', pcount[0].cnt);
  
  // Check if test product exists (from earlier testing)
  const [testProducts] = await db.execute(sql`SELECT * FROM products WHERE name LIKE '%Test%' OR name LIKE '%تجربة%'`);
  console.log('\nTest products found:', testProducts.length);
  for (const p of testProducts) {
    console.log('  ID:', p.id, 'Name:', p.name);
  }
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
