(function(){
  'use strict';

  // User-approved central invitation; keep the frozen V9 source intact.
  const heroActions=document.querySelector('.hero-final-actions');
  const heroUrgent=heroActions?.querySelector('[data-urgent-entry="hero"]');
  const invitation=document.querySelector('.header-cta[data-open-story]');
  if(heroUrgent && invitation){
    const group=document.createElement('div');
    group.className='hero-help-group';
    heroUrgent.replaceWith(group);
    group.append(heroUrgent);
    const button=invitation.cloneNode(true);
    button.classList.add('hero-story-invitation');
    group.append(button);
    const style=document.createElement('style');
    style.textContent=`
      .hero-final-actions{grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr;align-items:stretch}
      .hero-help-group{display:contents}
      .hero-final-actions>.final-card:first-child{grid-column:1;grid-row:2}
      .hero-final-actions .final-card-primary{grid-column:2;grid-row:1}
      .hero-final-actions>.final-card:last-child{grid-column:3;grid-row:2}
      .hero-final-actions .hero-story-invitation{grid-column:2;grid-row:2;display:flex!important;align-items:center;justify-content:center;gap:14px;font-size:clamp(1.1rem,1.7vw,1.45rem);color:#794a2d;background:#f0e0d0;border:1px solid #c9a384}
      .hero-final-actions .final-card,.hero-final-actions .hero-story-invitation{box-sizing:border-box;width:100%;min-width:0;max-width:none;height:100%;min-height:116px;padding:20px;border-radius:18px;overflow-wrap:anywhere}
      .hero-story-invitation svg{width:32px;height:32px;flex-shrink:0}
      .hero-story-invitation:focus-visible{outline:3px solid #8a4939;outline-offset:4px}
      @media(max-width:1080px){.hero-final-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.hero-final-actions .final-card-primary{grid-column:1;grid-row:1}.hero-final-actions>.final-card:first-child{grid-column:2;grid-row:1}.hero-final-actions .hero-story-invitation{grid-column:1;grid-row:2}.hero-final-actions>.final-card:last-child{grid-column:2;grid-row:2}}
      @media(max-width:760px){.hero-final-actions{grid-template-columns:minmax(0,1fr)}.hero-final-actions .final-card-primary{grid-column:1;grid-row:1}.hero-final-actions>.final-card:first-child{grid-column:1;grid-row:2}.hero-final-actions .hero-story-invitation{grid-column:1;grid-row:3}.hero-final-actions>.final-card:last-child{grid-column:1;grid-row:4}}
    `;
    document.head.append(style);
  }
  const countryEntry=document.createElement('a');
  countryEntry.href='/internacional.html';
  countryEntry.className='btn';
  countryEntry.textContent='Ayuda por país: España y otros 7 países →';
  countryEntry.style.cssText='align-self:center;margin:12px 0;color:#794a2d;border:1px solid #c9a384;text-align:center;max-width:100%;white-space:normal';
  document.querySelector('.hero-final-privacy')?.after(countryEntry);
  // Single-destination navigation cards use native links over the whole surface.
  document.querySelectorAll('article.need-card').forEach(card=>{
    const links=card.querySelectorAll('a[href]');
    if(links.length!==1 || card.querySelector('button,input,select,textarea')) return;
    const link=links[0];
    if(link.hasAttribute('data-urgent-entry')) return;
    const replacement=document.createElement('a');
    replacement.className=card.className;
    replacement.href=link.getAttribute('href');
    replacement.style.color='inherit';
    replacement.style.textDecoration='none';
    const label=document.createElement('span');
    label.className=link.className;
    label.append(...link.childNodes);
    link.replaceWith(label);
    replacement.append(...card.childNodes);
    card.replaceWith(replacement);
  });

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
  load('/resource-directory.js');
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
