# PixxelNest Studio Site

Marketing site for PixxelNest. Plain static HTML/CSS/JS pages at the repo root, deployed on Vercel with a single serverless function for the booking form.

## Structure

- `index.html`, `work.html`, `book.html`, `service.html` — the site's pages
- `services-data.js` — shared data for the per-service pages
- `api/book.js` — Vercel serverless function that emails booking form submissions via Resend
- `404.html` — served automatically by Vercel for unmatched routes

## Local development

No build step. Open the HTML files directly, or serve the folder with any static server:

```
npx serve .
```

To test the `/api/book` endpoint locally, use the Vercel CLI (requires logging into your Vercel account):

```
npx vercel dev
```

## Deploy

Import this repo in the Vercel dashboard (Framework Preset: "Other"). No build command or output directory needed.

Requires a `RESEND_API_KEY` environment variable (Vercel dashboard → Project → Settings → Environment Variables) for the booking form to actually send email. Get a free key at [resend.com](https://resend.com).
