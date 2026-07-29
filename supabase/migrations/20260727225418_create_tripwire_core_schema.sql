/*
# Tripwire core schema: organizations, profiles, subscriptions, reminders

1. New Tables
- `organizations`
  - `id` (uuid, primary key)
  - `name` (text, required) — the company/team name
  - `created_at` (timestamptz)
- `profiles`
  - `id` (uuid, primary key, references auth.users) — one profile per signed-up user
  - `organization_id` (uuid, references organizations) — which team the user belongs to
  - `full_name` (text)
  - `role` (text, default 'member') — 'owner' or 'member'
  - `created_at` (timestamptz)
- `subscriptions`
  - `id` (uuid, primary key)
  - `organization_id` (uuid, required, references organizations)
  - `vendor_name` (text, required)
  - `category` (text)
  - `monthly_cost` (numeric, default 0)
  - `billing_cycle` (text, default 'monthly') — monthly | annual | custom
  - `renewal_date` (date, required)
  - `cancellation_notice_days` (int, default 30)
  - `auto_renew` (boolean, default true)
  - `owner_id` (uuid, references profiles) — teammate responsible for this vendor
  - `status` (text, default 'active') — active | cancelled | expired
  - `cancelled_at` (timestamptz) — when it was marked cancelled (drives "saved this month")
  - `notes` (text)
  - `created_at` (timestamptz)
- `reminders_log`
  - `id` (uuid, primary key)
  - `subscription_id` (uuid, references subscriptions)
  - `reminder_type` (text) — '60_day' | '30_day' | '7_day'
  - `sent_at` (timestamptz)

2. Helper Functions
- `get_my_org_id()` — SECURITY DEFINER function returning the caller's organization id;
  avoids recursive RLS lookups on profiles.
- `create_organization_with_owner(org_name, owner_name)` — SECURITY DEFINER RPC called
  right after signup; atomically creates the organization and the caller's owner profile.

3. Security
- RLS enabled on all four tables.
- All access requires a signed-in user (`TO authenticated`).
- organizations: members can read/update their own org.
- profiles: users can read teammates' profiles, insert/update only their own.
- subscriptions: full CRUD scoped to the caller's organization.
- reminders_log: read/insert scoped through the subscription's organization.

4. Indexes
- subscriptions by organization_id and renewal_date; reminders_log by subscription_id.
*/

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id),
  full_name text,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  category text,
  monthly_cost numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  renewal_date date NOT NULL,
  cancellation_notice_days int NOT NULL DEFAULT 30,
  auto_renew boolean NOT NULL DEFAULT true,
  owner_id uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'active',
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminders_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  sent_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal ON subscriptions(renewal_date);
CREATE INDEX IF NOT EXISTS idx_reminders_log_sub ON reminders_log(subscription_id);

CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION create_organization_with_owner(org_name text, owner_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'profile already exists';
  END IF;

  INSERT INTO organizations (name) VALUES (org_name) RETURNING id INTO new_org_id;

  INSERT INTO profiles (id, organization_id, full_name, role)
  VALUES (auth.uid(), new_org_id, owner_name, 'owner');

  RETURN new_org_id;
END;
$$;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_org" ON organizations;
CREATE POLICY "select_own_org" ON organizations FOR SELECT
  TO authenticated USING (id = get_my_org_id());

DROP POLICY IF EXISTS "update_own_org" ON organizations;
CREATE POLICY "update_own_org" ON organizations FOR UPDATE
  TO authenticated USING (id = get_my_org_id()) WITH CHECK (id = get_my_org_id());

DROP POLICY IF EXISTS "select_org_profiles" ON profiles;
CREATE POLICY "select_org_profiles" ON profiles FOR SELECT
  TO authenticated USING (id = auth.uid() OR organization_id = get_my_org_id());

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "select_org_subscriptions" ON subscriptions;
CREATE POLICY "select_org_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (organization_id = get_my_org_id());

DROP POLICY IF EXISTS "insert_org_subscriptions" ON subscriptions;
CREATE POLICY "insert_org_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (organization_id = get_my_org_id());

DROP POLICY IF EXISTS "update_org_subscriptions" ON subscriptions;
CREATE POLICY "update_org_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

DROP POLICY IF EXISTS "delete_org_subscriptions" ON subscriptions;
CREATE POLICY "delete_org_subscriptions" ON subscriptions FOR DELETE
  TO authenticated USING (organization_id = get_my_org_id());

DROP POLICY IF EXISTS "select_org_reminders" ON reminders_log;
CREATE POLICY "select_org_reminders" ON reminders_log FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = reminders_log.subscription_id
        AND s.organization_id = get_my_org_id()
    )
  );

DROP POLICY IF EXISTS "insert_org_reminders" ON reminders_log;
CREATE POLICY "insert_org_reminders" ON reminders_log FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = reminders_log.subscription_id
        AND s.organization_id = get_my_org_id()
    )
  );