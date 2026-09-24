import {findHelpTopics} from './src/international-help.js';
const form=document.getElementById('help-form');
const country=document.getElementById('help-country');
const topic=document.getElementById('help-topic');
const query=document.getElementById('help-query');
const status=document.getElementById('help-status');
const groups=[...document.querySelectorAll('[data-help-country]')];
const messages=JSON.parse(document.getElementById('help-messages').content.textContent);
function clear(){query.value='';status.textContent='';}
function show(categories=[]){
  if(!country.value){status.textContent=messages.choose;country.focus();return;}
  let visible=0;
  for(const group of groups){
    group.hidden=group.dataset.helpCountry!==country.value;
    for(const card of group.querySelectorAll('[data-topic]')){
      card.hidden=categories.length>0&&!categories.includes(card.dataset.topic);
      if(!group.hidden&&!card.hidden)visible++;
    }
  }
  status.textContent=visible?`${messages.results}: ${visible}. ${messages.limit}`:messages.empty;
  if(!visible){for(const group of groups)if(!group.hidden)for(const card of group.querySelectorAll('[data-topic]'))card.hidden=false;}
}
form.hidden=false;
country.addEventListener('change',()=>{clear();topic.value='';show();});
topic.addEventListener('change',()=>{clear();show(topic.value?[topic.value]:[]);});
form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!country.value){status.textContent=messages.choose;country.focus();return;}
  const result=findHelpTopics(query.value);query.value='';topic.value='';show(result.safety?[]:result.categories);
  if(result.safety)status.textContent=messages.safety+' '+status.textContent;
  else if(result.needsClarification)status.textContent=messages.empty;
  status.focus();
});
window.addEventListener('pagehide',clear);
window.addEventListener('pageshow',clear);
