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

  function enhanceDecisionCards(){
    if(document.getElementById('whole-decision-card-style')) return;
    const style=document.createElement('style');
    style.id='whole-decision-card-style';
    style.textContent='.needs-grid .need-card{position:relative;cursor:pointer}.needs-grid .need-card .need-link{position:static}.needs-grid .need-card .need-link::after{content:"";position:absolute;inset:0;border-radius:22px}.needs-grid .need-card:focus-within{outline:3px solid #8A4939;outline-offset:3px}.needs-grid .need-card:focus-within .need-link{text-decoration:underline;text-underline-offset:3px}';
    document.head.append(style);
  }

  function appendDiscoveryLink(sectionSelector, afterSelector, id, href, label){
    const section=document.querySelector(sectionSelector);
    const after=section?.querySelector(afterSelector);
    if(!section || !after || document.getElementById(id)) return;
    const wrap=document.createElement('p');
    wrap.id=id;
    wrap.className='center';
    const link=document.createElement('a');
    link.className='btn btn-ghost';
    link.href=href;
    link.textContent=label;
    wrap.append(link);
    after.insertAdjacentElement('afterend',wrap);
  }

  function enhanceDiscovery(){
    enhanceDecisionCards();
    appendDiscoveryLink('#recursos','.resource-grid','all-resources-link','/recursos/','Explorar todos los recursos');
    appendDiscoveryLink('#historias','.story-grid','stories-by-topic-link','/historias/','Ver historias por temas');
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
  // JavaScript only improves ergonomics; core safety links remain present without it.
  enhanceDiscovery();
  load('/visitor-analytics.js');
  load('/visitor-interactions.js');
  load('/app-core.js',()=>{
    coreReady=true;
    load('/story-example-library.js');
    load('/next-step-guidance.js',()=>load('/next-step-adapter.js'));
  },()=>{
    coreReady=false;
    installCoreFallback();
  });

  window.addEventListener('load',()=>{
    enhanceDiscovery();
    if(!coreReady && typeof getSupabaseClient!=='function') installCoreFallback();
  });
})();
