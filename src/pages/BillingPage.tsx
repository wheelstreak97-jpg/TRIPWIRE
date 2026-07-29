import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check, Loader as Loader2, CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useBilling } from '@/hooks/useBilling';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { PLANS, PLAN_ORDER, usageState } from '@/lib/billing';
import type { PlanName } from '@/lib/types';

export function BillingPage() {
  const { subscriptions, refresh: refreshSubs } = useSubscriptions();
  const { billing, loading: billingLoading, refresh: refreshBilling } = useBilling();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [upgrading, setUpgrading] = useState(false);

  const trackedCount = subscriptions.filter((s) => s.status === 'active').length;
  const currentPlan: PlanName = billing?.plan ?? 'free';
  const limit = PLANS[currentPlan].limit;
  const used = trackedCount;
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  const uState = usageState(used, limit);

  const checkoutResult = searchParams.get('checkout');
  useEffect(() => {
    if (checkoutResult === 'success') {
      showToast('Upgrade complete — welcome aboard!');
      refreshBilling();
      refreshSubs();
    } else if (checkoutResult === 'cancelled') {
      showToast('Checkout cancelled.', 'error');
    }
  }, [checkoutResult, showToast, refreshBilling, refreshSubs]);

  const handleUpgrade = async (plan: PlanName) => {
    if (plan === currentPlan || plan === 'free') return;
    setUpgrading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        showToast('You must be signed in to upgrade.', 'error');
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Checkout failed');
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not start checkout.', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  const handlePortal = async () => {
    setUpgrading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        showToast('You must be signed in.', 'error');
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Could not open billing portal');
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not open billing portal.', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  const stateColor: Record<string, string> = {
    safe: 'bg-safe',
    soon: 'bg-soon',
    urgent: 'bg-urgent',
  };

  const stateText: Record<string, string> = {
    safe: 'text-safe',
    soon: 'text-soon',
    urgent: 'text-urgent',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your plan, usage, and payment method.
        </p>
      </div>

      {/* Plan + Usage metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-4xl">
        <div className="rounded-card border border-edge bg-surface p-5">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">
            <Sparkles size={14} />
            Current plan
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold text-text-primary">
              {PLANS[currentPlan].name}
            </span>
            <span className="text-sm text-text-secondary">
              {PLANS[currentPlan].price}/mo
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            {PLANS[currentPlan].limitLabel}
          </p>
          {billing?.status && billing.status !== 'trialing' && (
            <span
              className={`inline-block mt-3 text-xs font-medium rounded-btn border px-2 py-0.5 ${
                billing.status === 'active'
                  ? 'border-safe/40 text-safe bg-safe/10'
                  : billing.status === 'past_due'
                    ? 'border-soon/40 text-soon bg-soon/10'
                    : 'border-edge text-text-secondary'
              }`}
            >
              {billing.status.replace('_', ' ')}
            </span>
          )}
        </div>

        <div className="rounded-card border border-edge bg-surface p-5">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">
            <CreditCard size={14} />
            Usage
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl font-semibold ${stateText[uState]}`}>
              {used}
            </span>
            <span className="text-sm text-text-secondary">
              {limit ? `of ${limit}` : 'unlimited'} subscriptions
            </span>
          </div>
          {limit && (
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-edge overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${stateColor[uState]}`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <p className={`text-xs mt-1.5 ${stateText[uState]}`}>
                {used >= limit
                  ? 'Limit reached — upgrade to add more'
                  : `${limit - used} remaining`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Portal button */}
      {billing?.stripe_customer_id && (
        <div className="mb-8 max-w-4xl">
          <button
            onClick={handlePortal}
            disabled={upgrading}
            className="inline-flex items-center gap-2 rounded-btn border border-edge bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover disabled:opacity-60 transition-colors"
          >
            {upgrading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
            Manage payment & cancel
          </button>
          <p className="text-xs text-text-secondary mt-2">
            Opens Stripe's secure portal to update your card, change plans, or cancel.
          </p>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        {PLAN_ORDER.map((planKey) => {
          const plan = PLANS[planKey];
          const isCurrent = planKey === currentPlan;
          return (
            <div
              key={planKey}
              className={`rounded-card border p-6 flex flex-col ${
                isCurrent
                  ? 'border-safe/40 bg-safe/5'
                  : 'border-edge bg-surface'
              }`}
            >
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                {isCurrent && (
                  <span className="text-xs font-medium text-safe border border-safe/40 rounded-btn px-2 py-0.5">
                    Current
                  </span>
                )}
              </div>
              <div className="font-mono text-2xl font-semibold mb-1">
                {plan.price}
                <span className="text-sm text-text-secondary">/mo</span>
              </div>
              <p className="text-xs text-text-secondary mb-4">{plan.limitLabel}</p>
              <ul className="flex flex-col gap-2 text-sm text-text-secondary flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={15} className="text-safe mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {planKey === 'free' ? (
                isCurrent ? (
                  <div className="mt-5 rounded-btn border border-edge px-4 py-2 text-sm font-medium text-text-secondary text-center">
                    Your current plan
                  </div>
                ) : (
                  <div className="mt-5" />
                )
              ) : isCurrent ? (
                <div className="mt-5 rounded-btn border border-safe/40 px-4 py-2 text-sm font-medium text-safe text-center">
                  Active
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(planKey)}
                  disabled={upgrading}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-btn bg-safe px-4 py-2 text-sm font-semibold text-bg hover:bg-safe/90 disabled:opacity-60 transition-colors"
                >
                  {upgrading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                  Upgrade to {plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Limit reached banner */}
      {limit && used >= limit && currentPlan !== 'team' && (
        <div className="mt-6 max-w-4xl rounded-card border border-soon/40 bg-soon/10 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-text-primary">
              You've reached your {PLANS[currentPlan].name} plan limit
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Upgrade to track more subscriptions and unlock email reminders.
            </p>
          </div>
          <Link
            to="/app/billing"
            className="inline-flex items-center gap-2 rounded-btn bg-soon px-4 py-2 text-sm font-semibold text-bg hover:bg-soon/90 transition-colors"
          >
            <ArrowRight size={15} />
            Upgrade now
          </Link>
        </div>
      )}
    </div>
  );
}
