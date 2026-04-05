import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://hremfdzcaysddoymvwgp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZW1mZHpjYXlzZGRveW12d2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzc0MjMsImV4cCI6MjA5MDc1MzQyM30.KgzN3j6TNxl-BUQMYxko2Xum0T1Pn0QI-LDRPDklgrw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadData() {
  try {
    const scenariosPath = path.join(__dirname, '../client/src/data/all_scenarios_v3.json');
    const rankingPath = path.join(__dirname, '../client/src/data/product_ranking_v3.json');
    
    const scenariosData = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'));
    const rankingData = JSON.parse(fs.readFileSync(rankingPath, 'utf-8'));
    
    return { scenarios: scenariosData, ranking: rankingData };
  } catch (error) {
    console.error('Error loading data:', error);
    process.exit(1);
  }
}

async function migrateProducts(scenarios, ranking) {
  console.log('Starting migration...');
  
  // Get unique products
  const uniqueProducts = new Map();
  
  scenarios.forEach(scenario => {
    if (!uniqueProducts.has(scenario.item_name)) {
      const rankInfo = ranking.find(r => r.item_name === scenario.item_name);
      uniqueProducts.set(scenario.item_name, {
        name: scenario.item_name,
        type: scenario.item_type,
        original_price: scenario.original_price,
        selling_price: scenario.selling_price,
        rank_info: rankInfo
      });
    }
  });
  
  console.log(`Found ${uniqueProducts.size} unique products`);
  
  // Insert products
  const products = [];
  for (const [name, data] of uniqueProducts) {
    const { data: insertedProduct, error } = await supabase
      .from('products')
      .insert({
        name: data.name,
        type: data.type,
        original_price: data.original_price,
      })
      .select();
    
    if (error) {
      console.error(`Error inserting product ${name}:`, error);
      continue;
    }
    
    products.push({
      id: insertedProduct[0].id,
      name: data.name,
      data: data
    });
    
    console.log(`✓ Inserted product: ${name}`);
  }
  
  // Insert scenarios
  let scenarioCount = 0;
  for (const product of products) {
    const productScenarios = scenarios.filter(s => s.item_name === product.name);
    
    const scenarioRows = productScenarios.map(scenario => ({
      product_id: product.id,
      cpm: scenario.cpm,
      cpm_label: scenario.cpm_label,
      ctr: scenario.ctr,
      ctr_label: scenario.ctr_label,
      cvr: scenario.cvr,
      cvr_label: scenario.cvr_label,
      basket_size: scenario.basket_size,
      basket_label: scenario.basket_label,
      aov: scenario.aov,
      revenue_per_order: scenario.revenue_per_order,
      cpa_dashboard: scenario.cpa_dashboard,
      cpa_delivered: scenario.cpa_delivered,
      cogs: scenario.cogs_per_order,
      net_profit_per_order: scenario.net_profit_per_order,
      roas: scenario.roas,
    }));
    
    const { error } = await supabase
      .from('scenarios')
      .insert(scenarioRows);
    
    if (error) {
      console.error(`Error inserting scenarios for ${product.name}:`, error);
      continue;
    }
    
    scenarioCount += scenarioRows.length;
    console.log(`✓ Inserted ${scenarioRows.length} scenarios for ${product.name}`);
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`- Products: ${products.length}`);
  console.log(`- Scenarios: ${scenarioCount}`);
}

async function main() {
  const { scenarios, ranking } = await loadData();
  await migrateProducts(scenarios, ranking);
}

main().catch(console.error);
