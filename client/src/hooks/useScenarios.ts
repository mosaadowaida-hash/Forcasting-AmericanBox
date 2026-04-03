import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Scenario } from '@/lib/supabaseClient';

export function useScenarios(productId: string | null) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setScenarios([]);
      return;
    }

    fetchScenarios();
  }, [productId]);

  const fetchScenarios = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      if (!supabase) {
        setError('Supabase not configured');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('product_id', productId)
        .order('cpm_label', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setScenarios(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { scenarios, loading, error, refetch: fetchScenarios };
}
