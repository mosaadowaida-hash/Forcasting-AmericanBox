import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function loadData() {
  const productsPath = path.join(__dirname, '../client/src/data/allItemsSimulation.json');
  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  return productsData;
}

function generateScenarios(product) {
  const scenarios = [];
  const cpmValues = [50, 60, 70, 80, 90];
  const ctrValues = [0.015, 0.0175, 0.02, 0.0225, 0.025];
  const cvrValues = [0.01, 0.015, 0.02, 0.025, 0.03];
  const basketSizes = [1, 1.2, 1.4, 1.6, 1.8];

  const cpmLabels = ['Low CPM (50 EGP)', 'Medium CPM (60 EGP)', 'High CPM (70 EGP)', 'Very High CPM (80 EGP)', 'Premium CPM (90 EGP)'];
  const ctrLabels = ['Poor CTR (1.5%)', 'Fair CTR (1.75%)', 'Good CTR (2%)', 'Excellent CTR (2.25%)', 'Outstanding CTR (2.5%)'];
  const cvrLabels = ['Poor CVR (1%)', 'Fair CVR (1.5%)', 'Good CVR (2%)', 'Excellent CVR (2.5%)', 'Outstanding CVR (3%)'];
  const basketLabels = ['Poor Basket (1.0)', 'Fair Basket (1.2)', 'Good Basket (1.4)', 'Excellent Basket (1.6)', 'Outstanding Basket (1.8)'];

  for (let i = 0; i < cpmValues.length; i++) {
    for (let j = 0; j < ctrValues.length; j++) {
      for (let k = 0; k < cvrValues.length; k++) {
        for (let l = 0; l < basketSizes.length; l++) {
          const cpm = cpmValues[i];
          const ctr = ctrValues[j];
          const cvr = cvrValues[k];
          const basketSize = basketSizes[l];

          const aov = product.original_price * basketSize;
          const revenuePerOrder = aov;
          const cpaDashboard = cpm / (ctr * cvr * 1000);
          const cpaDelivered = cpaDashboard * 1.15;
          const cogs = product.original_price * 0.3;
          const netProfitPerOrder = revenuePerOrder - cpaDelivered - cogs;
          const roas = revenuePerOrder / cpaDashboard;

          scenarios.push({
            id: uuidv4(),
            product_id: product.id,
            cpm,
            cpm_label: cpmLabels[i],
            ctr: ctr * 100,
            ctr_label: ctrLabels[j],
            cvr: cvr * 100,
            cvr_label: cvrLabels[k],
            basket_size: basketSize,
            basket_label: basketLabels[l],
            aov: Math.round(aov * 100) / 100,
            revenue_per_order: Math.round(revenuePerOrder * 100) / 100,
            cpa_dashboard: Math.round(cpaDashboard * 100) / 100,
            cpa_delivered: Math.round(cpaDelivered * 100) / 100,
            cogs: Math.round(cogs * 100) / 100,
            net_profit_per_order: Math.round(netProfitPerOrder * 100) / 100,
            roas: Math.round(roas * 100) / 100,
          });
        }
      }
    }
  }

  return scenarios;
}

async function migrateProducts(allData) {
  console.log('Starting migration...\n');
  
  const uniqueProducts = {};
  
  allData.forEach(item => {
    if (!uniqueProducts[item.item_name]) {
      uniqueProducts[item.item_name] = {
        id: uuidv4(),
        name: item.item_name,
        type: item.item_type || 'product',
        original_price: item.original_price || item.selling_price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  });
  
  const productsToInsert = Object.values(uniqueProducts);
  console.log(`📊 Found ${productsToInsert.length} unique products\n`);
  
  console.log('📝 Inserting products...');
  const { data: insertedProducts, error: productsError } = await supabase
    .from('products')
    .insert(productsToInsert)
    .select();
  
  if (productsError) {
    console.error('❌ Error inserting products:', productsError);
    process.exit(1);
  }
  
  console.log(`✅ Inserted ${insertedProducts.length} products\n`);
  
  console.log('🔄 Generating scenarios for each product...');
  let totalScenarios = 0;
  
  for (const product of insertedProducts) {
    const scenarios = generateScenarios(product);
    totalScenarios += scenarios.length;
    
    const batchSize = 1000;
    for (let i = 0; i < scenarios.length; i += batchSize) {
      const batch = scenarios.slice(i, i + batchSize);
      const { error: scenariosError } = await supabase
        .from('scenarios')
        .insert(batch);
      
      if (scenariosError) {
        console.error(`❌ Error inserting scenarios for ${product.name}:`, scenariosError);
        process.exit(1);
      }
    }
    
    console.log(`  ✅ Generated ${scenarios.length} scenarios for "${product.name}"`);
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`📊 Total products: ${insertedProducts.length}`);
  console.log(`📊 Total scenarios: ${totalScenarios}`);
}

async function main() {
  const allData = await loadData();
  await migrateProducts(allData);
}

main().catch(console.error);
