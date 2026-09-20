module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin) {
    try {
      if (new URL(origin).host !== host) {
        return res.status(403).json({ ok: false, error: 'Forbidden' });
      }
    } catch {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
  }

  const { name, contact, service, message, website } = req.body || {};

  // Honeypot: bots often fill fields that real visitors never see.
  if (website) {
    return res.status(200).json({ ok: true });
  }

  const cleanName = String(name || '').trim();
  const cleanContact = String(contact || '').trim();
  const cleanService = String(service || '').trim();
  const cleanMessage = String(message || '').trim();

  if (!cleanName || !cleanContact || !cleanMessage) {
    return res.status(400).json({ ok: false, error: 'Nedostaju obavezni podaci.' });
  }

  if (
    cleanName.length > 120 ||
    cleanContact.length > 180 ||
    cleanService.length > 80 ||
    cleanMessage.length > 5000
  ) {
    return res.status(400).json({ ok: false, error: 'Uneseni podaci su predugački.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return res.status(500).json({ ok: false, error: 'Slanje poruke trenutačno nije dostupno.' });
  }

  const to = process.env.CONTACT_TO || 'info@teravita.hr';
  const from = process.env.CONTACT_FROM || 'TERA VITA <kontakt@teravita.hr>';
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact);

  const escapeHtml = (value) =>
    value.replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[char]);

  const subject = `Novi upit s web stranice — ${cleanService || 'Kontakt'}`;
  const text = [
    'Novi upit s web stranice TERA VITA',
    '',
    `Ime i prezime: ${cleanName}`,
    `Kontakt: ${cleanContact}`,
    `Za koga je tretman: ${cleanService || '-'}`,
    '',
    'Poruka:',
    cleanMessage
  ].join('\n');

  const html = `
    <h2>Novi upit s web stranice TERA VITA</h2>
    <p><strong>Ime i prezime:</strong> ${escapeHtml(cleanName)}</p>
    <p><strong>Kontakt:</strong> ${escapeHtml(cleanContact)}</p>
    <p><strong>Za koga je tretman:</strong> ${escapeHtml(cleanService || '-')}</p>
    <p><strong>Poruka:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(cleanMessage)}</p>
  `;

  const payload = {
    from,
    to: [to],
    subject,
    text,
    html
  };

  if (isEmail) {
    payload.reply_to = cleanContact;
  }

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resendBody = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      console.error('Resend error:', resendResponse.status, resendBody);
      return res.status(502).json({ ok: false, error: 'Poruku trenutačno nije moguće poslati.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ ok: false, error: 'Poruku trenutačno nije moguće poslati.' });
  }
};
