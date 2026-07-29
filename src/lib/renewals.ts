import type { Subscription } from '@/lib/types';

export type FuseState = 'safe' | 'soon' | 'urgent';

const DAY_MS = 86_400_000;

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export function fuseState(days: number): FuseState {
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'soon';
  return 'safe';
}

export function fuseLabel(state: FuseState): string {
  if (state === 'urgent') return 'Act now';
  if (state === 'soon') return 'Renewing soon';
  return 'Tracked';
}

export function cycleLength(sub: Subscription): number {
  return sub.billing_cycle === 'annual' ? 365 : 30;
}

export function fusePercent(sub: Subscription): number {
  const days = daysUntil(sub.renewal_date);
  const total = cycleLength(sub);
  return Math.max(0, Math.min(1, days / total));
}

export function formatMoney(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
