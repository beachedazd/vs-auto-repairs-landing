# VS Auto Repairs — Google Ads Landing Page

Single-page landing site for **VS Auto Repairs**, 2/114 Colemans Rd, Carrum Downs VIC 3201.
Built as a Google Ads destination with click-to-call and WhatsApp booking CTAs and Google Ads
conversion tracking wired in.

## What's here

- `index.html` — the whole site. No build step, no dependencies.
- `netlify.toml` — Netlify config (static deploy, security headers).

## Before going live: conversion tracking setup

The gtag code ships with placeholders you must replace in `index.html`:

1. **`AW-XXXXXXXXXX`** (appears in several places) — your Google Ads conversion ID.
   Google Ads → Tools & Settings → Measurement → Conversions.
2. Create two **conversion actions** in Google Ads, both of type *"Clicks on a phone number /
   button on your website"*:
   - "Phone call click" → copy its label over **`CALL_LABEL_HERE`**
   - "WhatsApp click" → copy its label over **`WA_LABEL_HERE`**
3. Optional: create a GA4 property and uncomment the `G-XXXXXXXXXX` config line.
4. Optional: Google *website call conversions* (dynamic number replacement) — uncomment the
   `phone_conversion_number` line.

Consent Mode v2 defaults are set to `granted` for Australian-only traffic. If you ever target
EEA/UK, switch the defaults to `denied` and add a consent banner (see the comment in the head).

## Phone numbers

- **Call buttons** dial the landline (03) 9706 6007 — matches the Google listing.
- **WhatsApp buttons** point at `wa.me/61411217866` — the mobile 0411 217 866 advertised on
  the shop signage. To change it, search-and-replace `61411217866` (format `61XXXXXXXXX`).

## Images

Photos in `assets/` were pulled from the shop's public Facebook page (shopfront, workshop,
truck service) and recompressed for the web.

## Deploy

Hosted on Netlify. Any push to `main` redeploys. To test locally just open `index.html`
in a browser.

## Self-hosted backend

Square webhook processing now runs on the VS Auto self-hosted Supabase project. See [backend deployment and verification](docs/self-hosted-supabase.md). The public landing page remains on Netlify.
