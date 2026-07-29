/*
# Add seats column, auto-create trigger, and billing helper function

1. Changes to existing tables
- `billing_accounts`: add `seats` column (int, NOT NULL, default 1)
  for Team plan multi-seat support.

2. New Functions
- `auto_create_billing_account()` — SECURITY DEFINER trigger function that
  creates a free-plan billing_accounts row whenever a new organization is
  inserted, so every workspace starts on the Free plan automatically.
- `get_my_billing()` — SECURITY DEFINER STABLE function returning the
  caller's billing account row (scoped via get_my_org_id).

3. Backfill
- Inserts free billing_accounts rows for any existing organizations that
  don't yet have one, so the trigger gap for pre-existing orgs is closed.

4. Triggers
- `trg_auto_billing_account` — AFTER INSERT on organizations, fires
  auto_create_billing_account().

5. Security
- No new RLS policies needed — billing_accounts already has a SELECT
  policy scoped to org members via get_my_org_id().
- get_my_billing() is SECURITY DEFINER and scoped to the caller's org.
- billing_accounts is written only by server-side edge functions using
  the service role key (which bypasses RLS). Client policies are read-only.
*/

-- ── seats column ─────────────────────────────────────────────────
ALTER TABLE billing_accounts ADD COLUMN IF NOT EXISTS seats int NOT NULL DEFAULT 1;

-- ── backfill existing orgs ────────────────────────────────────────
INSERT INTO billing_accounts (organization_id, plan, status, seats)
SELECT o.id, 'free', 'trialing', 1
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM billing_accounts ba WHERE ba.organization_id = o.id
);

-- ── auto-create trigger function ──────────────────────────────────
CREATE OR REPLACE FUNCTION auto_create_billing_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO billing_accounts (organization_id, plan, status, seats)
  VALUES (NEW.id, 'free', 'trialing', 1)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── trigger ──────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_auto_billing_account ON organizations;
CREATE TRIGGER trg_auto_billing_account
AFTER INSERT ON organizations
FOR EACH ROW EXECUTE FUNCTION auto_create_billing_account();

-- ── get_my_billing RPC ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_billing()
RETURNS TABLE (
  organization_id uuid,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,
  status text,
  seats int,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ba.organization_id, ba.stripe_customer_id, ba.stripe_subscription_id,
         ba.plan, ba.status, ba.seats, ba.created_at, ba.updated_at
  FROM billing_accounts ba
  WHERE ba.organization_id = get_my_org_id();
$$;
