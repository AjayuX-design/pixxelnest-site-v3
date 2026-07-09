# PixxelNest Studio Site

Marketing site for PixxelNest, built with Hono + Vite, deployed on Cloudflare Pages.

See the `rebuild/full-fix` branch / its PR for the initial build.

## Local development

```
npm install
npm run dev
```

## Deploy

```
npm run build
npm run deploy
```

Requires a `RESEND_API_KEY` secret (Cloudflare Pages → Settings → Environment variables) for the booking form to send email.
