# BrainDock Website

Landing page and authenticated dashboard for BrainDock - an AI-powered focus tracking application for students.

## Tech Stack

- **Build:** Vite (multi-page app)
- **Backend:** Supabase (auth, database, edge functions)
- **Hosting:** Netlify
- **Payments:** Stripe (via Supabase Edge Functions)
- **i18n:** Client-side translations (6 languages)

## Project Structure

```
BrainDock-Website/
├── public/                  # Static files (copied to dist/ as-is)
│   ├── index.html           # Landing page
│   ├── privacy.html         # Privacy Policy
│   ├── terms.html           # Terms and Conditions
│   ├── 404.html             # Custom 404 page
│   ├── css/style.css        # Global styles (Seraphic Focus design system)
│   ├── js/                  # Landing page JS + i18n
│   │   ├── main.js
│   │   ├── i18n.js
│   │   └── translations/    # en, de, fr, hi, ja, zh
│   ├── assets/              # Images and logos
│   ├── robots.txt
│   └── sitemap.xml
├── src/                     # Vite-processed source code
│   ├── pages/               # Page-specific JS modules
│   ├── supabase.js          # Supabase client init
│   ├── auth-helpers.js      # Auth utilities
│   ├── utils.js             # Shared utilities
│   ├── validators.js        # Input validation
│   ├── dashboard-layout.js  # Shared dashboard shell
│   ├── dashboard-i18n.js    # Dashboard i18n
│   ├── dashboard.css        # Dashboard styles
│   └── auth.css             # Auth page styles
├── auth/                    # Auth pages (login, signup, callback, forgot-password)
├── dashboard/               # Dashboard page
├── sessions/                # Sessions list + detail pages
├── settings/                # Configuration + devices pages
├── account/                 # Account + subscription pages
├── pricing/                 # Pricing page
├── download/                # Download page
├── how-to-use/              # How-to-use page
├── supabase/                # Supabase config + edge functions
│   ├── config.toml
│   └── functions/
├── vite.config.js
├── netlify.toml
└── package.json
```

## Local Development

```bash
npm install
npm run dev
```

Then visit `http://localhost:5173`

## Environment Variables

Copy `.env.example` and fill in:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

## Deployment

Deployed to Netlify. See `netlify.toml` for build and redirect configuration.

```bash
npm run build    # Build to dist/
npm run preview  # Preview the production build locally
```

## Design System

Uses the "Seraphic Focus" design language:
- Background: #F9F8F4 (warm paper)
- Text: #1C1C1E (near-black)
- Accent: #D4A373 (warm gold)
- Typography: Playfair Display (headings) + Inter (body)
