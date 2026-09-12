const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
menuButton?.addEventListener('click', () => { const open = navigation.classList.toggle('is-open'); menuButton.setAttribute('aria-expanded', String(open)); });
navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { navigation.classList.remove('is-open'); menuButton?.setAttribute('aria-expanded', 'false'); }));
document.querySelector('#demo-form')?.addEventListener('submit', (event) => { event.preventDefault(); document.querySelector('.form-result').textContent = 'Hvala! Ovo je demo obrazac — upit se još ne šalje dok se ne potvrdi adresa za primanje poruka.'; });
