import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllProducts,
  fetchProductScenarios,
  fetchAllScenarios,
  addProduct,
  updateProduct,
  deleteProduct,
  Product,
  Scenario,
} from '@/lib/supabaseService';

export function useSupabaseProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all products and scenarios on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [productsData, scenariosData] = await Promise.all([
        fetchAllProducts(),
        fetchAllScenarios(),
      ]);

      setProducts(productsData);
      setScenarios(scenariosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddProduct = useCallback(
    async (
      name: string,
      type: 'product' | 'bundle',
      originalPrice: number,
      discountTwoItems?: number,
      discountThreeItems?: number,
      bundleDiscount?: number
    ) => {
      try {
        const result = await addProduct(
          name,
          type,
          originalPrice,
          discountTwoItems,
          discountThreeItems,
          bundleDiscount
        );

        if (result) {
          setProducts([...products, result.product]);
          setScenarios([...scenarios, ...result.scenarios]);
          return true;
        }
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error adding product');
        return false;
      }
    },
    [products, scenarios]
  );

  const handleUpdateProduct = useCallback(
    async (productId: string, updates: Partial<Product>) => {
      try {
        const success = await updateProduct(productId, updates);

        if (success) {
          // Update local state
          setProducts(products.map(p => (p.id === productId ? { ...p, ...updates } : p)));

          // Reload scenarios for this product
          const newScenarios = await fetchProductScenarios(productId);
          setScenarios(scenarios.filter(s => s.product_id !== productId).concat(newScenarios));
          return true;
        }
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error updating product');
        return false;
      }
    },
    [products, scenarios]
  );

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      try {
        const success = await deleteProduct(productId);

        if (success) {
          setProducts(products.filter(p => p.id !== productId));
          setScenarios(scenarios.filter(s => s.product_id !== productId));
          return true;
        }
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error deleting product');
        return false;
      }
    },
    [products, scenarios]
  );

  const getProductScenarios = useCallback(
    (productId: string) => scenarios.filter(s => s.product_id === productId),
    [scenarios]
  );

  return {
    products,
    scenarios,
    loading,
    error,
    loadData,
    addProduct: handleAddProduct,
    updateProduct: handleUpdateProduct,
    deleteProduct: handleDeleteProduct,
    getProductScenarios,
  };
}
