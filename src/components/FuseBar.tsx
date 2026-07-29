import { daysUntil, fuseState, fusePercent, type FuseState } from '@/lib/renewals';
import type { Subscription } from '@/lib/types';

const stateColor: Record<FuseState, string> = {
  safe: 'bg-safe',
  soon: 'bg-soon',
  urgent: 'bg-urgent',
};

export function FuseBar({ sub }: { sub: Subscription }) {
  const days = daysUntil(sub.renewal_date);
  const state = fuseState(days);
  const pct = fusePercent(sub) * 100;

  return (
    <div className="w-full">
      <div className="h-1.5 w-full rounded-full bg-edge overflow-hidden">
        <div
          className={`fuse-fill h-full rounded-full ${stateColor[state]} ${state === 'urgent' ? 'pulse-urgent' : ''}`}
          style={{ width: `${Math.max(pct, days >= 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export function StatusBadge({ sub }: { sub: Subscription }) {
  if (sub.status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-btn border border-edge px-2 py-0.5 text-xs font-medium text-text-secondary">
        Cancelled
      </span>
    );
  }
  const days = daysUntil(sub.renewal_date);
  const state = fuseState(days);
  const styles: Record<FuseState, string> = {
    safe: 'border-safe/40 text-safe bg-safe/10',
    soon: 'border-soon/40 text-soon bg-soon/10',
    urgent: 'border-urgent/40 text-urgent bg-urgent/10',
  };
  const labels: Record<FuseState, string> = {
    safe: 'Tracked',
    soon: 'Renewing soon',
    urgent: 'Act now',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-btn border px-2 py-0.5 text-xs font-medium ${styles[state]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${state === 'urgent' ? 'pulse-urgent' : ''} ${
        state === 'safe' ? 'bg-safe' : state === 'soon' ? 'bg-soon' : 'bg-urgent'
      }`} />
      {labels[state]}
    </span>
  );
}
