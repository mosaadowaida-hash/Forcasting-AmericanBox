import allScenariosData from './all_scenarios_corrected.json';
import productRankingData from './product_ranking_corrected.json';

export interface Scenario {
  item_name: string;
  selling_price: number;
  actual_margin_pct: number;
  cpm_scenario: string;
  cpm: number;
  audience_size: number;
  ctr_scenario: string;
  ctr_pct: number;
  cvr_scenario: string;
  cvr_pct: number;
  basket_scenario: string;
  basket_size: number;
  impressions: number;
  clicks: number;
  conversions: number;
  delivered_orders: number;
  delivery_rate: number;
  ad_spend: number;
  cpa_dashboard: number;
  cpa_delivered: number;
  aov: number;
  revenue: number;
  cogs: number;
  shipping: number;
  profit: number;
  profit_margin_pct: number;
  roas: number;
  status: 'Profit' | 'Break Even' | 'Loss';
}

export interface ProductRanking {
  rank: number;
  item_name: string;
  selling_price: number;
  actual_margin_pct: number;
  median_revenue: number;
  median_profit: number;
  median_roas: number;
  profitability_rate: number;
  profit_count: number;
  total_scenarios: number;
}

export const allScenarios: Scenario[] = allScenariosData as Scenario[];
export const productRanking: ProductRanking[] = productRankingData as ProductRanking[];

// Calculate overall statistics
export const overallStats = {
  totalScenarios: allScenarios.length,
  totalProducts: new Set(allScenarios.map(s => s.item_name)).size,
  medianRevenue: calculateMedian(allScenarios.map(s => s.revenue)),
  medianProfit: calculateMedian(allScenarios.map(s => s.profit)),
  medianRoas: calculateMedian(allScenarios.map(s => s.roas)),
  profitableScenarios: allScenarios.filter(s => s.profit > 0).length,
  profitabilityRate: (allScenarios.filter(s => s.profit > 0).length / allScenarios.length) * 100,
  deliveryRate: allScenarios[0]?.delivery_rate || 0,
};

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
