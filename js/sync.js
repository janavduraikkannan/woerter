
/* ---------- Accounts: a personal account key, synced through Firebase Firestore ---------- */
var ACCOUNTS={projectId:'verba-791ca',apiKey:''}; // Firebase project; a web API key is optional (access is governed by firestore.rules)
var SYNC_KEYS=[...GLOBAL_KEYS,...LANG_KEYS];
var acct={key:'',timer:null,last:null,busy:false};
try{acct.key=localStorage.getItem('verba-account')||''}catch(e){}
const acctReady=()=>!!ACCOUNTS.projectId;
const B32='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newKey(){const a=new Uint8Array(24);crypto.getRandomValues(a);return [...a].map(x=>B32[x%32]).join('')}
const normKey=k=>String(k).toUpperCase().replace(/^VERBA/,'').replace(/[^A-Z0-9]/g,'');
const showKey=k=>'VERBA-'+k.match(/.{1,4}/g).join('-');
const docURL=id=>`https://firestore.googleapis.com/v1/projects/${ACCOUNTS.projectId}/databases/(default)/documents/accounts/${id}`+(ACCOUNTS.apiKey?`?key=${ACCOUNTS.apiKey}`:'');
async function cloudGet(id){
  const r=await fetch(docURL(id));
  if(r.status===404){let m='';try{m=((await r.json()).error||{}).message||''}catch(e){}if(/database/i.test(m))throw new Error('The account server isn\'t finished being set up yet (no Firestore database).');return null}
  if(!r.ok)throw new Error(r.status===403?'The account server refused the request (its security rules may not be published yet).':'The account server returned error '+r.status+'.');
  const j=await r.json();return JSON.parse(((j.fields||{}).data||{}).stringValue||'{}');
}
async function cloudPut(id,data){
  const r=await fetch(docURL(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:{data:{stringValue:JSON.stringify(data)},updated:{timestampValue:new Date().toISOString()}}})});
  if(!r.ok)throw new Error(r.status===403?'Saving was refused (the account server\'s security rules may not be published yet).':r.status===404?'The account server isn\'t finished being set up yet (no Firestore database).':'Saving to your account failed (error '+r.status+').');
}
const readLS=k=>{try{const v=localStorage.getItem(k);return v===null?undefined:JSON.parse(v)}catch(e){return undefined}};
/* The account document holds Verba's Latin progress at the top level, the shared profile and settings, and each other language under its own key (SITE.langKey: "es", "fr", "de"). */
const localData=()=>{const o={};
  if(!LANG)SYNC_KEYS.forEach(k=>{try{const v=localStorage.getItem('verba.'+k);if(v!==null)o[k]=JSON.parse(v)}catch(e){}});
  else{const l={};GLOBAL_KEYS.forEach(k=>{const v=readLS('verba.'+k);if(v!==undefined)o[k]=v});LANG_KEYS.forEach(k=>{const v=readLS(SITE.id+'.'+k);if(v!==undefined)l[k]=v});o[LANG]=l}
  if(keyRemA)o.aikeys=serialKeys(); // only when "Save key(s) to my account" is ticked; unticking removes them on the next save
  return o};
/* Keep what other sites store in the same account, and drop saved AI keys when unticked. */
function mergeOut(remote,local){
  if(!LANG){const m=Object.assign({},remote||{},local);if(!local.aikeys)delete m.aikeys;return m}
  const m=Object.assign({},remote||{});GLOBAL_KEYS.forEach(k=>{if(k in local)m[k]=local[k]});m[LANG]=local[LANG]||{};if(local.aikeys)m.aikeys=local.aikeys;else delete m.aikeys;return m}
