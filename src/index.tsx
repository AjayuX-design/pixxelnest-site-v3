import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-pages'
// @ts-expect-error - raw HTML import handled by Vite at build time
import notFoundHtml from '../public/404.html?raw'

type Bindings = {
  RESEND_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.notFound((c) => c.html(notFoundHtml as string, 404))

const NOTIFY_TO = 'support@pixxelnest.com'
const FROM = 'PixxelNest Booking Form <onboarding@resend.dev>'

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] as string))
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

app.post('/api/book', async (c) => {
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const brief = String(body.brief ?? '').trim()
  const projectTypes = Array.isArray(body.projectTypes) ? (body.projectTypes as unknown[]).map(String) : []

  if (!name || !isValidEmail(email) || brief.length < 10 || projectTypes.length === 0) {
    return c.json({ error: 'Missing or invalid required fields' }, 400)
  }

  const phone = body.phone ? String(body.phone) : null
  const company = body.company ? String(body.company) : null
  const website = body.website ? String(body.website) : null
  const budget = body.budget ? String(body.budget) : null
  const timeline = body.timeline ? String(body.timeline) : null
  const source = body.source ? String(body.source) : null

  const rows: [string, string | null][] = [
    ['Name', name],
    ['Email', email],
    ['Phone', phone],
    ['Company', company],
    ['Existing website', website],
    ['Project type', projectTypes.join(', ')],
    ['Budget', budget],
    ['Timeline', timeline],
    ['Heard about us via', source],
  ]

  const htmlRows = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#8A8074;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v as string)}</td></tr>`)
    .join('')

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1C1814;max-width:560px">
      <h2 style="margin:0 0 16px">New booking request</h2>
      <table>${htmlRows}</table>
      <h3 style="margin:20px 0 8px">Brief</h3>
      <p style="white-space:pre-wrap;line-height:1.5">${escapeHtml(brief)}</p>
    </div>
  `

  if (!c.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured')
    return c.json({ error: 'Email service is not configured' }, 500)
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [NOTIFY_TO],
      reply_to: email,
      subject: `New project brief from ${name}`,
      html,
    }),
  })

  if (!resendRes.ok) {
    const errText = await resendRes.text()
    console.error('Resend API error', resendRes.status, errText)
    return c.json({ error: 'Failed to send email' }, 502)
  }

  return c.json({ ok: true })
})

// Serve all static assets from /public
app.use('/*', serveStatic({ root: './' }))

export default app
