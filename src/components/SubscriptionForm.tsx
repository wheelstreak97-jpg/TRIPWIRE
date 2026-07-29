import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader as Loader2, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useBilling } from '@/hooks/useBilling';
import { PLANS, canAddSubscription } from '@/lib/billing';
import type { Subscription } from '@/lib/types';

const CATEGORIES = [
  'Software',
  'Infrastructure',
  'Marketing',
  'Finance',
  'HR',
  'Security',
  'Design',
  'Other',
];

interface Props {
  existing?: Subscription;
  onClose: () => void;
  onSaved: () => void;
}

export function SubscriptionForm({ existing, onClose, onSaved }: Props) {
  const { organization, profile } = useAuth();
  const { subscriptions } = useSubscriptions();
  const { billing } = useBilling();
  const currentPlan = billing?.plan ?? 'free';
  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const atLimit = !existing && !canAddSubscription(currentPlan, activeCount);
  const [vendorName, setVendorName] = useState(existing?.vendor_name ?? '');
  const [category, setCategory] = useState(existing?.category ?? 'Software');
  const [monthlyCost, setMonthlyCost] = useState(
    existing ? String(existing.monthly_cost) : ''
  );
  const [billingCycle, setBillingCycle] = useState(existing?.billing_cycle ?? 'monthly');
  const [renewalDate, setRenewalDate] = useState(existing?.renewal_date ?? '');
  const [noticeDays, setNoticeDays] = useState(
    String(existing?.cancellation_notice_days ?? 30)
  );
  const [autoRenew, setAutoRenew] = useState(existing?.auto_renew ?? true);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    setError(null);
    setSaving(true);

    if (atLimit) {
      setSaving(false);
      return;
    }

    const payload = {
      vendor_name: vendorName.trim(),
      category,
      monthly_cost: Number(monthlyCost) || 0,
      billing_cycle: billingCycle,
      renewal_date: renewalDate,
      cancellation_notice_days: Number(noticeDays) || 30,
      auto_renew: autoRenew,
      notes: notes.trim() || null,
    };

    const result = existing
      ? await supabase.from('subscriptions').update(payload).eq('id', existing.id)
      : await supabase.from('subscriptions').insert({
          ...payload,
          organization_id: organization.id,
          owner_id: profile?.id ?? null,
        });

    setSaving(false);
    if (result.error) {
      setError('Could not save. Please check the fields and try again.');
      return;
    }
    onSaved();
  };

  const inputCls =
    'w-full rounded-btn border border-edge bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-safe focus:outline-none transition-colors';
  const labelCls = 'block text-xs font-medium text-text-secondary mb-1.5';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-card border border-edge bg-surface p-6 my-8 animate-toast-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">
            {existing ? 'Edit subscription' : 'Add subscription'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Vendor</label>
            <input
              required
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Figma, AWS, Salesforce..."
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Monthly cost (USD)</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={monthlyCost}
              onChange={(e) => setMonthlyCost(e.target.value)}
              placeholder="99"
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Billing cycle</label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as typeof billingCycle)}
              className={inputCls}
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Next renewal date</label>
            <input
              required
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Cancellation notice (days)</label>
            <input
              type="number"
              min="0"
              value={noticeDays}
              onChange={(e) => setNoticeDays(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="h-4 w-4 accent-[#3ECF8E]"
              />
              Auto-renews
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Contract terms, account owner contact..."
              className={inputCls}
            />
          </div>
          {error && (
            <p className="sm:col-span-2 text-sm text-urgent bg-urgent/10 border border-urgent/30 rounded-btn px-3 py-2">
              {error}
            </p>
          )}
          {atLimit && (
            <div className="sm:col-span-2 rounded-card border border-soon/40 bg-soon/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <Lock size={18} className="text-soon mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    You've reached your {PLANS[currentPlan].name} plan limit
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {PLANS[currentPlan].limit === activeCount
                      ? `You're tracking ${activeCount} of ${PLANS[currentPlan].limit} subscriptions.`
                      : `Your plan allows up to ${PLANS[currentPlan].limit} subscriptions.`}{' '}
                    Upgrade to add more.
                  </p>
                  <Link
                    to="/app/billing"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-soon hover:text-text-primary transition-colors"
                  >
                    Upgrade your plan
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}
          <div className="sm:col-span-2 flex justify-end gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-btn border border-edge px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || atLimit}
              className="inline-flex items-center gap-2 rounded-btn bg-safe px-4 py-2 text-sm font-semibold text-bg hover:bg-safe/90 disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {existing ? 'Save changes' : 'Add subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
