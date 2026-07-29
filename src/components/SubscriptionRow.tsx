import { useState } from 'react';
import { Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { FuseBar, StatusBadge } from '@/components/FuseBar';
import { daysUntil, formatDate, formatMoney } from '@/lib/renewals';
import type { Subscription } from '@/lib/types';

interface Props {
  sub: Subscription;
  onEdit?: (sub: Subscription) => void;
  onDelete?: (sub: Subscription) => void;
  onCancel?: (sub: Subscription) => void;
  compact?: boolean;
}

export function SubscriptionRow({ sub, onEdit, onDelete, onCancel, compact }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const days = daysUntil(sub.renewal_date);
  const cancelled = sub.status === 'cancelled';

  return (
    <div
      className={`group rounded-card border border-edge bg-surface px-4 sm:px-5 py-4 transition-colors hover:bg-surface-hover ${cancelled ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-medium text-text-primary truncate">{sub.vendor_name}</span>
            <StatusBadge sub={sub} />
          </div>
          {sub.category && (
            <span className="text-xs text-text-secondary">{sub.category}</span>
          )}
        </div>
        <div className="text-right">
          <div className="font-mono text-sm text-text-primary">
            {formatMoney(Number(sub.monthly_cost))}
            <span className="text-text-secondary">/mo</span>
          </div>
          <div className="font-mono text-xs text-text-secondary">
            {cancelled
              ? 'cancelled'
              : days < 0
                ? 'past due'
                : days === 0
                  ? 'renews today'
                  : `${days}d · ${formatDate(sub.renewal_date)}`}
          </div>
        </div>
        {!compact && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {!cancelled && onCancel && (
              <button
                onClick={() => onCancel(sub)}
                title="Mark cancelled before renewal"
                className="rounded-btn p-2 text-text-secondary hover:text-safe hover:bg-safe/10 transition-colors"
              >
                <ShieldCheck size={16} />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(sub)}
                title="Edit"
                className="rounded-btn p-2 text-text-secondary hover:text-text-primary hover:bg-edge transition-colors"
              >
                <Pencil size={16} />
              </button>
            )}
            {onDelete &&
              (confirmDelete ? (
                <button
                  onClick={() => onDelete(sub)}
                  onBlur={() => setConfirmDelete(false)}
                  className="rounded-btn px-2 py-1.5 text-xs font-semibold text-urgent bg-urgent/10 hover:bg-urgent/20 transition-colors"
                >
                  Confirm
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Delete"
                  className="rounded-btn p-2 text-text-secondary hover:text-urgent hover:bg-urgent/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              ))}
          </div>
        )}
      </div>
      {!cancelled && (
        <div className="mt-3">
          <FuseBar sub={sub} />
        </div>
      )}
    </div>
  );
}
