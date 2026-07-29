/*
# Add notifications table, renewal-due RPC, and pg_cron schedule

1. New Tables
- `notifications`
  - `id` (uuid, primary key)
  - `organization_id` (uuid, references organizations)
  - `subscription_id` (uuid, references subscriptions, nullable)
  - `message` (text) — human-readable alert text
  - `type` (text) — reminder bucket: '60d', '30d', '7d'
  - `read` (boolean, default false)
  - `created_at` (timestamptz)

2. New Functions
- `find_renewals_due_today()` — returns active subscriptions whose
  renewal_date is exactly 60, 30, or 7 days from today AND for which
  no matching reminders_log row already exists. Joins to organizations
  and profiles to include org name and owner email for email sending.

3. Security
- RLS enabled on `notifications`.
- Org members can read + update (mark read) their own notifications.
- No client-side insert/delete — notifications are created server-side
  by the check-renewals edge function using the service role key.

4. pg_cron
- Schedules a daily 02:00 UTC call to the `check-renewals` edge function
  via the Supabase function-invocation URL using pg_net.
*/

-- ── notifications table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (organization_id = get_my_org_id());

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

-- ── find_renewals_due_today RPC ───────────────────────────────────
CREATE OR REPLACE FUNCTION find_renewals_due_today()
RETURNS TABLE (
  id uuid,
  vendor_name text,
  category text,
  monthly_cost numeric,
  billing_cycle text,
  renewal_date date,
  organization_id uuid,
  org_name text,
  owner_email text,
  owner_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    s.id,
    s.vendor_name,
    s.category,
    s.monthly_cost,
    s.billing_cycle,
    s.renewal_date,
    s.organization_id,
    o.name AS org_name,
    au.email AS owner_email,
    p.full_name AS owner_name
  FROM subscriptions s
  JOIN organizations o ON o.id = s.organization_id
  LEFT JOIN profiles p ON p.id = s.owner_id
  LEFT JOIN auth.users au ON au.id = p.id
  WHERE s.status = 'active'
    AND s.renewal_date IN (
      CURRENT_DATE + INTERVAL '60 days',
      CURRENT_DATE + INTERVAL '30 days',
      CURRENT_DATE + INTERVAL '7 days'
    )
    AND NOT EXISTS (
      SELECT 1 FROM reminders_log rl
      WHERE rl.subscription_id = s.id
        AND rl.reminder_type = (
          CASE
            WHEN s.renewal_date = CURRENT_DATE + INTERVAL '60 days' THEN '60d'
            WHEN s.renewal_date = CURRENT_DATE + INTERVAL '30 days' THEN '30d'
            WHEN s.renewal_date = CURRENT_DATE + INTERVAL '7 days'  THEN '7d'
          END
        )
    );
$$;

-- ── pg_cron schedule ─────────────────────────────────────────────
-- Call the check-renewals edge function daily at 02:00 UTC.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'check-renewals-daily'
  ) THEN
    PERFORM cron.schedule(
      'check-renewals-daily',
      '0 2 * * *',
      $CRON$
        SELECT net.http_post(
          url := 'https://api.supabase.co/functions/v1/check-renewals',
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('request.jwt.claim', true),
            'Content-Type', 'application/json'
          ),
          body := '{}'::jsonb
        );
      $CRON$
    );
  END IF;
END
$$;
