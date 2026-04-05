export interface SimulationItem {
  item_name: string;
  item_type: 'product' | 'bundle';
  selling_price: number;
  original_price: number;
  audience: '250k' | '500k' | '1M';
  cpm: number;
  cpc: number;
  ctr: number;
  cvr: number;
  cpa_dashboard: number;
  cpa_delivered: number;
  aov: number;
  roas: number;
  delivered_roas: number;
  profit_per_order: number;
  margin: number;
  revenue_per_order: number;
}

// Import the generated simulation data
import allItemsSimulationData from './allItemsSimulation.json';

export const allScenarios: SimulationItem[] = allItemsSimulationData as SimulationItem[];

// Get unique items (products and bundles)
export const allItems = Array.from(
  new Map(
    allScenarios.map(item => [item.item_name, item])
  ).values()
);

// Get products only
export const products = allItems.filter(item => item.item_type === 'product');

// Get bundles only
export const bundles = allItems.filter(item => item.item_type === 'bundle');

// Get scenarios for a specific item
export function getScenariosForItem(itemName: string): SimulationItem[] {
  return allScenarios.filter(s => s.item_name === itemName);
}

// Get best performing items by ROAS for a specific audience
export function getTopPerformers(audience: '250k' | '500k' | '1M', limit: number = 5): SimulationItem[] {
  return allScenarios
    .filter(s => s.audience === audience)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, limit);
}

// Get items by type
export function getItemsByType(type: 'product' | 'bundle', audience?: '250k' | '500k' | '1M') {
  let filtered = allScenarios.filter(s => s.item_type === type);
  if (audience) {
    filtered = filtered.filter(s => s.audience === audience);
  }
  return Array.from(
    new Map(
      filtered.map(item => [item.item_name, item])
    ).values()
  );
}

// Calculate statistics for a specific audience
export function getAudienceStats(audience: '250k' | '500k' | '1M') {
  const items = allScenarios.filter(s => s.audience === audience);
  
  return {
    totalItems: items.length,
    avgCPA: Math.round(items.reduce((sum, i) => sum + i.cpa_dashboard, 0) / items.length),
    avgROAS: Math.round((items.reduce((sum, i) => sum + i.roas, 0) / items.length) * 100) / 100,
    avgMargin: Math.round((items.reduce((sum, i) => sum + i.margin, 0) / items.length) * 10) / 10,
    avgProfit: Math.round(items.reduce((sum, i) => sum + i.profit_per_order, 0) / items.length),
    bestROAS: Math.max(...items.map(i => i.roas)),
    lowestCPA: Math.min(...items.map(i => i.cpa_dashboard)),
  };
}
