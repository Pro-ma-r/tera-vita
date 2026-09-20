# tera-vita

## Kontakt forma

Vercel funkcija `api/contact.js` šalje upite preko Resenda na Amelu sandučić, bez pristupa lozinci sandučića. U Vercel projektu treba postaviti:

- `RESEND_API_KEY` — Resend ključ dostupan samo serveru
- `CONTACT_TO=info@teravita.hr`
- `RESEND_FROM=TERA VITA web <upiti@mail.teravita.hr>`

Za slanje s ove adrese u Resendu treba verificirati poddomenu `mail.teravita.hr`.
