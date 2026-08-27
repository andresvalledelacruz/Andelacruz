const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');

navToggle?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});

document.querySelectorAll('.main-nav a').forEach(a => {
  a.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

const modal = document.getElementById('story-modal');
document.querySelectorAll('[data-open-story]').forEach(btn => {
  btn.addEventListener('click', () => modal?.showModal());
});

const storyForm = document.getElementById('story-form');
storyForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const status = document.getElementById('story-status');
  if (status) status.textContent = 'Historia recibida en esta demo. En la versión publicada conectaremos este formulario con un sistema real de moderación.';
  setTimeout(() => modal?.close(), 2600);
});

const contactForm = document.getElementById('contact-form');
contactForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(contactForm);
  const name = (formData.get('name') || '').toString().trim();
  const email = (formData.get('email') || '').toString().trim();
  const reason = (formData.get('reason') || '').toString().trim();
  const message = (formData.get('message') || '').toString().trim();
  const status = contactForm.querySelector('.form-status');
  const subject = `Contacto Desgracias.es — ${reason || 'Consulta'}`;
  const body = [
    `Nombre o alias: ${name || 'No indicado'}`,
    `Correo de respuesta: ${email}`,
    `Motivo: ${reason || 'No indicado'}`,
    '',
    'Mensaje:',
    message
  ].join('
');
  const mailto = `mailto:info@desgracias.es?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (status) status.textContent = 'Abriendo tu aplicación de correo…';
  window.location.href = mailto;
});

document.querySelectorAll('[data-copy-email]').forEach(copyEmailButton => {
  copyEmailButton.addEventListener('click', async () => {
    const email = 'info@desgracias.es';
    try {
      await navigator.clipboard.writeText(email);
      const original = copyEmailButton.textContent;
      copyEmailButton.textContent = 'Email copiado';
      setTimeout(() => copyEmailButton.textContent = original, 1800);
    } catch {
      window.prompt('Copia este correo:', email);
    }
  });
});

const filters = document.querySelectorAll('.filter');
const stories = document.querySelectorAll('.story-card');

filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const category = btn.dataset.filter;
    stories.forEach(card => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
    });
  });
});

// Highlight nav item while scrolling.
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.main-nav a')];

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }
  });
}, {rootMargin: '-35% 0px -55% 0px', threshold: 0});

sections.forEach(section => observer.observe(section));
