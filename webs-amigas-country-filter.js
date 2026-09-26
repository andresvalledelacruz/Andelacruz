(() => {
  const cards = [...document.querySelectorAll('.friends-card')];
  if (!cards.length) return;

  const countryOf = (card) => {
    const text = card.querySelector('small')?.textContent || '';
    return text.split('·')[0].trim();
  };
  const countries = [...new Set(cards.map(countryOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  const flags = new Map([
    ['España','🇪🇸'],['México','🇲🇽'],['Argentina','🇦🇷'],['Chile','🇨🇱'],['Colombia','🇨🇴'],['Perú','🇵🇪'],['Uruguay','🇺🇾'],['Paraguay','🇵🇾'],['Ecuador','🇪🇨'],['Bolivia','🇧🇴'],['Venezuela','🇻🇪'],['Costa Rica','🇨🇷'],['Panamá','🇵🇦'],['Guatemala','🇬🇹'],['Honduras','🇭🇳'],['El Salvador','🇸🇻'],['Nicaragua','🇳🇮'],['República Dominicana','🇩🇴'],['Puerto Rico','🇵🇷'],['Cuba','🇨🇺'],['Estados Unidos','🇺🇸'],['Canadá','🇨🇦'],['Reino Unido','🇬🇧'],['Irlanda','🇮🇪'],['Francia','🇫🇷'],['Portugal','🇵🇹'],['Alemania','🇩🇪'],['Italia','🇮🇹'],['Bélgica','🇧🇪'],['Países Bajos','🇳🇱'],['Luxemburgo','🇱🇺'],['Austria','🇦🇹'],['Polonia','🇵🇱'],['Suecia','🇸🇪'],['Finlandia','🇫🇮'],['Dinamarca','🇩🇰'],['Grecia','🇬🇷'],['Chequia','🇨🇿'],['Rumanía','🇷🇴'],['Bulgaria','🇧🇬'],['Croacia','🇭🇷'],['Eslovaquia','🇸🇰'],['Eslovenia','🇸🇮'],['Hungría','🇭🇺'],['Estonia','🇪🇪'],['Letonia','🇱🇻'],['Lituania','🇱🇹'],['Malta','🇲🇹'],['Chipre','🇨🇾'],['Australia','🇦🇺'],['Nueva Zelanda','🇳🇿'],['India','🇮🇳'],['Japón','🇯🇵'],['Corea del Sur','🇰🇷'],['Sudáfrica','🇿🇦'],['Marruecos','🇲🇦'],['Nigeria','🇳🇬']
  ]);
  const priorityCountries = [...flags.keys()];

  const host = document.createElement('section');
  host.className = 'country-picker';
  host.setAttribute('aria-labelledby','country-picker-title');
  host.innerHTML = '<h2 id="country-picker-title">¿Necesitas ayuda de otro país?</h2><p class="country-picker-help">Por defecto mostramos recursos de España. Elige otro país para ver únicamente su ayuda disponible.</p><div class="country-buttons" role="group" aria-label="País de ayuda"></div><p class="country-status" aria-live="polite"></p>';
  const buttons = host.querySelector('.country-buttons');
  const status = host.querySelector('.country-status');
  const lead = document.querySelector('.friends-lead');
  lead?.insertAdjacentElement('afterend', host);

  const available = new Set(countries);
  for (const country of priorityCountries) {
    const button = document.createElement('button');
    button.type='button';
    button.className='country-button';
    button.dataset.country=country;
    button.textContent=`${flags.get(country) || '🌐'} ${country}`;
    button.setAttribute('aria-pressed','false');
    if (!available.has(country)) {
      button.classList.add('country-unavailable');
      button.title='Estamos ampliando y verificando recursos para este país';
    }
    buttons.append(button);
  }

  function applyCountry(country) {
    let visible = 0;
    for (const card of cards) {
      const show = countryOf(card) === country;
      card.hidden = !show;
      if (show) visible++;
      const small=card.querySelector('small');
      if (small) small.hidden = true;
    }
    for (const group of document.querySelectorAll('.friends-group')) {
      group.hidden = !group.querySelector('.friends-card:not([hidden])');
    }
    for (const button of buttons.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.country===country));
    status.textContent = visible ? `${flags.get(country)||'🌐'} ${country}: ${visible} recursos disponibles.` : `${flags.get(country)||'🌐'} ${country}: estamos ampliando y verificando recursos. Mientras tanto, no mostramos enlaces no comprobados.`;
  }
  buttons.addEventListener('click', e => { const b=e.target.closest('button[data-country]'); if(b) applyCountry(b.dataset.country); });
  applyCountry('España');
})();