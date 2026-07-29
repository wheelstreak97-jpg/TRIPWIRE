/*
# Add billing_accounts table

1. New Tables
- `billing_accounts`
  - `organization_id` (uuid, primary key, references organizations)
  - `stripe_customer_id` (text) — Stripe customer reference
  - `stripe_subscription_id` (text) — Stripe subscription reference
  - `plan` (text, default 'free') — free | starter | team
  - `status` (text, default 'trialing') — trialing | active | past_due | canceled
  - `created_at` (timestamptz) — when the billing record was created
  - `updated_at` (timestamptz) — last sync from Stripe webhook

2. Security
- RLS enabled on billing_accounts.
- Org members can read their own org's billing account.
- No client-side insert/update/delete — billing_accounts is written only by
  server-side edge functions (Stripe webhooks) using the service role key,
  which bypasses RLS. Client policies are read-only.

3. Notes
- This table will be populated by a Stripe webhook edge function in a later step.
- The frontend reads it to show the current plan on the Billing page.
*/

CREATE TABLE IF NOT EXISTS billing_accounts (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'trialing',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_billing" ON billing_accounts;
CREATE POLICY "select_own_billing" ON billing_accounts FOR SELECT
  TO authenticated USING (organization_id = get_my_org_id());
