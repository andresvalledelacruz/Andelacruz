(function(){
  if(document.querySelector('.urgent-help-link')) return;

  const headerInner=document.querySelector('.header-inner');
  const storyButton=document.querySelector('.header-cta');
  if(!headerInner || !storyButton) return;

  const link=document.createElement('a');
  link.className='urgent-help-link';
  link.href='/ayuda-urgente.html';
  link.setAttribute('aria-label','Necesito Ayuda Urgente');
  link.innerHTML='<span>Necesito</span><span>Ayuda Urgente</span>';

  headerInner.insertBefore(link,storyButton);
})();