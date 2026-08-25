const API_BASE = 'https://desgracias-api-staging.onrender.com';

const dialog = document.querySelector('#storyDialog');
const form = document.querySelector('#storyForm');
const statusBox = document.querySelector('#formStatus');
const categorySelect = document.querySelector('#category');
const submitButton = document.querySelector('#submitStory');
const apiStatus = document.querySelector('#apiStatus');

function openStoryDialog(category = '') {
  if (category && categorySelect) categorySelect.value = category;
  statusBox?.classList.remove('show', 'ok', 'error');
  if (dialog && !dialog.open) dialog.showModal();
}

function closeStoryDialog() {
  if (dialog?.open) dialog.close();
}

for (const trigger of document.querySelectorAll('[data-open-story]')) {
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    openStoryDialog(trigger.dataset.category || '');
  });
}

for (const categoryButton of document.querySelectorAll('[data-category]')) {
  categoryButton.addEventListener('click', () => openStoryDialog(categoryButton.dataset.category || ''));
}

document.querySelector('#closeStory')?.addEventListener('click', closeStoryDialog);
document.querySelector('#cancelStory')?.addEventListener('click', closeStoryDialog);

dialog?.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) closeStoryDialog();
});

function showStatus(kind, message) {
  if (!statusBox) return;
  statusBox.className = `form-status show ${kind}`;
  statusBox.textContent = message;
  statusBox.focus();
}

function selectedNeeds() {
  return [...document.querySelectorAll('input[name="needs"]:checked')].map((el) => el.value);
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const payload = {
    alias: String(formData.get('alias') || '').trim(),
    category: String(formData.get('category') || '').trim(),
    title: String(formData.get('title') || '').trim(),
    story: String(formData.get('story') || '').trim(),
    website: String(formData.get('website') || '').trim(),
    needs: selectedNeeds(),
    consent: formData.get('consent') === 'on',
    synthetic: true
  };

  submitButton.disabled = true;
  submitButton.textContent = 'Enviando…';
  statusBox?.classList.remove('show', 'ok', 'error');

  try {
    const response = await fetch(`${API_BASE}/api/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const messages = {
        invalid_category: 'Selecciona una categoría válida.',
        invalid_title_length: 'El título debe tener entre 8 y 120 caracteres.',
        invalid_story_length: 'La historia debe tener entre 80 y 5.000 caracteres.',
        consent_required: 'Necesitamos que confirmes la casilla de staging.',
        rate_limit: 'Has hecho varias pruebas seguidas. Espera un poco antes de volver a enviar.',
        queue_unavailable: 'La cola de moderación no está disponible ahora mismo.'
      };
      throw new Error(messages[data.error] || 'No hemos podido enviar la prueba. Inténtalo de nuevo.');
    }

    const id = data.submission_id ? ` #${data.submission_id}` : '';
    showStatus('ok', `Recibido${id}. La prueba ha entrado en la cola de moderación y no se publica automáticamente.`);
    form.reset();
  } catch (error) {
    showStatus('error', error.message || 'No hemos podido enviar la prueba.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Enviar a moderación';
  }
});

async function checkApi() {
  if (!apiStatus) return;
  try {
    const response = await fetch(`${API_BASE}/ready`, { cache: 'no-store' });
    const data = await response.json();
    if (response.ok && data.status === 'ready') {
      apiStatus.innerHTML = '<span class="live-dot ok"></span> API y base de datos conectadas';
      return;
    }
    throw new Error('not ready');
  } catch {
    apiStatus.innerHTML = '<span class="live-dot bad"></span> API temporalmente no disponible';
  }
}

function connectStoryExplorer() {
  for (const link of document.querySelectorAll('header a[href="#experiencias"], footer a[href="#experiencias"]')) {
    link.href = '/historias.html';
  }

  const demoSection = document.querySelector('#experiencias .shell');
  if (demoSection && !document.querySelector('#storyExplorerCta')) {
    const wrap = document.createElement('div');
    wrap.id = 'storyExplorerCta';
    wrap.className = 'hero-actions';
    const link = document.createElement('a');
    link.className = 'btn btn-primary';
    link.href = '/historias.html';
    link.textContent = 'Explorar historias por etapas';
    wrap.append(link);
    demoSection.append(wrap);
  }

  const params = new URLSearchParams(location.search);
  if (params.get('contar') === '1') {
    openStoryDialog();
    history.replaceState({}, '', location.pathname + location.hash);
  }
}

connectStoryExplorer();
checkApi();
