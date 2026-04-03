// Constants for calculations
export const CONFIRMATION_RATES = {
  COD: 0.65,
  DIRECT: 0.99,
  CARD: 0.99,
};

export const DELIVERY_RATES = {
  COD: 0.85,
  DIRECT: 0.95,
  CARD: 0.95,
};

// Weighted average confirmation and delivery rates
export const EFFECTIVE_CONFIRMATION_RATE = 0.7690; // 76.90%
export const EFFECTIVE_DELIVERY_RATE = 0.6883; // 68.83%

export const COGS_PERCENTAGE = 0.65; // 65% of original price
export const SHIPPING_COST = 30; // EGP per order

// Upsell Mix: 70% single, 20% double (-10% discount), 10% triple (-15% discount)
export const UPSELL_MIX = {
  single: { percentage: 0.70, discount: 0 },
  double: { percentage: 0.20, discount: 0.10 },
  triple: { percentage: 0.10, discount: 0.15 },
};

export interface ScenarioInput {
  originalPrice: number;
  type: 'product' | 'bundle';
  discountTwoItems?: number; // For products
  discountThreeItems?: number; // For products
  bundleDiscount?: number; // For bundles
  cpm: number;
  ctr: number;
  cvr: number;
  basketSize: number;
}

export interface CalculatedScenario {
  aov: number;
  revenue_per_order: number;
  cpa_dashboard: number;
  cpa_delivered: number;
  cogs: number;
  net_profit_per_order: number;
  roas: number;
}

/**
 * Calculate AOV (Average Order Value) with upsell mix
 */
export function calculateAOV(
  originalPrice: number,
  type: 'product' | 'bundle',
  discountTwoItems?: number,
  discountThreeItems?: number,
  bundleDiscount?: number
): number {
  let basePrice = originalPrice;

  // Apply bundle discount if it's a bundle
  if (type === 'bundle' && bundleDiscount) {
    basePrice = originalPrice * (1 - bundleDiscount / 100);
  }

  // Calculate AOV with upsell mix
  const singlePrice = basePrice;
  const doublePrice = basePrice * 2 * (1 - (discountTwoItems || 0) / 100);
  const triplePrice = basePrice * 3 * (1 - (discountThreeItems || 0) / 100);

  const aov =
    singlePrice * UPSELL_MIX.single.percentage +
    doublePrice * UPSELL_MIX.double.percentage +
    triplePrice * UPSELL_MIX.triple.percentage;

  return aov;
}

/**
 * Calculate all scenario metrics
 */
export function calculateScenario(input: ScenarioInput): CalculatedScenario {
  const aov = calculateAOV(
    input.originalPrice,
    input.type,
    input.discountTwoItems,
    input.discountThreeItems,
    input.bundleDiscount
  );

  // Revenue per delivered order
  const revenue_per_order = aov * EFFECTIVE_DELIVERY_RATE;

  // Ad cost per order (CPM * CTR * CVR * 1000 / 1000 = CPM * CTR * CVR)
  const ad_cost_per_order = (input.cpm * input.ctr * input.cvr) / 10000;

  // CPA Dashboard (cost per action on dashboard)
  const cpa_dashboard = ad_cost_per_order / (input.ctr * input.cvr);

  // CPA Delivered (cost per actual delivered order)
  const cpa_delivered = ad_cost_per_order / (input.ctr * input.cvr * EFFECTIVE_DELIVERY_RATE);

  // COGS
  const cogs = input.originalPrice * COGS_PERCENTAGE;

  // Net profit per order = Revenue - COGS - Shipping - Ad Cost
  const net_profit_per_order = revenue_per_order - cogs - SHIPPING_COST - ad_cost_per_order;

  // ROAS (Return on Ad Spend)
  const roas = ad_cost_per_order > 0 ? revenue_per_order / ad_cost_per_order : 0;

  return {
    aov,
    revenue_per_order,
    cpa_dashboard,
    cpa_delivered,
    cogs,
    net_profit_per_order,
    roas,
  };
}

/**
 * Generate all 144 scenarios for a product
 */
export function generateAllScenarios(
  productId: string,
  originalPrice: number,
  type: 'product' | 'bundle',
  discountTwoItems?: number,
  discountThreeItems?: number,
  bundleDiscount?: number
): Array<{
  product_id: string;
  cpm: number;
  cpm_label: string;
  ctr: number;
  ctr_label: string;
  cvr: number;
  cvr_label: string;
  basket_size: number;
  basket_label: string;
  aov: number;
  revenue_per_order: number;
  cpa_dashboard: number;
  cpa_delivered: number;
  cogs: number;
  net_profit_per_order: number;
  roas: number;
}> {
  const cpmLevels = [
    { value: 32.5, label: 'Low (32.5)' },
    { value: 47.5, label: 'Medium (47.5)' },
    { value: 70, label: 'High (70)' },
  ];

  const ctrLevels = [
    { value: 0.01, label: '1%' },
    { value: 0.0125, label: '1.25%' },
    { value: 0.015, label: '1.5%' },
    { value: 0.0175, label: '1.75%' },
  ];

  const cvrLevels = [
    { value: 0.005, label: '0.5%' },
    { value: 0.01, label: '1%' },
    { value: 0.015, label: '1.5%' },
  ];

  const basketSizes = [
    { value: 1.0, label: '1.0x' },
    { value: 1.1, label: '1.1x' },
    { value: 1.2, label: '1.2x' },
    { value: 1.3, label: '1.3x' },
  ];

  const scenarios = [];

  for (const cpmLevel of cpmLevels) {
    for (const ctrLevel of ctrLevels) {
      for (const cvrLevel of cvrLevels) {
        for (const basketSize of basketSizes) {
          const calculated = calculateScenario({
            originalPrice,
            type,
            discountTwoItems,
            discountThreeItems,
            bundleDiscount,
            cpm: cpmLevel.value,
            ctr: ctrLevel.value,
            cvr: cvrLevel.value,
            basketSize: basketSize.value,
          });

          scenarios.push({
            product_id: productId,
            cpm: cpmLevel.value,
            cpm_label: cpmLevel.label,
            ctr: ctrLevel.value,
            ctr_label: ctrLevel.label,
            cvr: cvrLevel.value,
            cvr_label: cvrLevel.label,
            basket_size: basketSize.value,
            basket_label: basketSize.label,
            ...calculated,
          });
        }
      }
    }
  }

  return scenarios;
}
