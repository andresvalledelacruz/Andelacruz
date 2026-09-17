(function(){
  'use strict';

  // Enhance the whole urgent-help card before loading any optional runtime.
  // The static link remains available when JavaScript is disabled.
  const urgentLink=document.querySelector('.need-card [data-urgent-entry="needs"]');
  const urgentCard=urgentLink?.closest('article.need-card');
  if(urgentCard && urgentLink.getAttribute('href')==='/ayuda-urgente.html'){
    const cardLink=document.createElement('a');
    cardLink.className=urgentCard.className;
    cardLink.href='/ayuda-urgente.html';
    cardLink.dataset.urgentEntry='needs';
    cardLink.setAttribute('aria-label','Necesito ayuda urgente');
    cardLink.style.color='inherit';
    cardLink.style.textDecoration='none';
    const label=document.createElement('span');
    label.className=urgentLink.className;
    while(urgentLink.firstChild) label.append(urgentLink.firstChild);
    urgentLink.replaceWith(label);
    while(urgentCard.firstChild) cardLink.append(urgentCard.firstChild);
    urgentCard.replaceWith(cardLink);
    const focusStyle=document.createElement('style');
    focusStyle.textContent='.need-card[data-urgent-entry="needs"]:focus-visible{outline:3px solid #8A4939;outline-offset:4px}';
    document.head.append(focusStyle);
  }

  const runtimeMessage='Ahora mismo una parte interactiva no está disponible. Puedes seguir usando Buscar ayuda, Recursos y Ayuda urgente con normalidad.';
  let coreReady=false;
  let fallbackInstalled=false;

  function noteRuntimeIssue(){
    const modal=document.getElementById('story-modal');
    if(!modal?.open) return;
    const status=document.getElementById('story-status');
    if(status && !status.textContent.trim()) status.textContent=runtimeMessage;
  }

  function installCoreFallback(){
    if(fallbackInstalled) return;
    fallbackInstalled=true;

    const modal=document.getElementById('story-modal');
    const form=document.getElementById('story-form');
    const availability=document.getElementById('story-availability');
    const submit=form?.querySelector('button[type="submit"]');

    if(availability){
      availability.textContent='El formulario interactivo no está disponible ahora mismo. Puedes consultar Buscar ayuda o Ayuda urgente sin enviar un relato.';
    }
    if(submit){
      submit.disabled=true;
      submit.setAttribute('aria-disabled','true');
    }

    document.querySelectorAll('[data-open-story]').forEach((button)=>{
      button.addEventListener('click',()=>modal?.showModal());
    });
    modal?.querySelectorAll('.close, .modal-actions .btn-ghost').forEach((button)=>{
      button.addEventListener('click',(event)=>{
        event.preventDefault();
        modal.close();
      });
    });
    modal?.addEventListener('click',(event)=>{
      if(event.target===modal) modal.close();
    });
  }

  window.addEventListener('error',()=>{
    console.error('desgracias_runtime_error');
    noteRuntimeIssue();
  });
  window.addEventListener('unhandledrejection',()=>{
    console.error('desgracias_unhandled_rejection');
    noteRuntimeIssue();
  });

  const load=(src,onload,onerror)=>{
    const script=document.createElement('script');
    script.src=src;
    script.async=false;
    if(onload) script.onload=onload;
    script.onerror=()=>{
      console.error('desgracias_script_load_failed',src);
      if(onerror) onerror();
      else noteRuntimeIssue();
    };
    document.body.append(script);
  };

  // Critical navigation, Search and Resources are deliberately static in index.html.
  // Keep JavaScript only for progressive enhancement and non-critical interactive flows.
  load('/visitor-analytics.js');
  load('/app-core.js',()=>{
    coreReady=true;
    load('/story-example-library.js');
    load('/next-step-guidance.js',()=>load('/next-step-adapter.js'));
  },()=>{
    coreReady=false;
    installCoreFallback();
  });

  window.addEventListener('load',()=>{
    if(!coreReady && typeof getSupabaseClient!=='function') installCoreFallback();
  });
})();
