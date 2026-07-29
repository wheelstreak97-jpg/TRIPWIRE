import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getProductByPriceId } from '../stripe-config';

export interface SubscriptionState {
  subscriptionId: string | null;
  status: string | null;
  priceId: string | null;
  planName: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
  error: Error | null;
}

const DEFAULT_STATE: SubscriptionState = {
  subscriptionId: null,
  status: null,
  priceId: null,
  planName: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  loading: true,
  error: null,
};

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) setState({ ...DEFAULT_STATE, loading: false });
          return;
        }

        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!customer) {
          if (!cancelled) setState({ ...DEFAULT_STATE, loading: false });
          return;
        }

        const { data: sub, error } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('customer_id', customer.customer_id)
          .in('status', ['active', 'trialing'])
          .maybeSingle();

        if (error) throw error;

        const product = sub?.price_id ? getProductByPriceId(sub.price_id) : null;

        if (!cancelled) {
          setState({
            subscriptionId: sub?.subscription_id ?? null,
            status: sub?.status ?? null,
            priceId: sub?.price_id ?? null,
            planName: product?.name ?? null,
            currentPeriodEnd: sub?.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
            cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled)
          setState((prev) => ({ ...prev, loading: false, error: err as Error }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}