import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLAN_BY_PRICE: Record<string, "starter" | "team"> = {
  price_1TyDMQE6URpuXsix1sgQakcT: "starter",
  price_1TyDMzE6URpuXsixzFYdqqCo: "team",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")!;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
    const stripe = new Stripe(stripeSecret);

    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id;
        if (!orgId) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? PLAN_BY_PRICE[priceId] : undefined;

        if (plan) {
          await supabase.from("billing_accounts").upsert({
            organization_id: orgId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            plan,
            status: subscription.status === "trialing" ? "trialing" : "active",
            seats: plan === "team" ? 5 : 1,
            updated_at: new Date().toISOString(),
          }, { onConflict: "organization_id" });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.organization_id;
        if (!orgId) break;

        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? PLAN_BY_PRICE[priceId] : undefined;

        const update: Record<string, unknown> = {
          stripe_subscription_id: subscription.id,
          status: subscription.status === "trialing" ? "trialing"
            : subscription.status === "active" ? "active"
            : subscription.status === "past_due" ? "past_due"
            : subscription.status === "canceled" ? "canceled"
            : "active",
          updated_at: new Date().toISOString(),
        };

        if (plan) {
          update.plan = plan;
          update.seats = plan === "team" ? 5 : 1;
        }

        if (subscription.status === "canceled") {
          update.plan = "free";
          update.seats = 1;
        }

        await supabase.from("billing_accounts").upsert({
          organization_id: orgId,
          ...update,
        }, { onConflict: "organization_id" });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.organization_id;
        if (!orgId) break;

        await supabase.from("billing_accounts").upsert({
          organization_id: orgId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: null,
          plan: "free",
          status: "canceled",
          seats: 1,
          updated_at: new Date().toISOString(),
        }, { onConflict: "organization_id" });
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
