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

  if (result) result.textContent = 'Šaljem poruku...';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Šaljem...';
  }

  try {
    const payload = Object.fromEntries(new FormData(contactForm).entries());
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(body.error || 'Slanje nije uspjelo.');
    }

    contactForm.reset();
    if (result) result.textContent = 'Hvala! Vaš upit je poslan. Javit ćemo vam se čim prije.';
  } catch (error) {
    if (result) result.textContent = error?.message || 'Slanje nije uspjelo. Molimo pokušajte ponovno ili nam se javite telefonom/WhatsAppom.';
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});
