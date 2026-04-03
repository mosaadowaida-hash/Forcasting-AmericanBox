import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { MarketResearch } from '@/lib/supabaseClient';

export function useMarketResearch(productId: string | null) {
  const [research, setResearch] = useState<MarketResearch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setResearch(null);
      return;
    }

    fetchResearch();
  }, [productId]);

  const fetchResearch = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      if (!supabase) {
        setError('Supabase not configured');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('market_research')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        setError(fetchError.message);
        return;
      }

      setResearch(data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateResearch = async (updates: Partial<MarketResearch>) => {
    if (!productId) return;

    try {
      if (!supabase) {
        setError('Supabase not configured');
        return;
      }

      const { data, error: updateError } = await supabase
        .from('market_research')
        .update(updates)
        .eq('product_id', productId)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setResearch(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return { research, loading, error, refetch: fetchResearch, updateResearch };
}
