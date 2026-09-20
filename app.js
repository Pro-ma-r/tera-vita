const heroFix = document.createElement('link');
heroFix.rel = 'stylesheet';
heroFix.href = '/hero-fix.css';
document.head.appendChild(heroFix);

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
menuButton?.addEventListener('click', () => { const open = navigation.classList.toggle('is-open'); menuButton.setAttribute('aria-expanded', String(open)); });
navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { navigation.classList.remove('is-open'); menuButton?.setAttribute('aria-expanded', 'false'); }));
document.querySelectorAll('.faq-list summary').forEach((summary) => {
  summary.addEventListener('click', (event) => {
    event.preventDefault();
    const details = summary.parentElement;
    const scrollBeforeToggle = window.scrollY;
    details.open = !details.open;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - scrollBeforeToggle) > 1) {
          window.scrollTo({ top: scrollBeforeToggle, behavior: 'instant' });
        }
      });
    });
  });
});

const contactForm = document.querySelector('#contact-form');
contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const result = contactForm.querySelector('.form-result');
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent || 'Pošalji upit';

  if (result) result.textContent = '';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Šaljem...';
  }

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(contactForm).entries())),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Poruku trenutačno nije moguće poslati.');

    contactForm.reset();
    if (result) result.textContent = 'Hvala! Vaš je upit poslan. Javit ćemo vam se u najkraćem mogućem roku.';
  } catch (error) {
    if (result) result.textContent = error.message || 'Došlo je do pogreške. Pokušajte ponovno ili se javite telefonom.';
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});
