import { useState, useEffect, useCallback, useMemo } from 'react';
import { allScenarios, productRanking } from '@/data/comprehensiveData';

export interface Product {
  id: string;
  name: string;
  type: 'product' | 'bundle';
  original_price: number;
  selling_price?: number;
  discount_two_items?: number;
  discount_three_items?: number;
  bundle_discount?: number;
  is_dynamic: boolean;
  created_at?: string;
}

export interface Scenario {
  id?: string;
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

export function useAllProducts() {
  const [staticProducts, setStaticProducts] = useState<Product[]>([]);
  const [dynamicProducts, setDynamicProducts] = useState<Product[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  // Initialize static products from JSON
  useEffect(() => {
    const uniqueProductNames = new Set(allScenarios.map(s => s.item_name));
    const staticProds: Product[] = Array.from(uniqueProductNames).map(name => {
      const scenario = allScenarios.find(s => s.item_name === name);
      return {
        id: `static-${name}`,
        name,
        type: scenario?.item_type === 'منتج' ? 'product' : 'bundle',
        original_price: scenario?.original_price || 0,
        selling_price: scenario?.selling_price,
        is_dynamic: false,
      };
    });
    setStaticProducts(staticProds);

    // Convert static scenarios
    const staticScenarios: Scenario[] = allScenarios.map(s => ({
      product_id: `static-${s.item_name}`,
      cpm: s.cpm,
      cpm_label: s.cpm_label,
      ctr: s.ctr,
      ctr_label: s.ctr_label,
      cvr: s.cvr,
      cvr_label: s.cvr_label,
      basket_size: s.basket_size,
      basket_label: s.basket_label,
      aov: s.aov,
      revenue_per_order: s.revenue_per_order,
      cpa_dashboard: s.cpa_dashboard,
      cpa_delivered: s.cpa_delivered,
      cogs: s.cogs_per_order,
      net_profit_per_order: s.net_profit_per_order,
      roas: s.roas,
    }));

    setScenarios(staticScenarios);
  }, []);

  // Load dynamic products from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dynamic_products');
    if (stored) {
      try {
        setDynamicProducts(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading dynamic products:', e);
      }
    }

    const storedScenarios = localStorage.getItem('dynamic_scenarios');
    if (storedScenarios) {
      try {
        const dynamicScenarios = JSON.parse(storedScenarios);
        setScenarios(prev => [...prev, ...dynamicScenarios]);
      } catch (e) {
        console.error('Error loading dynamic scenarios:', e);
      }
    }
  }, []);

  const allProducts = useMemo(() => [...staticProducts, ...dynamicProducts], [staticProducts, dynamicProducts]);

  const addProduct = useCallback((product: Omit<Product, 'id' | 'is_dynamic'>) => {
    const id = `dynamic-${Date.now()}`;
    const newProduct: Product = {
      ...product,
      id,
      is_dynamic: true,
      created_at: new Date().toISOString(),
    };

    setDynamicProducts(prev => [...prev, newProduct]);

    // Save to localStorage
    const updated = [...dynamicProducts, newProduct];
    localStorage.setItem('dynamic_products', JSON.stringify(updated));

    return newProduct;
  }, [dynamicProducts]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setDynamicProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );

    // Save to localStorage
    const updated = dynamicProducts.map(p => (p.id === id ? { ...p, ...updates } : p));
    localStorage.setItem('dynamic_products', JSON.stringify(updated));
  }, [dynamicProducts]);

  const deleteProduct = useCallback((id: string) => {
    setDynamicProducts(prev => prev.filter(p => p.id !== id));
    setScenarios(prev => prev.filter(s => s.product_id !== id));

    // Save to localStorage
    const updated = dynamicProducts.filter(p => p.id !== id);
    localStorage.setItem('dynamic_products', JSON.stringify(updated));
  }, [dynamicProducts]);

  const getProductScenarios = useCallback((productId: string) => {
    return scenarios.filter(s => s.product_id === productId);
  }, [scenarios]);

  const getProductStats = useCallback((productId: string) => {
    const productScenarios = getProductScenarios(productId);
    if (productScenarios.length === 0) return null;

    const profits = productScenarios.map(s => s.net_profit_per_order);
    const roas = productScenarios.map(s => s.roas);

    return {
      totalScenarios: productScenarios.length,
      profitableScenarios: productScenarios.filter(s => s.net_profit_per_order > 0).length,
      lossScenarios: productScenarios.filter(s => s.net_profit_per_order <= 0).length,
      profitabilityRate: (productScenarios.filter(s => s.net_profit_per_order > 0).length / productScenarios.length) * 100,
      medianProfit: calculateMedian(profits),
      medianRoas: calculateMedian(roas),
      minProfit: Math.min(...profits),
      maxProfit: Math.max(...profits),
      minRoas: Math.min(...roas),
      maxRoas: Math.max(...roas),
    };
  }, [getProductScenarios]);

  return {
    allProducts,
    staticProducts,
    dynamicProducts,
    scenarios,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductScenarios,
    getProductStats,
  };
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
