/**
 * Supabase Edge Function: create a Stripe Checkout session for a credit package or legacy tier.
 * Body: { package_id: string } (credit pack) or { tier_id: string } (legacy)
 * Returns: { url: string } or { error: string }
 *
 * Security: origin allowlist (no open redirect), CORS restricted, UUID validation,
 * strict body schema, per-user rate limit. Stripe also applies its own rate limiting.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14?target=denonext"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ALLOWED_ORIGINS = [
  "https://thebraindock.com",
  "http://localhost:5173",
  "http://localhost:4173",
]
const DEFAULT_ORIGIN = "https://thebraindock.com"
const MAX_BODY_BYTES = 512
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RATE_LIMIT_WINDOW_MINUTES = 10
const RATE_LIMIT_MAX_PURCHASES = 5

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : null
  const h: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  }
  if (allowOrigin) h["Access-Control-Allow-Origin"] = allowOrigin
  return h
}

function isValidUuid(s: unknown): s is string {
  return typeof s === "string" && UUID_REGEX.test(s)
}

serve(async (req) => {
  const requestOrigin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(requestOrigin)

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" }
  const withCors = (body: string, status: number) =>
    new Response(body, { status, headers: jsonHeaders })

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")

  if (!stripeSecret || !supabaseUrl || !supabaseKey) {
    return withCors(JSON.stringify({ error: "Server configuration error" }), 500)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return withCors(JSON.stringify({ error: "Not authenticated" }), 401)
  }

  const contentLength = req.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return withCors(JSON.stringify({ error: "Request body too large" }), 400)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return withCors(JSON.stringify({ error: "Invalid or expired session" }), 401)
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return withCors(JSON.stringify({ error: "Invalid JSON body" }), 400)
  }

  if (rawBody === null || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return withCors(JSON.stringify({ error: "Body must be a JSON object" }), 400)
  }
  const body = rawBody as Record<string, unknown>
  const keys = Object.keys(body)
  const allowedKeys = ["package_id", "tier_id"]
  if (!keys.every((k) => allowedKeys.includes(k))) {
    return withCors(JSON.stringify({ error: "Unexpected fields in body" }), 400)
  }

  const packageId = body.package_id
  const tierId = body.tier_id

  if (packageId && tierId) {
    return withCors(JSON.stringify({ error: "Provide package_id or tier_id, not both" }), 400)
  }
  if (!packageId && !tierId) {
    return withCors(JSON.stringify({ error: "package_id or tier_id required" }), 400)
  }
  if (packageId && !isValidUuid(packageId)) {
    return withCors(JSON.stringify({ error: "Invalid package_id format" }), 400)
  }
  if (tierId && !isValidUuid(tierId)) {
    return withCors(JSON.stringify({ error: "Invalid tier_id format" }), 400)
  }

  const origin =
    requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : DEFAULT_ORIGIN
  const successUrl = `${origin}/account/subscription/?success=true`
  const cancelUrl = `${origin}/pricing/?canceled=true`

  const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? supabaseKey)
  const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" })

  // Per-user rate limit: prevent checkout session spam (Stripe also has its own rate limiting)
  const fromTime = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString()
  const { count } = await supabaseAdmin
    .from("credit_purchases")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("purchased_at", fromTime)
  if (count != null && count >= RATE_LIMIT_MAX_PURCHASES) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: { ...jsonHeaders, "Retry-After": "60" },
      }
    )
  }

  if (packageId) {
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from("credit_packages")
      .select("id, name, display_name, hours, price_cents, currency, stripe_price_id")
      .eq("id", packageId)
      .eq("is_active", true)
      .single()

    if (pkgError || !pkg) {
      return withCors(JSON.stringify({ error: "Credit package not found or inactive" }), 404)
    }

    try {
      const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = pkg.stripe_price_id
        ? { price: pkg.stripe_price_id, quantity: 1 }
        : {
            price_data: {
              currency: (pkg.currency || "aud").toLowerCase(),
              unit_amount: pkg.price_cents,
              product_data: {
                name: pkg.display_name || pkg.name,
                description: `${pkg.hours} hour${pkg.hours === 1 ? "" : "s"} of BrainDock`,
              },
            },
            quantity: 1,
          }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [lineItem],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: user.id,
        customer_email: user.email,
        allow_promotion_codes: true,
        metadata: { package_id: pkg.id, user_id: user.id },
      })

      return new Response(JSON.stringify({ url: session.url }), {
        status: 200,
        headers: jsonHeaders,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Stripe error"
      return withCors(JSON.stringify({ error: message }), 500)
    }
  }

  const { data: tier, error: tierError } = await supabaseAdmin
    .from("subscription_tiers")
    .select("id, name, display_name, price_cents, currency, stripe_price_id, billing_interval")
    .eq("id", tierId)
    .eq("is_active", true)
    .single()

  if (tierError || !tier) {
    return withCors(JSON.stringify({ error: "Tier not found or inactive" }), 404)
  }

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

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: jsonHeaders,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe error"
    return withCors(JSON.stringify({ error: message }), 500)
  }
})
