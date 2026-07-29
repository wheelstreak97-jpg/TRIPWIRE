import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { BillingAccount } from '@/lib/types';

export function useBilling() {
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('get_my_billing').maybeSingle();
    if (err) {
      setError('Could not load billing information.');
    } else {
      setError(null);
      setBilling(data as BillingAccount | null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { billing, loading, error, refresh };
}
