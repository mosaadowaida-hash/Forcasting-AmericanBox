export interface SimulationScenario {
  product: string;
  price: number;
  audience: "250k" | "500k" | "1M";
  cpm: number;
  cpc: number;
  ctr: number;
  cvr: number;
  cpaDashboard: number;
  cpaDelivered: number;
  aov: number;
  revenuePerOrder: number;
  profitPerOrder: number;
  roas: number;
  deliveredRoas: number;
  margin: number;
}

export const products = [
  { name: "Nordic Naturals Children's DHA 473ml", price: 3750 },
  { name: "Vitamin D3 + K2", price: 3750 },
  { name: "Viviscal Hair Growth Supplement", price: 3750 },
  { name: "Nutricost Lithium Orotate", price: 1950 },
  { name: "Nature's Way Vitex Fruit", price: 1750 },
  { name: "NaturesPlus Hema-Plex", price: 2150 },
  { name: "Solgar Chelated Copper 100 cap", price: 1800 },
  { name: "Solgar Coq-10 200 Mg", price: 3250 },
  { name: "Vitamatic Berberine 500MG 60 capsules", price: 1550 },
  { name: "Champix 1mg", price: 3900 },
  { name: "Double Wood Magnesium Glycinate", price: 2750 },
  { name: "Sports Research MCT Oil 946ml", price: 5550 },
  { name: "Nature's Way Organic MCT Oil", price: 3900 },
  { name: "Kids Smart Vita Gummies Brain Booster", price: 1200 },
  { name: "Nature's Bounty Advanced Hair, Skin & Nails", price: 4450 },
  { name: "Nature's Bounty Ginseng Complex", price: 1900 },
  { name: "Nature's Bounty Ginkgo Biloba", price: 2500 },
  { name: "Nature's Way Chlorofresh 60 caps", price: 2100 },
  { name: "Nature's Way Liquid Chlorofresh", price: 2150 },
  { name: "NOW Foods Liquid Chlorophyll 473 ml", price: 2450 },
  { name: "Solgar Zinc Picolinate", price: 1850 },
  { name: "EVL Evlution nutrition LeanMode", price: 2900 },
  { name: "Now Mct oil", price: 3550 },
  { name: "Carlson Chelated Zinc", price: 1850 },
  { name: "Solgar chelated zinc", price: 1850 },
  { name: "Mary Ruth's Liquid Morning", price: 4500 },
  { name: "Nature's Way D3 1000 120", price: 1500 },
  { name: "Nature's way whole thallus KELP 180 capsule", price: 1200 },
  { name: "Nature's way whole thallus KELP 100 capsules", price: 1200 },
];

function calculateSimulation(productName: string, basePrice: number, audience: "250k" | "500k" | "1M", cpmVal: number): SimulationScenario {
  const CTR = 0.015;
  const SHIPPING_THRESHOLD = 3000;
  const SHIPPING_COST = 100;

  // CVR based on price
  let cvr: number;
  if (basePrice > 4000) {
    cvr = 0.006; // High ticket
  } else if (basePrice > 2000) {
    cvr = 0.010; // Medium ticket
  } else {
    cvr = 0.014; // Low ticket
  }

  // CPM, CPC, CPA Dashboard
  const cpc = cpmVal / (1000 * CTR);
  const cpaDashboard = cpc / cvr;

  // Orders Mix & Upsell
  const p1 = 0.7, p2 = 0.2, p3 = 0.1;
  const price1 = basePrice;
  const price2 = basePrice * 2 * 0.9;
  const price3 = basePrice * 3 * 0.85;

  // AOV Calculation
  const aov = p1 * price1 + p2 * price2 + p3 * price3;

  // Payment Mix & Delivery
  const weightedDelivery = (0.65 * 0.85) + (0.20 * 0.95) + (0.15 * 0.95);

  // Effective Revenue (after discounts)
  const avgPaymentDiscount = (0.20 * 0.05) + (0.15 * 0.03);
  const effectiveAov = aov * (1 - avgPaymentDiscount);

  // Delivered AOV
  const cpaDelivered = cpaDashboard / weightedDelivery;

  // ROAS
  const roas = effectiveAov / cpaDashboard;
  const deliveredRoas = (effectiveAov * weightedDelivery) / cpaDashboard;

  // Profit
  const cogs = basePrice * 0.4 * (p1 * 1 + p2 * 2 + p3 * 3);
  const shippingPaidByCustomer = effectiveAov < SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
  const shippingCostToSeller = SHIPPING_COST;

  const netRevenue = (effectiveAov + shippingPaidByCustomer) * weightedDelivery;
  const totalCosts = (cogs + shippingCostToSeller) * weightedDelivery + cpaDashboard;

  const profit = netRevenue - totalCosts;
  const profitMargin = netRevenue > 0 ? profit / netRevenue : 0;

  return {
    product: productName,
    price: basePrice,
    audience,
    cpm: cpmVal,
    cpc: Math.round(cpc * 100) / 100,
    ctr: CTR,
    cvr,
    cpaDashboard: Math.round(cpaDashboard * 100) / 100,
    cpaDelivered: Math.round(cpaDelivered * 100) / 100,
    aov: Math.round(effectiveAov * 100) / 100,
    revenuePerOrder: Math.round(netRevenue * 100) / 100,
    profitPerOrder: Math.round(profit * 100) / 100,
    roas: Math.round(roas * 100) / 100,
    deliveredRoas: Math.round(deliveredRoas * 100) / 100,
    margin: Math.round(profitMargin * 10000) / 100,
  };
}

export function generateAllScenarios(): SimulationScenario[] {
  const scenarios = [
    { audience: "250k" as const, cpm: 70 },
    { audience: "500k" as const, cpm: 47.5 },
    { audience: "1M" as const, cpm: 32.5 },
  ];

  const allResults: SimulationScenario[] = [];

  for (const product of products) {
    for (const scenario of scenarios) {
      const result = calculateSimulation(product.name, product.price, scenario.audience, scenario.cpm);
      allResults.push(result);
    }
  }

  return allResults;
}

export const allScenarios = generateAllScenarios();
