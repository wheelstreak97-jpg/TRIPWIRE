import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Subscription } from '@/lib/types';

export function useSubscriptions() {
  const { organization } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!organization) return;
    const { data, error: err } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organization.id)
      .order('renewal_date', { ascending: true });
    if (err) {
      setError('Could not load your subscriptions.');
    } else {
      setError(null);
      setSubscriptions(data ?? []);
    }
    setLoading(false);
  }, [organization]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { subscriptions, loading, error, refresh };
}
