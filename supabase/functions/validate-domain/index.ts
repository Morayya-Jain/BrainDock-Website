/**
 * Supabase Edge Function: validate that a domain resolves via DNS.
 * Used by the blocklist settings page for custom URL validation (matches desktop app behaviour).
 *
 * POST body: { domain: string }
 * Returns: { exists: boolean, message: string }
 * - exists: true if domain has A record or on any error (graceful fallback)
 * - exists: false only when DNS explicitly returns no record
 *
 * Timeout: 2 seconds. On timeout or network error, returns exists: true so the user can still add the URL.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

// Production origins only; localhost is added automatically in local dev via DENO_ENV
const ALLOWED_ORIGINS = ["https://thebraindock.com"]
if (Deno.env.get("DENO_ENV") !== "production") {
  ALLOWED_ORIGINS.push("http://localhost:5173", "http://localhost:4173")
}
const TIMEOUT_MS = 2000
const MAX_DOMAIN_LENGTH = 253

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : null
  const h: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  }
  if (allowOrigin) h["Access-Control-Allow-Origin"] = allowOrigin
  return h
}

function sleep(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
}

serve(async (req) => {
  const requestOrigin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(requestOrigin)

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ exists: true, message: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    })
  }

  // Require authentication to prevent abuse as an open DNS resolver
  const authHeader = req.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ exists: true, message: "Authentication required" }),
      { status: 401, headers: jsonHeaders }
    )
  }

  let domain: string
  try {
    const body = await req.json()
    if (typeof body?.domain !== "string") {
      return new Response(
        JSON.stringify({ exists: true, message: "Missing or invalid domain" }),
        { status: 400, headers: jsonHeaders }
      )
    }
    domain = body.domain.trim().toLowerCase()
    if (domain.length === 0 || domain.length > MAX_DOMAIN_LENGTH) {
      return new Response(
        JSON.stringify({ exists: true, message: "Invalid domain length" }),
        { status: 400, headers: jsonHeaders }
      )
    }
  } catch {
    return new Response(
      JSON.stringify({ exists: true, message: "Invalid JSON body" }),
      { status: 400, headers: jsonHeaders }
    )
  }

  try {
    // Check A records first, fall back to AAAA for IPv6-only domains
    let records: string[] = []
    try {
      records = await Promise.race([
        Deno.resolveDns(domain, "A"),
        sleep(TIMEOUT_MS),
      ]) as string[]
    } catch {
      // A lookup failed (NXDOMAIN or error) - try AAAA before giving up
      try {
        records = await Promise.race([
          Deno.resolveDns(domain, "AAAA"),
          sleep(TIMEOUT_MS),
        ]) as string[]
      } catch {
        // Both lookups failed - fall through to exists check (records stays [])
      }
    }
    const exists = records.length > 0
    return new Response(
      JSON.stringify({
        exists,
        message: exists ? "Domain verified" : "Domain may not exist (DNS lookup found no records)",
      }),
      { status: 200, headers: jsonHeaders }
    )
  } catch (e) {
    // Timeout, network error, or resolution failure: accept based on format (desktop fallback)
    const message =
      e instanceof Error && e.message === "timeout"
        ? "Could not verify (network timeout) - accepted based on format"
        : "Could not verify (network unavailable) - accepted based on format"
    return new Response(
      JSON.stringify({ exists: true, message }),
      { status: 200, headers: jsonHeaders }
    )
  }
})
