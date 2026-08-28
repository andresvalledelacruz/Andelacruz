(function(){
  if(typeof getSupabaseClient!=='function'||typeof showSubmissionReceipt!=='function'){
    console.warn('Next-step adapter: V9 core is not ready.');
    return;
  }
  let lastGuidance=null;
  const originalGetSupabaseClient=getSupabaseClient;
  getSupabaseClient=async function(){
    const client=await originalGetSupabaseClient();
    if(!client.__desgraciasGuidanceWrapped){
      const originalInvoke=client.functions.invoke.bind(client.functions);
      client.functions.invoke=async function(functionName,options){
        const response=await originalInvoke(functionName,options);
        if(functionName==='submit-story'&&response?.data?.guidance) lastGuidance=response.data.guidance;
        return response;
      };
      Object.defineProperty(client,'__desgraciasGuidanceWrapped',{value:true});
    }
    return client;
  };
  const originalShowSubmissionReceipt=showSubmissionReceipt;
  showSubmissionReceipt=function(status,message,withdrawalCode){
    originalShowSubmissionReceipt(status,message,withdrawalCode);
    if(!lastGuidance||!status) return;
    const guidance=lastGuidance;
    lastGuidance=null;
    window.DesgraciasNextStep?.render?.(guidance,status);
  };
})();
