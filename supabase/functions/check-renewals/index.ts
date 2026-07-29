import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RenewalRow {
  id: string;
  vendor_name: string;
  category: string | null;
  monthly_cost: number;
  billing_cycle: string;
  renewal_date: string;
  organization_id: string;
  org_name: string;
  owner_email: string;
  owner_name: string | null;
}

const REMINDER_DAYS = [60, 30, 7];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173";

    // Find active subscriptions whose renewal_date is exactly 60, 30, or 7 days from today.
    // We also LEFT JOIN reminders_log to skip any (subscription_id, reminder_type) pair
    // that has already been sent — dedup at the database level.
    const { data: due, error: queryError } = await supabase.rpc(
      "find_renewals_due_today",
    );

    if (queryError) throw new Error(`Query failed: ${queryError.message}`);
    if (!due || due.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No renewals due today." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: { id: string; status: string }[] = [];

    for (const row of due as RenewalRow[]) {
      const reminderType = `${row.renewal_date}`;
      const daysOut = REMINDER_DAYS.find((d) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(`${row.renewal_date}T00:00:00`);
        const diff = Math.round(
          (target.getTime() - today.getTime()) / 86_400_000,
        );
        return diff === d;
      }) ?? "unknown";

      const emailBody = buildEmail(row, daysOut, appUrl);

      let emailSent = false;
      if (resendApiKey) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Tripwire <onboarding@resend.dev>",
            to: [row.owner_email],
            subject: `${row.vendor_name} renews in ${daysOut} days`,
            html: emailBody,
          }),
        });
        emailSent = res.ok;
        if (!res.ok) {
          console.error(
            `Resend failed for ${row.owner_email}: ${res.status} ${await res.text()}`,
          );
        }
      } else {
        console.warn("RESEND_API_KEY not set — skipping email send.");
      }

      // Insert reminders_log row so this reminder never sends twice.
      const { error: logError } = await supabase.from("reminders_log").insert({
        subscription_id: row.id,
        reminder_type: `${daysOut}d`,
        sent_at: new Date().toISOString(),
      });

      if (logError) {
        console.error(`Failed to log reminder for ${row.id}: ${logError.message}`);
      }

      // Also insert an in-app notification.
      const { error: notifError } = await supabase.from("notifications").insert({
        organization_id: row.organization_id,
        subscription_id: row.id,
        message: `${row.vendor_name} renews in ${daysOut} days (${row.renewal_date})`,
        type: `${daysOut}d`,
      });

      if (notifError) {
        console.error(`Failed to create notification: ${notifError.message}`);
      }

      results.push({
        id: row.id,
        status: emailSent ? "email_sent" : "logged_only",
      });
    }

    return new Response(
      JSON.stringify({ sent: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("check-renewals error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function buildEmail(row: RenewalRow, daysOut: number, appUrl: string): string {
  const cost = Number(row.monthly_cost).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  const link = `${appUrl}/app/subscriptions`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #12151B; padding: 32px; border-radius: 12px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 700; color: #4ADE80;">Tripwire</span>
      </div>
      <h1 style="color: #F1F5F9; font-size: 22px; margin: 0 0 16px 0;">${row.vendor_name} renews in ${daysOut} days</h1>
      <p style="color: #94A3B8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Here's a heads-up about an upcoming renewal in your ${row.org_name} workspace.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Vendor</td>
          <td style="padding: 8px 0; color: #F1F5F9; font-size: 14px; font-weight: 500; text-align: right;">${row.vendor_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Renewal date</td>
          <td style="padding: 8px 0; color: #F1F5F9; font-size: 14px; font-weight: 500; text-align: right;">${row.renewal_date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Monthly cost</td>
          <td style="padding: 8px 0; color: #F1F5F9; font-size: 14px; font-weight: 500; text-align: right;">${cost}</td>
        </tr>
      </table>
      <a href="${link}" style="display: inline-block; background: #4ADE80; color: #12151B; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">
        View subscription
      </a>
      <p style="color: #475569; font-size: 12px; margin-top: 32px;">
        You're receiving this because ${daysOut}-day renewal reminders are enabled for ${row.vendor_name}.
      </p>
    </div>
  `;
}
