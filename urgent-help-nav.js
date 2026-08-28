(function(){
  const nav=document.querySelector('.main-nav');
  if(!nav || nav.querySelector('.urgent-help-link')) return;
  const link=document.createElement('a');
  link.className='urgent-help-link';
  link.href='/ayuda-urgente.html';
  link.textContent='Necesito Ayuda Urgente';
  link.setAttribute('aria-label','Necesito Ayuda Urgente');
  link.style.fontWeight='700';
  link.style.color='#7B3F1E';
  link.style.background='rgba(123,63,30,.10)';
  link.style.border='1px solid rgba(123,63,30,.22)';
  link.style.borderRadius='10px';
  link.style.padding='10px 12px';
  link.style.margin='17px 0 13px';
  link.style.boxShadow='0 4px 12px rgba(123,63,30,.08)';
  nav.prepend(link);
})();