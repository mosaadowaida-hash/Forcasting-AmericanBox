import { createClient } from '@supabase/supabase-js';
import { generateAllScenarios } from './scenarioCalculations';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hremfdzcaysddoymvwgp.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fvRitwIcZcDkgPNsiNU4gw_ZeoV7ATE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Product {
  id: string;
  name: string;
  type: 'product' | 'bundle';
  original_price: number;
  discount_two_items?: number;
  discount_three_items?: number;
  bundle_discount?: number;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

/**
 * Fetch all products from Supabase
 */
export async function fetchAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Fetch scenarios for a specific product
 */
export async function fetchProductScenarios(productId: string): Promise<Scenario[]> {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('product_id', productId)
      .order('cpm', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }
}

/**
 * Add a new product and generate its scenarios
 */
export async function addProduct(
  name: string,
  type: 'product' | 'bundle',
  originalPrice: number,
  discountTwoItems?: number,
  discountThreeItems?: number,
  bundleDiscount?: number
): Promise<{ product: Product; scenarios: Scenario[] } | null> {
  try {
    // Insert product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert([
        {
          name,
          type,
          original_price: originalPrice,
          discount_two_items: discountTwoItems,
          discount_three_items: discountThreeItems,
          bundle_discount: bundleDiscount,
        },
      ])
      .select()
      .single();

    if (productError) throw productError;

    // Generate and insert scenarios
    const scenarios = generateAllScenarios(
      productData.id,
      originalPrice,
      type,
      discountTwoItems,
      discountThreeItems,
      bundleDiscount
    );

    const { error: scenariosError } = await supabase
      .from('scenarios')
      .insert(scenarios.map(s => ({
        ...s,
        created_at: new Date().toISOString(),
      })) as any);

    if (scenariosError) throw scenariosError;

    return { product: productData, scenarios: scenarios as Scenario[] };
  } catch (error) {
    console.error('Error adding product:', error);
    return null;
  }
}

/**
 * Update product and recalculate scenarios
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Product>
): Promise<boolean> {
  try {
    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (updateError) throw updateError;

    // If price or discounts changed, recalculate scenarios
    if (
      updates.original_price ||
      updates.discount_two_items !== undefined ||
      updates.discount_three_items !== undefined ||
      updates.bundle_discount !== undefined
    ) {
      // Fetch current product data
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      // Delete old scenarios
      const { error: deleteError } = await supabase
        .from('scenarios')
        .delete()
        .eq('product_id', productId);

      if (deleteError) throw deleteError;

      // Generate new scenarios
      const newScenarios = generateAllScenarios(
        productId,
        product.original_price,
        product.type,
        product.discount_two_items,
        product.discount_three_items,
        product.bundle_discount
      );

      // Insert new scenarios
      const { error: insertError } = await supabase
        .from('scenarios')
        .insert(newScenarios.map(s => ({
          ...s,
          created_at: new Date().toISOString(),
        })) as any);

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    return false;
  }
}

/**
 * Delete product and its scenarios
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    // Delete scenarios first (due to foreign key)
    const { error: scenariosError } = await supabase
      .from('scenarios')
      .delete()
      .eq('product_id', productId);

    if (scenariosError) throw scenariosError;

    // Delete product
    const { error: productError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (productError) throw productError;

    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

/**
 * Fetch all scenarios (for advanced filtering)
 */
export async function fetchAllScenarios(): Promise<Scenario[]> {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all scenarios:', error);
    return [];
  }
}
