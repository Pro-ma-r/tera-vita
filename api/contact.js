const crypto = require('node:crypto');
const { Resend } = require('resend');

const SERVICES = new Set(['Za mene', 'Za psa', 'Za konja', 'Imam pitanje']);

function cleanText(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const origin = request.headers.origin;
  const host = request.headers.host;
  if (origin) {
    try {
      if (new URL(origin).host !== host) {
        return response.status(403).json({ error: 'Forbidden' });
      }
    } catch {
      return response.status(403).json({ error: 'Forbidden' });
    }
  }

  const body = request.body || {};

  // Hidden field: real visitors never fill this in.
  if (cleanText(body.website, 200)) {
    return response.status(200).json({ ok: true });
  }

  const name = cleanText(body.name, 100);
  const contact = cleanText(body.contact, 120);
  const service = cleanText(body.service, 40);
  const message = cleanText(body.message, 5000);
  const privacyConsent = cleanText(body.privacyConsent, 10);

  if (name.length < 2 || contact.length < 3 || message.length < 10 || !SERVICES.has(service) || privacyConsent !== 'yes') {
    return response.status(400).json({ error: 'Provjerite unesene podatke i pokušajte ponovno.' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[contact] Missing RESEND_API_KEY');
    return response.status(503).json({ error: 'Slanje poruka trenutačno nije dostupno.' });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const replyTo = emailPattern.test(contact) ? contact : undefined;
  const recipient = process.env.CONTACT_TO || 'info@teravita.hr';
  const sender = process.env.RESEND_FROM || 'TERA VITA web <upiti@mail.teravita.hr>';

  const plainText = [
    'Novi upit s web-stranice TERA VITA',
    '',
    `Ime i prezime: ${name}`,
    `Kontakt: ${contact}`,
    `Za koga je tretman: ${service}`,
    '',
    'Poruka:',
    message,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#24382d;line-height:1.6;max-width:640px">
      <h1 style="font-family:Georgia,serif;color:#315642;font-size:26px">Novi upit s web-stranice</h1>
      <p><strong>Ime i prezime:</strong> ${escapeHtml(name)}</p>
      <p><strong>Kontakt:</strong> ${escapeHtml(contact)}</p>
      <p><strong>Za koga je tretman:</strong> ${escapeHtml(service)}</p>
      <p><strong>Poruka:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const timeWindow = Math.floor(Date.now() / 600_000);
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${name}|${contact}|${service}|${message}|${timeWindow}`)
      .digest('hex');

    const { error } = await resend.emails.send({
      from: sender,
      to: [recipient],
      replyTo,
      subject: `Novi upit — ${service} — ${name}`,
      text: plainText,
      html,
    }, {
      idempotencyKey: `contact-${idempotencyKey}`,
    });

    if (error) throw new Error(error.message || 'Resend delivery failed');

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('[contact] Email send failed', error);
    return response.status(502).json({ error: 'Poruku trenutačno nije moguće poslati. Pokušajte ponovno ili se javite telefonom.' });
  }
};
