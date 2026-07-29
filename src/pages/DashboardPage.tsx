import { Link } from 'react-router-dom';
import { DollarSign, Flame, PiggyBank, ArrowRight, Plus, Bell, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscriptionRow } from '@/components/SubscriptionRow';
import { daysUntil, formatMoney } from '@/lib/renewals';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/lib/notification-types';

export function DashboardPage() {
  const { subscriptions, loading, error } = useSubscriptions();
  const { organization } = useAuth();
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      setAlertsLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(6);
      setAlerts(data ?? []);
      setAlertsLoading(false);
    };

    load();

    channel = supabase
      .channel('dashboard-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          setAlerts((prev) => [payload.new as Notification, ...prev].slice(0, 6));
        },
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [organization]);

  const active = subscriptions.filter((s) => s.status === 'active');
  const monthlySpend = active.reduce((sum, s) => sum + Number(s.monthly_cost), 0);
  const dueSoon = active.filter((s) => {
    const d = daysUntil(s.renewal_date);
    return d >= 0 && d <= 30;
  });

  const now = new Date();
  const savedThisMonth = subscriptions
    .filter((s) => {
      if (s.status !== 'cancelled' || !s.cancelled_at) return false;
      const c = new Date(s.cancelled_at);
      return c.getMonth() === now.getMonth() && c.getFullYear() === now.getFullYear();
    })
    .reduce((sum, s) => sum + Number(s.monthly_cost), 0);

  const upcoming = [...active]
    .sort((a, b) => daysUntil(a.renewal_date) - daysUntil(b.renewal_date))
    .slice(0, 5);

  const metrics = [
    {
      label: 'Monthly spend',
      value: formatMoney(monthlySpend),
      icon: DollarSign,
      accent: 'text-text-primary',
    },
    {
      label: 'Renewing in 30 days',
      value: String(dueSoon.length),
      icon: Flame,
      accent: dueSoon.length > 0 ? 'text-soon' : 'text-text-primary',
    },
    {
      label: 'Saved this month',
      value: formatMoney(savedThisMonth),
      icon: PiggyBank,
      accent: savedThisMonth > 0 ? 'text-safe' : 'text-text-primary',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          What's burning down, and what it costs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading
          ? [0, 1, 2].map((i) => <div key={i} className="skeleton h-28" />)
          : metrics.map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                className="rounded-card border border-edge bg-surface p-5 transition-colors hover:bg-surface-hover"
              >
                <div className="flex items-center gap-2 text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">
                  <Icon size={14} />
                  {label}
                </div>
                <div className={`font-mono text-2xl font-semibold ${accent}`}>{value}</div>
              </div>
            ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Upcoming renewals</h2>
        <Link
          to="/app/subscriptions"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          View all
          <ArrowRight size={14} />
        </Link>
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
      ) : upcoming.length === 0 ? (
        <div className="rounded-card border border-dashed border-edge px-6 py-14 text-center">
          <p className="text-text-primary font-medium mb-1">No subscriptions tracked yet</p>
          <p className="text-sm text-text-secondary mb-5">
            Add your first one and never miss a renewal again.
          </p>
          <Link
            to="/app/subscriptions"
            className="inline-flex items-center gap-2 rounded-btn bg-safe px-4 py-2 text-sm font-semibold text-bg hover:bg-safe/90 transition-colors"
          >
            <Plus size={16} />
            Add subscription
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.map((sub) => (
            <SubscriptionRow key={sub.id} sub={sub} compact />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4 mt-10">
        <h2 className="text-lg font-semibold">Renewal alerts</h2>
        <span className="text-sm text-text-secondary">
          {alerts.filter((a) => !a.read).length} unread
        </span>
      </div>

      {alertsLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-card border border-dashed border-edge px-6 py-10 text-center">
          <CheckCircle2 size={28} className="mx-auto text-safe mb-3" />
          <p className="text-text-primary font-medium mb-1">You're all caught up</p>
          <p className="text-sm text-text-secondary">
            Renewal reminders will show up here as your subscriptions approach their renewal dates.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <Link
              key={alert.id}
              to="/app/subscriptions"
              className={`flex items-start gap-3 rounded-card border px-4 py-3 transition-colors hover:bg-surface-hover ${
                alert.read
                  ? 'border-edge bg-surface'
                  : 'border-safe/30 bg-safe/5'
              }`}
            >
              <div
                className={`mt-0.5 flex-shrink-0 ${
                  alert.read ? 'text-text-secondary' : 'text-safe'
                }`}
              >
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${alert.read ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
                  {alert.message}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {new Date(alert.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {!alert.read && (
                <div className="mt-1.5 h-2 w-2 rounded-full bg-safe flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
