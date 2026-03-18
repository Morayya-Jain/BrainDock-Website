---
description: "Code review checklist for BrainDock-Website — XSS, i18n, CSP, RLS, Stripe"
---

# BrainDock-Website — Review Context

Use this checklist when reviewing code changes in the BrainDock website.

## Security Review

- [ ] **XSS via innerHTML**: Every `innerHTML` assignment uses `escapeHtml()` from `src/utils.js`
- [ ] **CSP compliance**: New external resources added to CSP in `netlify.toml`
- [ ] **No raw error messages**: User-facing errors use `friendlyError()` or generic strings
- [ ] **No hardcoded secrets**: API keys, tokens only via `import.meta.env`

## i18n Completeness

- [ ] Every new user-visible string uses `t()` or `data-i18n`
- [ ] Key added to ALL 6 language files: en, ja, de, fr, zh, hi
- [ ] Placeholders use `data-i18n-placeholder` or `t()`
- [ ] Error messages shown to users go through `t()`
- [ ] No hardcoded English strings in template literals
- [ ] JSON files validate: `node -e "JSON.parse(require('fs').readFileSync('file','utf8'))"`

## Supabase & RLS

- [ ] Sensitive queries include `.eq('user_id', userId)` defense-in-depth
- [ ] No `select('*')` on public-facing pages
- [ ] Edge functions check auth token before processing
- [ ] Edge functions don't leak internal error details to client

## Stripe Edge Functions

- [ ] Webhook signature verified before processing events
- [ ] No raw Stripe error details sent to client
- [ ] Idempotency handled for webhook retries
- [ ] CORS origins restricted (no wildcard `*` in production)

## General

- [ ] No em-dash or en-dash in copy (use " - ")
- [ ] `npm run build` passes
- [ ] Safari 15+ compatibility maintained (CSS fallbacks, `-webkit-` prefixes)
