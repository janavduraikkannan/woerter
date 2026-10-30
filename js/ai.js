
/* ---------- AI provider layer (free and paid keys; one or many, ranked) ---------- */
const PROVIDERS={
  groq:{name:'Groq',base:'https://api.groq.com/openai/v1',re:/^gsk_/,prefer:['llama-3.3-70b','gpt-oss-120b','70b','llama'],skip:/whisper|guard|tts|embed|speech|orpheus|compound|playai/i,fallback:'llama-3.3-70b-versatile'},
  // Gemini uses Google's own API with the x-goog-api-key header: it accepts both the old AIza… keys and the new AQ.… keys AI Studio now issues.
  gemini:{name:'Google Gemini',native:'gemini',base:'https://generativelanguage.googleapis.com/v1beta',re:/^(AIza|AQ\.)/,check:'/models?pageSize=1000',skip:/image|tts|audio|live|embed|imagen|veo|pro|aqa|gemma|learnlm|thinking|robotics|computer|native|nano|banana/i,fallback:'gemini-flash-latest'},
  openrouter:{name:'OpenRouter',base:'https://openrouter.ai/api/v1',re:/^sk-or-/,prefer:['llama-3.3-70b','gpt-oss-120b','deepseek','qwen','gemma','mistral'],skip:/vision|image|audio|embed/i,fallback:'openrouter/free',check:'/key',freeOnly:true},
  cerebras:{name:'Cerebras',base:'https://api.cerebras.ai/v1',re:/^csk-/,prefer:['gpt-oss-120b','llama-3.3-70b','llama','qwen'],skip:/embed/i,fallback:'gpt-oss-120b'},
  huggingface:{name:'Hugging Face',base:'https://router.huggingface.co/v1',re:/^hf_/,prefer:['openai/gpt-oss-120b','llama-3.3-70b','Llama-3.3-70B','Qwen3','qwen'],skip:/vision|VL|embed|coder|image/i,fallback:'openai/gpt-oss-120b',check:'https://huggingface.co/api/whoami-v2'},
  cohere:{name:'Cohere',base:'https://api.cohere.ai/compatibility/v1',re:/^[A-Za-z0-9]{40}$/,prefer:['command-a-03-2025','command-a','command-r-plus','command-r'],skip:/vision|translate|reasoning|embed|rerank|light|nightly/i,fallback:'command-a-03-2025',check:'https://api.cohere.com/v1/models?endpoint=chat',listFromCheck:r=>(r.models||[]).map(m=>m.name)},
  mistral:{name:'Mistral',base:'https://api.mistral.ai/v1',re:/^[A-Za-z0-9]{32}$/,prefer:['mistral-small-latest','mistral-medium-latest','mistral-large-latest'],skip:/embed|ocr|moderation|codestral|pixtral|voxtral|devstral/i,fallback:'mistral-small-latest'},
  // Paid keys. Each uses a cheap, fast model from the family, which is plenty for grading and short tutoring replies.
  openai:{name:'OpenAI (ChatGPT)',paid:true,base:'https://api.openai.com/v1',re:/^sk-(?!or-|ant-)/,prefer:['gpt-4.1-mini','gpt-5-mini','gpt-4o-mini','mini'],skip:/audio|realtime|tts|whisper|embed|image|dall|search|transcri|moderation|codex|instruct|davinci|babbage|nano|preview|\d{4}-\d\d-\d\d/i,fallback:'gpt-4.1-mini'},
  anthropic:{name:'Anthropic (Claude)',paid:true,native:'anthropic',base:'https://api.anthropic.com/v1',re:/^sk-ant-/,check:'/models?limit=100',prefer:['haiku','sonnet'],skip:/claude-(2|instant|3-)/i,fallback:'claude-haiku-4-5'},
  xai:{name:'xAI (Grok)',paid:true,base:'https://api.x.ai/v1',re:/^xai-/,prefer:['grok-4-fast-non-reasoning','grok-4-1-fast-non-reasoning','grok-3-mini','fast-non-reasoning','mini'],skip:/image|vision|imagine|embed|code/i,fallback:'grok-3-mini'}
};
// Anthropic accepts calls straight from a web page only with its explicit browser-access header.
const aiHeaders=(P,key)=>P.native==='anthropic'?{'x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'}:P.native==='gemini'?{'x-goog-api-key':key}:{Authorization:'Bearer '+key};
// Rank Gemini models: the always-newest Flash alias first, then stable Flash by version (newest first), then previews, then Flash-Lite.
function geminiRank(ids){
  const ver=i=>parseFloat((i.match(/gemini-(\d+(?:\.\d+)?)/)||[,'0'])[1]);
  const score=i=>(i==='gemini-flash-latest'?0:/lite/.test(i)?(i==='gemini-flash-lite-latest'?3:4):/preview|exp/.test(i)?2:1);
  return ids.filter(i=>/flash/.test(i)).sort((a,b)=>score(a)-score(b)||ver(b)-ver(a)||a.length-b.length);
}
async function tryProvider(id,key){
  const P=PROVIDERS[id],h=aiHeaders(P,key);
  const url=c=>/^https?:/.test(c)?c:P.base+c;
  let r;try{r=await fetch(url(P.check||'/models'),{headers:h})}catch(e){throw new Error(`Couldn't reach ${P.name} from this page`)}
  if(r.status===401||r.status===403||r.status===400)throw new Error(`${P.name} did not accept that key`);
  if(!r.ok)throw new Error(`${P.name} returned error ${r.status}`);
  let ids=[];
  try{if(P.native==='gemini')ids=((await r.json()).models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')).map(m=>String(m.name).replace(/^models\//,''));
    else if(P.listFromCheck)ids=P.listFromCheck(await r.json());else{const lr=(P.check&&!P.native)?await fetch(P.base+'/models',{headers:h}):r;ids=((await lr.json()).data||[]).map(m=>String(m.id).replace(/^models\//,''));}}catch(e){}
  if(P.freeOnly)ids=ids.filter(i=>i.endsWith(':free'));
  ids=ids.filter(i=>!P.skip.test(i));
  if(P.native==='gemini'){const c=geminiRank(ids);if(!c.includes(P.fallback))c.push(P.fallback);return{prov:id,model:c[0],cands:c.slice(1)}}
  const model=P.prefer.map(x=>ids.find(i=>i.includes(x))).find(Boolean)||ids[0]||P.fallback;
  return{prov:id,model};
}
const guessProv=key=>Object.keys(PROVIDERS).filter(id=>PROVIDERS[id].re.test(key));
async function detectKey(key,choice){
  if(choice&&choice!=='auto')return tryProvider(choice,key);
  const order=guessProv(key);
  if(!order.length)throw new Error("That doesn't look like a key from a provider this site knows. Pick the provider from the list, or tap ⓘ to see which keys work");
  let last;for(const id of order){try{return await tryProvider(id,key)}catch(e){last=e}}throw last;
}
/* Gemini: free-tier models are often briefly overloaded (503) or out of their own per-model quota (429), so one request
   walks through the key's Flash models (newest first) and the site keeps using whichever one answered. */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function geminiChat(s,messages){
  const P=PROVIDERS.gemini,sys=messages.filter(m=>m.role==='system').map(m=>m.content).join('\n\n');
  const contents=messages.filter(m=>m.role!=='system').map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
  const order=[s.st.model,...(s.st.cands||[]).filter(m=>m!==s.st.model)];
  const drop=new Set();let lastStatus=0,lastTxt='';
  for(const model of order){
    // Gemini 3 and later: keep Google's default temperature (lower values can make these models loop) and use light thinking, which is faster and uses fewer tokens.
    const g3=parseFloat((model.match(/gemini-(\d+(?:\.\d+)?)/)||[,'3'])[1])>=3||/latest/.test(model);
    // Thinking is what makes Gemini slow; grading and short tutoring replies don't need it.
    // Gemini 3+: 'minimal' thinking (falls back to 'low', then the default). Gemini 2.5: thinking switched off.
    s.st.cfg=s.st.cfg||{};
    let cfg=s.st.cfg[model]||(g3?{thinkingConfig:{thinkingLevel:'minimal'}}:{temperature:0,thinkingConfig:{thinkingBudget:0}});
    for(let attempt=0;attempt<5;attempt++){
      const body={contents,generationConfig:cfg};if(sys)body.systemInstruction={parts:[{text:sys}]};
      // A model that hasn't answered in 20 seconds is treated as stuck, and the next model is tried.
      const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),20000);
      let r;try{r=await fetch(P.base+'/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{...aiHeaders(P,s.key),'Content-Type':'application/json'},body:JSON.stringify(body),signal:ac.signal})}
      catch(e){clearTimeout(tm);if(e.name==='AbortError'){lastStatus=503;lastTxt='timed out';break}throw new Error(P.name+' could not be reached')}
      clearTimeout(tm);
      if(r.ok){const j=await r.json(),t=(((j.candidates||[])[0]||{}).content?.parts||[]).filter(x=>!x.thought&&x.text).map(x=>x.text).join('');
        if(!t){lastStatus=0;lastTxt='empty reply';break}
        s.st.model=model;s.st.cfg[model]=cfg;s.st.cands=order.filter(m=>m!==model&&!drop.has(m));
        if(model!==order[0])lsSet('verba-gmodel-'+keyTag(s.key),model);return t}
      lastStatus=r.status;try{lastTxt=await r.text()}catch(e){lastTxt=''}
      if(r.status===401||r.status===403)throw new Error(P.name+' refused the key');
      if(r.status===400&&/thinking/i.test(lastTxt)&&cfg.thinkingConfig){ // this model doesn't take that thinking setting
        if(cfg.thinkingConfig.thinkingLevel==='minimal'){cfg={thinkingConfig:{thinkingLevel:'low'}};continue}
        const{thinkingConfig,...rest}=cfg;cfg=rest;continue}
      if(r.status===400&&/temperature/i.test(lastTxt)&&'temperature' in cfg){cfg={};continue}
      if(r.status===503&&attempt===0){await sleep(1200);continue} // overloaded: one quick retry, then the next model
      if(r.status===404||(r.status===400&&/model/i.test(lastTxt)))drop.add(model);
      break}
  }
  if(s.st.cands)s.st.cands=s.st.cands.filter(m=>!drop.has(m));
  if(lastStatus===429)throw new Error(P.name+' hit its free-tier limit on every Flash model; try again later');
  if(lastStatus===503||lastStatus===500)throw new Error(P.name+' is overloaded right now (all Flash models busy)');
  throw new Error(P.name+(lastStatus?' error '+lastStatus:' sent an empty reply'));
}
async function chatWith(s,messages,retry=true,temp=true){
  const P=PROVIDERS[s.st.prov];let body;
  if(P.native==='gemini')return geminiChat(s,messages);
  const sys=messages.filter(m=>m.role==='system').map(m=>m.content).join('\n\n');
  if(P.native==='gemini'){body={contents:messages.filter(m=>m.role!=='system').map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}))};
    if(sys)body.systemInstruction={parts:[{text:sys}]};if(temp)body.generationConfig={temperature:0};}
  else if(P.native){body={model:s.st.model,max_tokens:1024,messages:messages.filter(m=>m.role!=='system')};if(sys)body.system=sys;if(temp)body.temperature=0;}
  else{body={model:s.st.model,messages};if(temp)body.temperature=0;}
  const path=P.native==='gemini'?'/models/'+encodeURIComponent(s.st.model)+':generateContent':P.native?'/messages':'/chat/completions';
  let r;try{r=await fetch(P.base+path,{method:'POST',headers:{...aiHeaders(P,s.key),'Content-Type':'application/json'},body:JSON.stringify(body)})}
  catch(e){throw new Error(P.name+' could not be reached')}
  if(r.status===429)throw new Error(P.name+' hit a rate or spending limit');
  if(r.status===401||r.status===403)throw new Error(P.name+' refused the key');
  if(!r.ok){let txt='';try{txt=await r.text()}catch(e){}
    if(temp&&r.status===400&&/temperature/i.test(txt))return chatWith(s,messages,retry,false); // some reasoning models only allow the default temperature
    if(/credit|balance|billing|quota|payment/i.test(txt))throw new Error(P.name+' says the account is out of credit');
    if(s.st.cands&&s.st.cands.length&&(r.status===404||(r.status===400&&/model/i.test(txt)))){s.st.model=s.st.cands.shift();return chatWith(s,messages,retry,temp)}
    if(retry&&s.st.model!==P.fallback&&(r.status===404||r.status===400)){s.st.model=P.fallback;return chatWith(s,messages,false,temp)}
    throw new Error(P.name+' error '+r.status)}
  const j=await r.json();
  if(P.native==='gemini')return(((j.candidates||[])[0]||{}).content?.parts||[]).filter(x=>!x.thought&&x.text).map(x=>x.text).join('');
  if(P.native)return(j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
  return String(((j.choices||[])[0]||{}).message?.content||'');
}
