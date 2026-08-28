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

  window.DesgraciasTrackOutcome=async function({decisionId,outcomeType,recommendationKind,recommendationId=null,opportunityId=null}={}){
    if(!decisionId||!outcomeType||!recommendationKind) return {ok:false,skipped:true};
    try{
      const client=await getSupabaseClient();
      await ensureAnonymousSession(client);
      const {data,error}=await client.functions.invoke('recommendation-outcome',{
        body:{decisionId,eventRef:crypto.randomUUID(),outcomeType,recommendationKind,recommendationId,opportunityId}
      });
      if(error) throw error;
      return data||{ok:true};
    }catch(error){
      console.warn('Guidance outcome could not be recorded.',error);
      return {ok:false};
    }
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
