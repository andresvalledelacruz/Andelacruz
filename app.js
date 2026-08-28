(function(){
  const load=(src,onload)=>{
    const script=document.createElement('script');
    script.src=src;
    script.async=false;
    if(onload) script.onload=onload;
    script.onerror=()=>console.error(`No se ha podido cargar ${src}`);
    document.body.append(script);
  };
  load('/app-core.js',()=>{
    load('/urgent-help-nav.js');
    load('/next-step-guidance.js',()=>load('/next-step-adapter.js'));
  });
})();
