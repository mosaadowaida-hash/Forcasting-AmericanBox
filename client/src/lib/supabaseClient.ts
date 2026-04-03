import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only throw error if we're trying to use Supabase features
// For backward compatibility, allow the app to work without Supabase
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase credentials not configured. Dynamic product features will be disabled.');
}

export { supabase };

export type Product = {
  id: string;
  name: string;
  type: 'product' | 'bundle';
  original_price: number;
  discount_two_items?: number;
  discount_three_items?: number;
  bundle_discount?: number;
  created_at: string;
  updated_at: string;
};

export type Scenario = {
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
};

export type MarketResearch = {
  id: string;
  product_id: string;
  demand: string;
  competition: string;
  price_sensitivity: string;
  target_audience: string[];
  market_size: string;
  growth_rate: string;
  average_ctr: string;
  average_cvr: string;
  created_at: string;
  updated_at: string;
};
