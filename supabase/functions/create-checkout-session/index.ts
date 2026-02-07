/**
 * Supabase Edge Function: create a Stripe Checkout session for a subscription tier.
 * Requires: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or use anon + user JWT).
 * Body: { tier_id: string }
 * Returns: { url: string } or { error: string }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14?target=denonext"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")

  if (!stripeSecret || !supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired session" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  let body: { tier_id?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const tierId = body.tier_id
  if (!tierId) {
    return new Response(
      JSON.stringify({ error: "tier_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? supabaseKey)
  const { data: tier, error: tierError } = await supabaseAdmin
    .from("subscription_tiers")
    .select("id, name, display_name, price_cents, currency, stripe_price_id, billing_interval")
    .eq("id", tierId)
    .eq("is_active", true)
    .single()

  if (tierError || !tier) {
    return new Response(
      JSON.stringify({ error: "Tier not found or inactive" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const origin = req.headers.get("origin") || "https://thebraindock.com"
  const successUrl = `${origin}/account/subscription/?success=true`
  const cancelUrl = `${origin}/pricing/?canceled=true`

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-11-20" })

  try {
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = tier.stripe_price_id
      ? { price: tier.stripe_price_id, quantity: 1 }
      : {
          price_data: {
            currency: (tier.currency || "aud").toLowerCase(),
            unit_amount: tier.price_cents,
            product_data: {
              name: tier.display_name || tier.name,
              description: tier.billing_interval === "one_time" ? "One-time payment" : undefined,
            },
          },
          quantity: 1,
        }

    const session = await stripe.checkout.sessions.create({
      mode: tier.billing_interval === "subscription" ? "subscription" : "payment",
      line_items: [lineItem],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      metadata: { tier_id: tier.id, user_id: user.id },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe error"
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
