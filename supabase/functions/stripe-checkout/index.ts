import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PRICE_IDS: Record<string, string> = {
  starter: "price_1TyDMQE6URpuXsix1sgQakcT",
  team: "price_1TyDMzE6URpuXsixzFYdqqCo",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "No organization found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const plan = body?.plan as string;
    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")!;
    const stripe = new Stripe(stripeSecret);
    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173";

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .maybeSingle();

    const { data: billing } = await supabase
      .from("billing_accounts")
      .select("stripe_customer_id")
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    let customerId = billing?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.user.email,
        name: org?.name ?? undefined,
        metadata: {
          organization_id: profile.organization_id,
        },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app/billing?checkout=success`,
      cancel_url: `${appUrl}/app/billing?checkout=cancelled`,
      client_reference_id: profile.organization_id,
      subscription_data: {
        metadata: {
          organization_id: profile.organization_id,
        },
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("stripe-checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
