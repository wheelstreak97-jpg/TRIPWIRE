export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
}

export type BillingCycle = 'monthly' | 'annual' | 'custom';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export type PlanName = 'free' | 'starter' | 'team';
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export interface BillingAccount {
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: PlanName;
  status: BillingStatus;
  seats: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  vendor_name: string;
  category: string | null;
  monthly_cost: number;
  billing_cycle: BillingCycle;
  renewal_date: string;
  cancellation_notice_days: number;
  auto_renew: boolean;
  owner_id: string | null;
  status: SubscriptionStatus;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
}
