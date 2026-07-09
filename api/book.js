const NOTIFY_TO = 'support@pixxelnest.com';
const FROM = 'PixxelNest Booking Form <booking@pixxelnesst.com>';

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body ?? {};
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const brief = String(body.brief ?? '').trim();
  const projectTypes = Array.isArray(body.projectTypes) ? body.projectTypes.map(String) : [];

  if (!name || !isValidEmail(email) || brief.length < 10 || projectTypes.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  const phone = body.phone ? String(body.phone) : null;
  const company = body.company ? String(body.company) : null;
  const website = body.website ? String(body.website) : null;
  const budget = body.budget ? String(body.budget) : null;
  const timeline = body.timeline ? String(body.timeline) : null;
  const source = body.source ? String(body.source) : null;

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Phone', phone],
    ['Company', company],
    ['Existing website', website],
    ['Project type', projectTypes.join(', ')],
    ['Budget', budget],
    ['Timeline', timeline],
    ['Heard about us via', source],
  ];

  const htmlRows = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#8A8074;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`)
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1C1814;max-width:560px">
      <h2 style="margin:0 0 16px">New booking request</h2>
      <table>${htmlRows}</table>
      <h3 style="margin:20px 0 8px">Brief</h3>
      <p style="white-space:pre-wrap;line-height:1.5">${escapeHtml(brief)}</p>
    </div>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured');
    return res.status(500).json({ error: 'Email service is not configured' });
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [NOTIFY_TO],
      reply_to: email,
      subject: `New project brief from ${name}`,
      html,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    console.error('Resend API error', resendRes.status, errText);
    return res.status(502).json({ error: 'Failed to send email' });
  }

  return res.status(200).json({ ok: true });
}
