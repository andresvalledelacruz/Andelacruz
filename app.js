(function(){
  'use strict';

  const runtimeMessage='Ahora mismo una parte interactiva no está disponible. Puedes seguir usando Buscar ayuda, Recursos y Ayuda urgente con normalidad.';
  let coreReady=false;
  let fallbackInstalled=false;

  function noteRuntimeIssue(){
    const modal=document.getElementById('story-modal');
    if(!modal?.open) return;
    const status=document.getElementById('story-status');
    if(status && !status.textContent.trim()) status.textContent=runtimeMessage;
  }

  function enhanceUrgentCard(){
    const card=document.querySelector('.need-card.need-primary');
    const link=card?.querySelector('a[data-urgent-entry="needs"]');
    if(!card || !link || card.dataset.fullCardReady==='true') return;

    card.dataset.fullCardReady='true';
    card.setAttribute('role','link');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label','Necesito ayuda urgente. Ver ayuda urgente.');

    const activate=(event)=>{
      if(event.type==='click' && event.target.closest('a,button,input,select,textarea')) return;
      if(event.type==='keydown' && event.key!=='Enter' && event.key!==' ') return;
      if(event.type==='keydown') event.preventDefault();
      link.click();
    };

    card.addEventListener('click',activate);
    card.addEventListener('keydown',activate);
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
  enhanceUrgentCard();
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
    enhanceUrgentCard();
    if(!coreReady && typeof getSupabaseClient!=='function') installCoreFallback();
  });
})();
