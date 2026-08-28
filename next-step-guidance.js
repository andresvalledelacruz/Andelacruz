(function(){
  const KIND_LABELS={official_resource:'Recurso oficial',free_action:'Primer paso',own_content:'Guía de Desgracias.es',partner:'Opción profesional'};
  const safeHref=(item)=>{
    const id=String(item?.id||item?.path||'');
    if(item?.kind==='own_content'&&id.startsWith('/')) return id;
    if(item?.kind==='official_resource'){
      if(id==='112') return 'tel:112';
      if(id==='024') return 'tel:024';
    }
    return null;
  };
  function installStyles(){
    if(document.getElementById('next-step-guidance-styles')) return;
    const style=document.createElement('style');
    style.id='next-step-guidance-styles';
    style.textContent=`
      .next-step-panel{margin-top:18px;padding:18px;border:1px solid #ded5ca;border-radius:14px;background:#fbf8f4;color:#28332f;text-align:left}
      .next-step-panel[hidden]{display:none}.next-step-kicker{margin:0 0 5px;font:700 .72rem/1.2 Montserrat,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8b6f55}
      .next-step-panel h3{margin:0 0 8px;font:700 1.15rem/1.35 'Libre Baskerville',serif}.next-step-panel p{margin:0 0 12px;color:#5c6762;line-height:1.55}
      .next-step-list{display:grid;gap:9px;margin:0;padding:0;list-style:none}.next-step-item{padding:11px 12px;border-radius:10px;background:#fff;border:1px solid #e8e1d9}
      .next-step-type{display:block;margin-bottom:3px;font:700 .68rem/1.2 Montserrat,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8b6f55}
      .next-step-link{color:#28332f;font-weight:700;text-decoration:underline;text-underline-offset:3px}.next-step-note{margin-top:11px!important;font-size:.78rem;color:#727b77!important}
      .next-step-safety{border-color:#d6b9b4;background:#fff8f6}.next-step-safety h3{color:#7f352e}
    `;
    document.head.append(style);
  }
  function textFor(item){
    return String(item?.label||item?.partnerName||item?.path||'Siguiente paso recomendado');
  }
  function render(guidance,status){
    if(!guidance||!status) return;
    installStyles();
    status.querySelector('.next-step-panel')?.remove();
    const recs=Array.isArray(guidance.recommendations)?guidance.recommendations.slice(0,3):[];
    if(!recs.length) return;
    const panel=document.createElement('section');
    panel.className='next-step-panel'+(guidance?.situation?.safety_override?' next-step-safety':'');
    panel.setAttribute('aria-labelledby','next-step-title');
    const kicker=document.createElement('p'); kicker.className='next-step-kicker'; kicker.textContent='Orientación inmediata';
    const title=document.createElement('h3'); title.id='next-step-title'; title.textContent=guidance?.situation?.safety_override?'Lo primero ahora es tu seguridad':'Tu siguiente paso';
    const intro=document.createElement('p'); intro.textContent=guidance?.situation?.safety_override?'Si existe peligro inmediato, prioriza ayuda urgente y no esperes a la revisión de la historia.':'A partir de lo que has contado, estas opciones pueden ayudarte a decidir qué hacer ahora.';
    const list=document.createElement('ul'); list.className='next-step-list';
    recs.forEach(item=>{
      const li=document.createElement('li'); li.className='next-step-item';
      const kind=document.createElement('span'); kind.className='next-step-type'; kind.textContent=KIND_LABELS[item.kind]||'Siguiente paso';
      const href=safeHref(item); const label=textFor(item);
      if(href){ const a=document.createElement('a'); a.className='next-step-link'; a.href=href; a.textContent=label; li.append(kind,a); }
      else { const span=document.createElement('span'); span.textContent=label; li.append(kind,span); }
      list.append(li);
    });
    const note=document.createElement('p'); note.className='next-step-note'; note.textContent='Esta orientación no sustituye asesoramiento profesional. Las opciones comerciales, cuando existan, deben aparecer identificadas como tales.';
    panel.append(kicker,title,intro,list,note); status.append(panel);
  }
  window.DesgraciasNextStep=Object.freeze({render});
})();