function applyRemote(d){
  if(!d)return;
  if(!LANG){
  const l=localData();
  if(typeof d.xp==='number')d.xp=Math.max(d.xp,l.xp||0);
  if(typeof d.best==='number'||l.best)d.best=Math.max(d.best||0,l.best||0);
  if(l.since&&(!d.since||l.since<d.since))d.since=l.since;
  if(l.wk&&d.wk&&(l.wk.id>d.wk.id||(l.wk.id===d.wk.id&&l.wk.xp>d.wk.xp)))d.wk=l.wk;
  if(l.days&&d.days&&(l.days.last>d.days.last||(l.days.last===d.days.last&&l.days.count>d.days.count)))d.days=l.days;
  SYNC_KEYS.forEach(k=>{if(k in d){try{localStorage.setItem('verba.'+k,JSON.stringify(d[k]))}catch(e){}}});
  }else{
  const ll=(localData()[LANG])||{},r=Object.assign({},d[LANG]||{});
  if(typeof r.xp==='number'||ll.xp)r.xp=Math.max(r.xp||0,ll.xp||0);
  if(typeof r.best==='number'||ll.best)r.best=Math.max(r.best||0,ll.best||0);
  if(ll.since&&(!r.since||ll.since<r.since))r.since=ll.since;
  if(ll.wk&&(!r.wk||ll.wk.id>r.wk.id||(ll.wk.id===r.wk.id&&ll.wk.xp>r.wk.xp)))r.wk=ll.wk;
  if(ll.days&&(!r.days||ll.days.last>r.days.last||(ll.days.last===r.days.last&&ll.days.count>r.days.count)))r.days=ll.days;
  GLOBAL_KEYS.forEach(k=>{if(k in d){try{localStorage.setItem('verba.'+k,JSON.stringify(d[k]))}catch(e){}}});
  LANG_KEYS.forEach(k=>{if(k in r){try{localStorage.setItem(SITE.id+'.'+k,JSON.stringify(r[k]))}catch(e){}}});
  }
  if(Array.isArray(d.aikeys)&&d.aikeys.length){slots=d.aikeys.map(mkSlot);keyRemA=true;lsSet('verba-keys-account',true);if(keyRemB)lsSet('verba-aikeys',serialKeys())}
  else if(keyRemA){keyRemA=false;lsSet('verba-keys-account',false)}
  refreshFromStore();
}
function refreshFromStore(){
  try{hud()}catch(e){}
  if(typeof selected==='undefined'||!$('levels').children.length)return;
  selected.clear();store.get('topics',[]).forEach(id=>TOPICS.some(t=>t.id===id)&&selected.add(id));
  document.querySelectorAll('#levels input').forEach(b=>b.checked=selected.has(b.value));
  tFocus.clear();store.get('tFocus',[]).forEach(id=>selected.has(id)&&tFocus.add(id));tFocusUI();
  bFrames.clear();store.get('bFrames',[]).forEach(x=>bFrames.add(x));bIngs.clear();store.get('bIngs',[]).forEach(x=>bIngs.add(x));bFocus.clear();store.get('bFocus',[]).forEach(x=>(bFrames.has(x)||bIngs.has(x))&&bFocus.add(x));focusUI();
  document.querySelectorAll('#frames input').forEach(b=>b.checked=bFrames.has(b.value));document.querySelectorAll('#ings input').forEach(b=>b.checked=bIngs.has(b.value));
  $('per').value=store.get('per','2');$('limit').checked=store.get('limit',SITE.limitDefault);$('prov').value=store.get('prov','auto');
  advanced=store.get('keyadv',false);keysUI(true);
  try{if($('acct').open&&!$('profBody').contains(document.activeElement))profUI()}catch(e){}
  const m0=document.querySelector(`input[name=mode][value=${store.get('mode','e2l')}]`);if(m0)m0.checked=true;
  sync();
}
function acctDirty(k){if(!acct.key||!acctReady()||!(SYNC_KEYS.includes(k)||k==='aikeys')||acct.pulling)return;clearTimeout(acct.timer);acct.timer=setTimeout(pushNow,2500)}
async function pushNow(){if(!acct.key||!acctReady())return;try{const remote=await cloudGet(acct.key);await cloudPut(acct.key,mergeOut(remote,localData()));acct.last=new Date();acct.err=''}catch(e){acct.err=e.message}acctUI();try{pushBoard()}catch(e){}}
async function pullNow(){if(!acct.key||!acctReady())return;acct.pulling=true;try{const d=await cloudGet(acct.key);if(d)applyRemote(d);acct.last=new Date();acct.err=''}catch(e){acct.err=e.message}acct.pulling=false;acctUI()}
async function makeAccount(){const k=newKey();await cloudPut(k,localData());acct.key=k;try{localStorage.setItem('verba-account',k)}catch(e){}acct.last=new Date();acct.err='';acctUI();profUI();pushBoard();return k}
async function signInWithKey(k){ // shared by every "log in" path: the account key is what opens the account
  const d=await cloudGet(k);if(!d)throw new Error('No account uses that key. Check for typos.');
  acct.key=k;try{localStorage.setItem('verba-account',k)}catch(e){}applyRemote(d);await pushNow();acctUI();try{profUI()}catch(e){}
  return d;
}
