import allScenariosData from './all_scenarios_v3.json';
import productRankingData from './product_ranking_v3.json';

export interface Scenario {
  item_name: string;
  item_type: string;
  selling_price: number;
  original_price: number;

  // Scenario params
  cpm_label: string;
  cpm: number;
  ctr_label: string;
  ctr: number;
  cvr_label: string;
  cvr: number;
  basket_label: string;
  basket_size: number;

  // Ad metrics
  impressions: number;
  clicks: number;
  cpc: number;

  // Orders
  total_orders: number;
  cpa_dashboard: number;
  total_delivered: number;
  cpa_delivered: number;

  // Revenue
  aov: number;
  avg_items: number;
  revenue_per_order: number;
  cogs_per_order: number;
  shipping: number;

  // Profitability
  gross_profit_per_order: number;
  max_cpa_allowed: number;
  net_profit_per_order: number;
  roas: number;
  status: string;

  // Totals
  total_revenue: number;
  total_profit: number;
}

export interface ProductRanking {
  rank: number;
  item_name: string;
  item_type: string;
  selling_price: number;
  original_price: number;

  // Revenue metrics
  revenue_median: number;
  revenue_min: number;
  revenue_max: number;

  // Profit metrics
  profit_median: number;
  profit_min: number;
  profit_max: number;

  // ROAS metrics
  roas_median: number;
  roas_min: number;
  roas_max: number;

  // CPA metrics
  cpa_dashboard_median: number;
  cpa_delivered_median: number;

  // Max CPA
  max_cpa_allowed: number;

  // Profitability
  profit_scenarios: number;
  loss_scenarios: number;
  profitability_rate: number;

  // Best/Worst
  best_scenario: string;
  best_profit: number;
  best_roas: number;
  worst_scenario: string;
  worst_profit: number;
  worst_roas: number;
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
  medianProfit: calculateMedian(allScenarios.map(s => s.net_profit_per_order)),
  medianRevenue: calculateMedian(allScenarios.map(s => s.revenue_per_order)),
  medianRoas: calculateMedian(allScenarios.map(s => s.roas)),
  profitableScenarios: allScenarios.filter(s => s.status === 'ربح').length,
  lossScenarios: allScenarios.filter(s => s.status === 'خسارة').length,
  profitabilityRate: (allScenarios.filter(s => s.status === 'ربح').length / allScenarios.length) * 100,
};
