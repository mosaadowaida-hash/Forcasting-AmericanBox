import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface Product {
  id: string;
  name: string;
  type: 'product' | 'bundle';
  original_price: number;
  discount_two_items?: number;
  discount_three_items?: number;
  bundle_discount?: number;
  created_at: string;
}

export interface Scenario {
  id: string;
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
}

const CPM_LEVELS = [
  { value: 2, label: 'Low' },
  { value: 4, label: 'Medium' },
  { value: 6, label: 'High' },
];

const CTR_LEVELS = [
  { value: 0.01, label: '1%' },
  { value: 0.0125, label: '1.25%' },
  { value: 0.015, label: '1.5%' },
  { value: 0.0175, label: '1.75%' },
];

const CVR_LEVELS = [
  { value: 0.005, label: '0.5%' },
  { value: 0.01, label: '1%' },
  { value: 0.015, label: '1.5%' },
];

const BASKET_LEVELS = [
  { value: 1.0, label: '1.0x' },
  { value: 1.1, label: '1.1x' },
  { value: 1.2, label: '1.2x' },
  { value: 1.3, label: '1.3x' },
];

const CONFIRMATION_RATE = 0.769;
const DELIVERY_RATE = 0.6883;
const COGS_PERCENTAGE = 0.65;
const SHIPPING_COST = 30;

function calculateAOV(
  originalPrice: number,
  type: 'product' | 'bundle',
  discountTwoItems?: number,
  discountThreeItems?: number,
  bundleDiscount?: number
): number {
  let basePrice = originalPrice;

  if (type === 'bundle' && bundleDiscount) {
    basePrice = originalPrice * (1 - bundleDiscount / 100);
  }

  return basePrice;
}

function generateScenarios(
  productId: string,
  originalPrice: number,
  type: 'product' | 'bundle',
  discountTwoItems?: number,
  discountThreeItems?: number,
  bundleDiscount?: number
): Scenario[] {
  const scenarios: Scenario[] = [];

  for (const cpmLevel of CPM_LEVELS) {
    for (const ctrLevel of CTR_LEVELS) {
      for (const cvrLevel of CVR_LEVELS) {
        for (const basketSize of BASKET_LEVELS) {
          const baseAOV = calculateAOV(originalPrice, type, discountTwoItems, discountThreeItems, bundleDiscount);
          const aov = baseAOV * basketSize.value;
          
          const impressions = 1000000 / cpmLevel.value;
          const clicks = impressions * ctrLevel.value;
          const conversions = clicks * cvrLevel.value;
          const orders = conversions * CONFIRMATION_RATE;
          const delivered_orders = orders * DELIVERY_RATE;
          
          const ad_cost = (cpmLevel.value / 1000) * impressions;
          const cpa_dashboard = orders > 0 ? ad_cost / orders : 0;
          const cpa_delivered = delivered_orders > 0 ? ad_cost / delivered_orders : 0;
          
          const revenue_per_order = aov;
          const revenue_per_delivered = revenue_per_order * DELIVERY_RATE;
          
          const cogs_per_order = originalPrice * COGS_PERCENTAGE;
          const ad_cost_per_delivered = delivered_orders > 0 ? ad_cost / delivered_orders : 0;
          const net_profit_per_order = revenue_per_delivered - cogs_per_order - SHIPPING_COST - ad_cost_per_delivered;
          const roas = ad_cost_per_delivered > 0 ? revenue_per_delivered / ad_cost_per_delivered : 0;

          scenarios.push({
            id: `${productId}-${cpmLevel.value}-${ctrLevel.value}-${cvrLevel.value}-${basketSize.value}`,
            product_id: productId,
            cpm: cpmLevel.value,
            cpm_label: cpmLevel.label,
            ctr: ctrLevel.value,
            ctr_label: ctrLevel.label,
            cvr: cvrLevel.value,
            cvr_label: cvrLevel.label,
            basket_size: basketSize.value,
            basket_label: basketSize.label,
            aov: Math.round(aov * 100) / 100,
            revenue_per_order: Math.round(revenue_per_order * 100) / 100,
            cpa_dashboard: Math.round(cpa_dashboard * 100) / 100,
            cpa_delivered: Math.round(cpa_delivered * 100) / 100,
            cogs: Math.round(cogs_per_order * 100) / 100,
            net_profit_per_order: Math.round(net_profit_per_order * 100) / 100,
            roas: Math.round(roas * 100) / 100,
          });
        }
      }
    }
  }

  return scenarios;
}

interface LocalProductsContextType {
  products: Product[];
  scenarios: Scenario[];
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  isLoaded: boolean;
}

const LocalProductsContext = createContext<LocalProductsContextType | undefined>(undefined);

export function LocalProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('custom_products');
    const savedScenarios = localStorage.getItem('custom_scenarios');

    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
    if (savedScenarios) {
      setScenarios(JSON.parse(savedScenarios));
    }
    setIsLoaded(true);
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id' | 'created_at'>) => {
    const id = `custom-${Date.now()}`;
    const newProduct: Product = {
      ...product,
      id,
      created_at: new Date().toISOString(),
    };

    const newScenarios = generateScenarios(
      id,
      product.original_price,
      product.type,
      product.discount_two_items,
      product.discount_three_items,
      product.bundle_discount
    );

    setProducts(prev => {
      const updated = [...prev, newProduct];
      localStorage.setItem('custom_products', JSON.stringify(updated));
      return updated;
    });

    setScenarios(prev => {
      const updated = [...prev, ...newScenarios];
      localStorage.setItem('custom_scenarios', JSON.stringify(updated));
      return updated;
    });

    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => {
      const product = prev.find(p => p.id === id);
      if (!product) return prev;

      const updated: Product = { ...product, ...updates };
      const newPrev = prev.map(p => (p.id === id ? updated : p));
      localStorage.setItem('custom_products', JSON.stringify(newPrev));

      // Regenerate scenarios if price or discounts changed
      if (updates.original_price || updates.discount_two_items || updates.discount_three_items || updates.bundle_discount) {
        const newScenarios = generateScenarios(
          id,
          updates.original_price ?? product.original_price,
          updates.type ?? product.type,
          updates.discount_two_items ?? product.discount_two_items,
          updates.discount_three_items ?? product.discount_three_items,
          updates.bundle_discount ?? product.bundle_discount
        );

        setScenarios(prevScenarios => {
          const filtered = prevScenarios.filter(s => s.product_id !== id);
          const updated = [...filtered, ...newScenarios];
          localStorage.setItem('custom_scenarios', JSON.stringify(updated));
          return updated;
        });
      }

      return newPrev;
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('custom_products', JSON.stringify(updated));
      return updated;
    });

    setScenarios(prev => {
      const updated = prev.filter(s => s.product_id !== id);
      localStorage.setItem('custom_scenarios', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <LocalProductsContext.Provider value={{ products, scenarios, addProduct, updateProduct, deleteProduct, isLoaded }}>
      {children}
    </LocalProductsContext.Provider>
  );
}

export function useLocalProductsContext() {
  const context = useContext(LocalProductsContext);
  if (!context) {
    throw new Error('useLocalProductsContext must be used within LocalProductsProvider');
  }
  return context;
}
