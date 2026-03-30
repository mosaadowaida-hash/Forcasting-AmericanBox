// Comprehensive simulation data with 144 scenarios per product
import allScenariosRaw from './allScenariosComprehensive.json';
import rankingRaw from './productRankingWithResearch.json';

export interface Scenario {
  item_name: string;
  item_type: string;
  selling_price: number;
  base_margin: number;
  actual_margin: number;
  cpm: number;
  ctr: number;
  cvr: number;
  basket_multiplier: number;
  cpc: number;
  cpa_dashboard: number;
  cpa_delivered: number;
  aov: number;
  revenue_per_order: number;  // العائد (Revenue)
  roas: number;
  delivered_roas: number;
  profit_per_order: number;  // الربح الفعلي (Profit)
  profit_margin: number;  // نسبة الربح
  max_cpa_allowed: number;
  break_even_cpa: number;
  status: 'Profit' | 'Break Even' | 'Loss';
  cpm_scenario: string;
  ctr_scenario: string;
  cvr_scenario: string;
  basket_scenario: string;
}

export interface ProductRanking {
  rank: number;
  product_name: string;
  item_type: string;
  selling_price: number;
  avg_profit: number;
  median_profit: number;
  max_profit: number;
  min_profit: number;
  avg_cpa: number;
  median_cpa: number;
  min_cpa: number;
  max_cpa: number;
  avg_roas: number;
  median_roas: number;
  max_roas: number;
  min_roas: number;
  profitable_scenarios: number;
  break_even_scenarios: number;
  loss_scenarios: number;
  total_scenarios: number;
  profitability_rate: number;
  best_scenario: any;
  worst_scenario: any;
  best_roas_scenario: any;
  lowest_cpa_scenario: any;
  likely_scenario: any;
  market_category: string;
  market_research: any;
}

export const allScenarios: Scenario[] = allScenariosRaw as Scenario[];
export const productRanking: ProductRanking[] = rankingRaw as ProductRanking[];

// Helper functions
export function getProductScenarios(productName: string): Scenario[] {
  return allScenarios.filter(s => s.item_name === productName);
}

export function getScenariosByStatus(status: 'Profit' | 'Break Even' | 'Loss'): Scenario[] {
  return allScenarios.filter(s => s.status === status);
}

export function getTopProfitableProducts(limit: number = 10): ProductRanking[] {
  return productRanking.slice(0, limit);
}

export function getBottomProfitableProducts(limit: number = 10): ProductRanking[] {
  return productRanking.slice(-limit).reverse();
}

export function getProductsByCategory(category: string): ProductRanking[] {
  return productRanking.filter(p => p.market_category === category);
}

export function getScenariosByFilters(filters: {
  cpmScenario?: string;
  ctrScenario?: string;
  cvrScenario?: string;
  basketScenario?: string;
  status?: string;
}): Scenario[] {
  return allScenarios.filter(s => {
    if (filters.cpmScenario && s.cpm_scenario !== filters.cpmScenario) return false;
    if (filters.ctrScenario && s.ctr_scenario !== filters.ctrScenario) return false;
    if (filters.cvrScenario && s.cvr_scenario !== filters.cvrScenario) return false;
    if (filters.basketScenario && s.basket_scenario !== filters.basketScenario) return false;
    if (filters.status && s.status !== filters.status) return false;
    return true;
  });
}

export function getUniqueCPMScenarios(): string[] {
  return Array.from(new Set(allScenarios.map(s => s.cpm_scenario)));
}

export function getUniqueCTRScenarios(): string[] {
  return Array.from(new Set(allScenarios.map(s => s.ctr_scenario)));
}

export function getUniqueCVRScenarios(): string[] {
  return Array.from(new Set(allScenarios.map(s => s.cvr_scenario)));
}

export function getUniqueBasketScenarios(): string[] {
  return Array.from(new Set(allScenarios.map(s => s.basket_scenario)));
}

export function getMarketCategories(): string[] {
  return Array.from(new Set(productRanking.map(p => p.market_category)));
}

export function getStatistics() {
  const totalScenarios = allScenarios.length;
  const profitScenarios = allScenarios.filter(s => s.status === 'Profit').length;
  const breakEvenScenarios = allScenarios.filter(s => s.status === 'Break Even').length;
  const lossScenarios = allScenarios.filter(s => s.status === 'Loss').length;

  const avgProfit = allScenarios.reduce((sum, s) => sum + s.profit_per_order, 0) / totalScenarios;
  const avgROAS = allScenarios.reduce((sum, s) => sum + s.roas, 0) / totalScenarios;
  const avgCPA = allScenarios.reduce((sum, s) => sum + s.cpa_dashboard, 0) / totalScenarios;

  return {
    totalScenarios,
    profitScenarios,
    breakEvenScenarios,
    lossScenarios,
    profitabilityRate: ((profitScenarios + breakEvenScenarios) / totalScenarios) * 100,
    avgProfit: Math.round(avgProfit),
    avgROAS: Math.round(avgROAS * 100) / 100,
    avgCPA: Math.round(avgCPA),
  };
}
