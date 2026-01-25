# BrainDock Website

Landing page for BrainDock - an AI-powered focus tracking application for students.

## Project Structure

```
BrainDock-Website/
├── index.html          # Main landing page
├── privacy.html        # Privacy Policy
├── terms.html          # Terms and Conditions
├── css/
│   └── style.css       # All styles (Seraphic Focus design system)
├── assets/
│   ├── logo_icon.png   # Favicon and icon
│   └── logo_with_text.png  # Full logo
└── legal/              # Source markdown for legal docs
```

## Local Development

Open `index.html` in a browser, or use a local server:

```bash
# Python
python -m http.server 8000

# Node.js (if you have npx)
npx serve
```

Then visit `http://localhost:8000`

## Deployment

This is a static site designed for Netlify deployment. See `website_deployment_guide.md` for detailed instructions.

## Design System

Uses the "Seraphic Focus" design language:
- Background: #F9F8F4 (warm paper)
- Text: #1C1C1E (near-black)
- Accent: #D4A373 (warm gold)
- Typography: Playfair Display (headings) + Inter (body)
