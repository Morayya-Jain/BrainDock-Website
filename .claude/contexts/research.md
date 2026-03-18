---
description: "Research mode for exploring BrainDock-Website architecture — vanilla JS, Supabase Edge Functions, Netlify"
---

# BrainDock-Website — Research Context

Use this context when exploring the codebase to understand architecture and patterns before making changes.

## Key Areas to Explore

### Vanilla JS Architecture
- `public/js/` — Landing page scripts (no bundler, direct ES modules)
- `src/` — Dashboard modules (bundled by Vite)
- `src/pages/` — One JS file per dashboard page
- `vite.config.js` — Multi-page build config with 15 HTML entry points

### i18n System (Two Systems)
- `public/js/i18n.js` — Landing page i18n via `data-i18n` attributes
- `src/dashboard-i18n.js` — Dashboard i18n via `t('key', 'fallback')`
- `public/js/translations/` — 6 language JSON files shared by both systems

### Supabase Edge Functions
- `supabase/functions/` — Deno/TypeScript edge functions
- Auth token verification pattern
- CORS handling with `DENO_ENV` for localhost origins
- Stripe webhook processing

### Netlify Configuration
- `netlify.toml` — Security headers, CSP, caching rules, redirects
- Static build from `dist/` directory
- SPA redirect rules for dashboard routes

### Auth Flow
- `auth/` — HTML shells for login, signup, callback, reset-password
- `src/auth-helpers.js` — Shared auth utilities
- `src/dashboard-layout.js` — Auth guard for dashboard pages
- Supabase auth with RLS for data isolation

### Payments
- Stripe integration via Supabase Edge Functions
- Webhook signature verification
- Credit-based system (`src/credits.js`)

## Research Commands

```bash
# Find all translation keys in use
grep -r "data-i18n" public/ --include="*.html"
grep -r "t('" src/ --include="*.js"

# List all edge functions
ls supabase/functions/

# Check CSP configuration
grep -A5 "Content-Security-Policy" netlify.toml

# Find all Supabase queries
grep -rn "supabase\.\(from\|rpc\)" src/ --include="*.js"
```
