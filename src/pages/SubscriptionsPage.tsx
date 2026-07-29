import { useState } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useToast } from '@/contexts/ToastContext';
import { SubscriptionForm } from '@/components/SubscriptionForm';
import { SubscriptionRow } from '@/components/SubscriptionRow';
import { formatMoney } from '@/lib/renewals';
import type { Subscription } from '@/lib/types';

type Filter = 'all' | 'active' | 'cancelled';

export function SubscriptionsPage() {
  const { subscriptions, loading, error, refresh } = useSubscriptions();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subscription | undefined>();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = subscriptions.filter((s) =>
    filter === 'all' ? true : s.status === filter
  );

  const handleCancel = async (sub: Subscription) => {
    const { error: err } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', sub.id);
    if (err) {
      showToast('Could not mark it cancelled. Try again.', 'error');
      return;
    }
    showToast(`Nice catch — ${formatMoney(Number(sub.monthly_cost))} saved`, 'celebrate');
    refresh();
  };

  const handleDelete = async (sub: Subscription) => {
    const { error: err } = await supabase.from('subscriptions').delete().eq('id', sub.id);
    if (err) {
      showToast('Could not delete it. Try again.', 'error');
      return;
    }
    showToast(`${sub.vendor_name} removed`);
    refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Subscriptions</h1>
          <p className="text-sm text-text-secondary mt-1">
            Every contract on a fuse. Green is fine, red needs you now.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(undefined);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-btn bg-safe px-4 py-2 text-sm font-semibold text-bg hover:bg-safe/90 transition-colors"
        >
          <Plus size={16} />
          Add subscription
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'cancelled'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-btn px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-surface-hover text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-card border border-urgent/30 bg-urgent/10 px-4 py-3 text-sm text-urgent">
          {error}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-card border border-dashed border-edge px-6 py-16 text-center">
          <ListChecks size={28} className="mx-auto text-text-secondary mb-3" />
          <p className="text-text-primary font-medium mb-1">
            {filter === 'cancelled'
              ? 'No cancelled subscriptions'
              : 'No subscriptions tracked yet'}
          </p>
          {filter !== 'cancelled' && (
            <p className="text-sm text-text-secondary">
              Add your first one and set the tripwire.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((sub) => (
            <SubscriptionRow
              key={sub.id}
              sub={sub}
              onEdit={(s) => {
                setEditing(s);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {showForm && (
        <SubscriptionForm
          existing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            showToast(editing ? 'Subscription updated' : 'Tripwire set');
            refresh();
          }}
        />
      )}
    </div>
  );
}
