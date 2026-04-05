import { createClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

let _supabase: any = null;

export function getSupabaseClient() {
  if (!_supabase) {
    if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
      throw new Error("Supabase credentials not configured");
    }
    _supabase = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey);
  }
  return _supabase;
}

// Product types
export interface Product {
  id: string;
  name: string;
  type: "product" | "bundle";
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

// Product operations
export async function getAllProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

export async function createProduct(product: any): Promise<Product> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .insert([product])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, updates: any): Promise<Product> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw error;
}

// Scenario operations
export async function getAllScenarios(): Promise<Scenario[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getProductScenarios(productId: string): Promise<Scenario[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createScenarios(scenarios: any[]): Promise<Scenario[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("scenarios")
    .insert(scenarios)
    .select();

  if (error) throw error;
  return data || [];
}

export async function deleteProductScenarios(productId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("scenarios")
    .delete()
    .eq("product_id", productId);

  if (error) throw error;
}
