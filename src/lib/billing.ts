import type { PlanName } from '@/lib/types';

export interface PlanConfig {
  name: string;
  priceId: string | null;
  price: string;
  limit: number | null;
  limitLabel: string;
  features: string[];
}

export const PLANS: Record<PlanName, PlanConfig> = {
  free: {
    name: 'Free',
    priceId: null,
    price: '$0',
    limit: 5,
    limitLabel: 'Up to 5 tracked subscriptions',
    features: [
      'Fuse-bar renewal tracking',
      'Dashboard & spend summary',
      '1 team member',
    ],
  },
  starter: {
    name: 'Starter',
    priceId: 'price_1TyDMQE6URpuXsix1sgQakcT',
    price: '$29',
    limit: 25,
    limitLabel: 'Up to 25 tracked subscriptions',
    features: [
      'Everything in Free',
      'Email reminders at 60/30/7 days',
      'Up to 5 team members',
    ],
  },
  team: {
    name: 'Team',
    priceId: 'price_1TyDMzE6URpuXsixzFYdqqCo',
    price: '$99',
    limit: null,
    limitLabel: 'Unlimited subscriptions',
    features: [
      'Everything in Starter',
      'Unlimited team members',
      'Priority support',
    ],
  },
};

export const PLAN_ORDER: PlanName[] = ['free', 'starter', 'team'];

export function planLimit(plan: PlanName): number | null {
  return PLANS[plan].limit;
}

export function canAddSubscription(plan: PlanName, currentCount: number): boolean {
  const limit = PLANS[plan].limit;
  if (limit === null) return true;
  return currentCount < limit;
}

export function usageState(used: number, limit: number | null): 'safe' | 'soon' | 'urgent' {
  if (limit === null) return 'safe';
  const pct = used / limit;
  if (pct >= 1) return 'urgent';
  if (pct >= 0.8) return 'soon';
  return 'safe';
}
