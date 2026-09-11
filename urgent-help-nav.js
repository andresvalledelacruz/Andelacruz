(function(){
  if(document.querySelector('.urgent-help-link')) return;

  const headerInner=document.querySelector('.header-inner');
  const storyButton=document.querySelector('.header-cta');
  if(!headerInner || !storyButton) return;

  if(!document.querySelector('style[data-urgent-help-emphasis]')){
    const style=document.createElement('style');
    style.dataset.urgentHelpEmphasis='';
    style.textContent=`
      .urgent-help-link{
        display:inline-flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        min-height:42px;
        padding:7px 13px;
        border:2px solid #8A4939;
        border-radius:999px;
        background:#8A4939;
        color:#fff !important;
        box-shadow:0 3px 10px rgba(91,47,37,.18);
        font-size:.72rem;
        font-weight:800;
        line-height:1.05;
        letter-spacing:.05em;
        text-align:center;
        text-decoration:none;
        text-transform:uppercase;
      }
      .urgent-help-link:hover{background:#71392D;border-color:#71392D;}
      .urgent-help-link:focus-visible{outline:3px solid #D7B25B;outline-offset:3px;}
      @media (max-width:900px){
        .urgent-help-link{min-height:38px;padding:6px 10px;font-size:.66rem;}
      }
    `;
    document.head.append(style);
  }

  const link=document.createElement('a');
  link.className='urgent-help-link';
  link.href='/ayuda-urgente.html';
  link.setAttribute('aria-label','Necesito Ayuda Urgente');
  link.innerHTML='<span>Necesito</span><span>Ayuda Urgente</span>';

  headerInner.insertBefore(link,storyButton);
})();