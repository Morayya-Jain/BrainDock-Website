---
description: "Development mode for BrainDock-Website — i18n, escapeHtml, Vite, Supabase auth, no em-dash"
---

# BrainDock-Website — Dev Context

You are working on the BrainDock landing page and dashboard website. Vanilla JS (ES modules via Vite), no framework.

## Active Checklist

Before writing any code, verify:
- [ ] Dev server running: `npx vite --port 5173`
- [ ] Supabase types and RLS are current

## i18n Rules (CRITICAL)

Every new user-visible string MUST be translated:
1. Use `t('dotted.key', 'fallback')` in `src/` pages (import from `src/dashboard-i18n.js`)
2. Use `data-i18n="key"` attributes in `public/` HTML
3. Add the key to ALL 6 language files: `public/js/translations/{en,ja,de,fr,zh,hi}.json`
4. Brand names stay in English; item/device names ARE translated
5. Validate JSON after editing: `node -e "JSON.parse(require('fs').readFileSync('file','utf8'))"`

## XSS Prevention

- Use `escapeHtml()` from `src/utils.js` for ALL dynamic content in `innerHTML`
- Prefer `textContent` when HTML rendering is not needed
- Never insert user-provided strings directly into the DOM

## Supabase Auth Guard

- All dashboard pages must check auth via `src/dashboard-layout.js`
- Always add `.eq('user_id', userId)` as defense-in-depth on sensitive queries
- Use specific column names in `.select()` — never `select('*')` on public pages

## Copy Style

- Never use em-dash or en-dash. Use " - " (hyphen with spaces) instead
- Never expose raw error messages (`err.message`) to users — show generic messages via `friendlyError()`

## Verification

After every change:
```bash
npm run build
```
Build must pass before work is considered complete.
