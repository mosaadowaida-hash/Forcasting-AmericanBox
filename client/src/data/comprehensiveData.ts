import allScenariosData from './all_scenarios_v3.json';
import productRankingData from './product_ranking_v3.json';

export interface Scenario {
  item_name: string;
  item_type: string;
  selling_price: number;
  margin_pct: number;
  cpm_scenario: string;
  cpm: number;
  audience_size: number;
  ctr_scenario: string;
  ctr_pct: number;
  cvr_scenario: string;
  cvr_pct: number;
  basket_scenario: string;
  avg_items: number;
  impressions: number;
  clicks: number;
  conversions: number;
  delivered_orders: number;
  ad_spend: number;
  cpa_dashboard: number;
  cpa_delivered: number;
  aov: number;
  revenue_per_order: number;
  cogs_per_order: number;
  shipping_per_order: number;
  profit_per_order: number;
  profit_margin_pct: number;
  max_cpa_allowed: number;
  roas: number;
  total_revenue: number;
  total_profit: number;
  status: 'Profit' | 'Break Even' | 'Loss';
}

export interface ProductRanking {
  rank: number;
  item_name: string;
  item_type: string;
  selling_price: number;
  margin_pct: number;
  median_revenue: number;
  median_profit: number;
  median_roas: number;
  profitability_rate: number;
  profit_count: number;
  loss_count: number;
  total_scenarios: number;
}

export const allScenarios: Scenario[] = allScenariosData as Scenario[];
export const productRanking: ProductRanking[] = productRankingData as ProductRanking[];

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export const overallStats = {
  totalScenarios: allScenarios.length,
  totalProducts: new Set(allScenarios.map(s => s.item_name)).size,
  medianProfit: calculateMedian(allScenarios.map(s => s.profit_per_order)),
  medianRoas: calculateMedian(allScenarios.map(s => s.roas)),
  profitableScenarios: allScenarios.filter(s => s.profit_per_order > 0).length,
  profitabilityRate: (allScenarios.filter(s => s.profit_per_order > 0).length / allScenarios.length) * 100,
};
