
/* ---------- Key slots. Simple mode uses slot 1 from the bar; advanced mode uses every slot that is on, in rank order. ---------- */
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}};
const lsSet=(k,v)=>{try{v===undefined?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let kid=0;const mkSlot=(o={})=>({id:++kid,key:String(o.key||''),prov:PROVIDERS[o.prov]?o.prov:'auto',on:o.on!==false,st:null,err:''});
let keyRemB=lsGet('verba-keys-browser',false),keyRemA=lsGet('verba-keys-account',false),advanced=store.get('keyadv',false);
let slots=((keyRemB&&lsGet('verba-aikeys',null))||[{prov:store.get('prov','auto')}]).map(mkSlot);
const serialKeys=()=>slots.map(s=>({key:s.key,prov:s.prov,on:s.on}));
function saveKeys(){lsSet('verba-aikeys',keyRemB?serialKeys():undefined);if(keyRemA)try{acctDirty('aikeys')}catch(e){}}
const provName=s=>s.st?PROVIDERS[s.st.prov].name:PROVIDERS[s.prov]?PROVIDERS[s.prov].name:s.key.trim()&&guessProv(s.key.trim()).length?PROVIDERS[guessProv(s.key.trim())[0]].name:'unknown provider';
function syncSimple(){const s=slots[0],k=$('key').value.trim(),p=$('prov').value;if(s.key!==k||s.prov!==p){s.key=k;s.prov=p;s.st=null;s.err='';saveKeys()}}
function fillSimple(){$('key').value=slots[0].key;$('prov').value=slots[0].prov}
const activeSlots=()=>advanced?slots.filter(s=>s.on&&s.key.trim()):(syncSimple(),slots[0].key?[slots[0]]:[]);
const aiName=()=>{const s=activeSlots()[0];return s?provName(s):'the AI'};
// A short fingerprint of a key (not the key itself), used to remember which Gemini model last worked for it,
// so a page reload doesn't start on a model that was overloaded last time.
const keyTag=k=>{let h=5381;for(const c of k.trim())h=(h*33^c.charCodeAt(0))>>>0;return h.toString(36)};
async function useSlot(s){if(s.st)return;s.st=await detectKey(s.key.trim(),s.prov);
  if(s.st.prov==='gemini'){const m=lsGet('verba-gmodel-'+keyTag(s.key),null),all=[s.st.model,...(s.st.cands||[])];
    if(m&&all.includes(m)){s.st.model=m;s.st.cands=all.filter(x=>x!==m)}}}
// Every AI request starts again at the top-ranked key that is on, and falls down the list on any failure.
async function aiChat(messages){
  const list=activeSlots();
  if(!list.length)throw new Error(advanced?'every AI key is turned off; turn one back on under Edit keys':'no AI key was entered');
  let last;
  for(let i=0;i<list.length;i++){const s=list[i];
    try{await useSlot(s);const t=await chatWith(s,messages);s.err='';kStatus();return t}
    catch(e){last=e;s.err=e.message||'failed';if(advanced)keyNotice(s,last,list[i+1]);kStatus()}}
  throw new Error(advanced&&list.length>1?`all ${list.length} keys failed (last: ${last.message})`:last.message);
}
function keyNotice(s,e,nextS){
  const n=slots.indexOf(s)+1;
  let el=document.querySelector(`.knote[data-id="${s.id}"]`);
  if(!el){el=document.createElement('div');el.className='knote';el.dataset.id=s.id;el.setAttribute('role','alert');$('knotes').appendChild(el)}
  el.innerHTML=`<img src="${faceImg('shocked')}" alt=""><div><b>Key ${n} · ${esc(provName(s))} failed.</b> ${esc(e.message||'Unknown error')}. ${nextS?`Switched to key ${slots.indexOf(nextS)+1} · ${esc(provName(nextS))} for this request. Key ${n} will be tried first again next time.`:'There are no more keys to try.'}
    <div class="row"><button class="kbtn" data-a="off">Turn key ${n} off</button><button class="kbtn" data-a="keep">Keep trying it</button></div></div>`;
  el.querySelector('[data-a=off]').onclick=()=>{s.on=false;saveKeys();keysUI(true);el.remove();toast('cheeky',`Key ${n} is off. Turn it back on any time under Edit keys.`)};
  el.querySelector('[data-a=keep]').onclick=()=>el.remove();
}
const provOpts=v=>`<option value="auto">Detect from key</option><optgroup label="Free keys">${Object.entries(PROVIDERS).filter(([,P])=>!P.paid).map(([id,P])=>`<option value="${id}"${v===id?' selected':''}>${esc(P.name)}</option>`).join('')}</optgroup><optgroup label="Paid keys">${Object.entries(PROVIDERS).filter(([,P])=>P.paid).map(([id,P])=>`<option value="${id}"${v===id?' selected':''}>${esc(P.name)}</option>`).join('')}</optgroup>`;
function statText(s){
  if(!s.key.trim())return['','No key yet'];
  if(!s.on)return['bad','Off'+(s.err?': last failed ('+s.err+')':'')];
  if(s.err)return['bad','Last attempt failed: '+s.err];
  if(s.st)return['ok','Working: '+PROVIDERS[s.st.prov].name+', '+s.st.model];
  return['',provName(s)+' · not checked yet'];
}
function kStatus(){if(!$('keysdlg').open)return;document.querySelectorAll('#klist .krow').forEach(li=>{const s=slots.find(x=>x.id==li.dataset.id);if(!s)return;const[c,t]=statText(s),el=li.querySelector('.kstat');el.className='kstat '+c;el.textContent=t})}
function renderKeys(){
  if(advanced)while(slots.length<2)slots.push(mkSlot());
  $('keysdlg').classList.toggle('dim',!advanced);$('advOn').checked=advanced;
  $('klist').innerHTML=slots.map((s,i)=>`<li class="krow${s.on?'':' off'}" data-id="${s.id}"><span class="krank" aria-label="Rank ${i+1}">${i+1}</span>
    <div class="kfields"><select data-f="prov" aria-label="Provider for key ${i+1}">${provOpts(s.prov)}</select><input type="password" data-f="key" autocomplete="off" spellcheck="false" placeholder="Paste API key ${i+1}" aria-label="API key ${i+1}" value="${esc(s.key)}"></div>
    <div><div class="kctl"><label><input type="checkbox" data-f="on"${s.on?' checked':''}> On</label><button data-a="up" aria-label="Move key ${i+1} up"${i?'':' disabled'}>▲</button><button data-a="down" aria-label="Move key ${i+1} down"${i<slots.length-1?'':' disabled'}>▼</button><button data-a="del" aria-label="Remove key ${i+1}"${slots.length>1?'':' disabled'}>Remove</button></div><div class="kstat"></div></div></li>`).join('');
  kStatus();
}
function keysUI(full){
  $('simplekey').hidden=advanced;$('advkey').hidden=!advanced;
  if(!advanced)fillSimple();
  const withKey=slots.filter(s=>s.key.trim()),on=withKey.filter(s=>s.on);
  $('advsum').textContent=!withKey.length?'none added yet':`${withKey.length} ranked, ${on.length} on${on.length?', trying '+provName(on[0])+' first':''}`;
  $('kadv').hidden=advanced;
  $('kRemB').checked=keyRemB;
  let ready=false;try{ready=acctReady()}catch(e){}const inn=ready&&!!acct.key;
  $('kRemA').disabled=!inn;$('kRemA').checked=keyRemA&&inn;$('kRemAl').classList.toggle('dis',!inn);
  $('kRemAt').textContent='Save key(s) to my account'+(!ready?' (once accounts are switched on)':!inn?' (sign in first)':'');
  $('kRemAl').title=inn?'Your keys follow your account to every device you sign in on.':!ready?'Accounts are not switched on yet.':'Sign in with your account key first.';
  if($('keysdlg').open){if(full)renderKeys();else kStatus()}
}

/* the key bar, the advanced key list and its buttons */
function setupKeys(){
  $('key').addEventListener('input',()=>{syncSimple();keysUI()});$('prov').addEventListener('change',()=>{syncSimple();keysUI()});
  $('kRemB').addEventListener('change',e=>{keyRemB=e.target.checked;lsSet('verba-keys-browser',keyRemB);saveKeys()});
  $('kRemA').addEventListener('change',e=>{keyRemA=e.target.checked;lsSet('verba-keys-account',keyRemA);try{pushNow()}catch(x){}});
  const open=()=>{if(!advanced)syncSimple();$('keysdlg').showModal();renderKeys()};
  $('kadv').addEventListener('click',open);$('kedit').addEventListener('click',open);
  $('keysClose').addEventListener('click',()=>$('keysdlg').close());
  $('keysdlg').addEventListener('click',e=>{if(e.target===$('keysdlg'))$('keysdlg').close()});
  $('keysdlg').addEventListener('close',()=>{saveKeys();keysUI()});
  $('advOn').addEventListener('change',e=>{if(!e.target.checked)syncSimple();advanced=e.target.checked;store.set('keyadv',advanced);renderKeys();keysUI();saveKeys()});
  $('kadd').addEventListener('click',()=>{slots.push(mkSlot());renderKeys();saveKeys();const ins=$('klist').querySelectorAll('input[data-f=key]');ins[ins.length-1].focus()});
  const slotOf=el=>{const li=el.closest('.krow');return li&&slots.find(x=>x.id==li.dataset.id)};
  $('klist').addEventListener('input',e=>{const s=slotOf(e.target);if(!s||e.target.dataset.f!=='key')return;s.key=e.target.value.trim();s.st=null;s.err='';saveKeys();keysUI()});
  $('klist').addEventListener('change',e=>{const s=slotOf(e.target),f=e.target.dataset.f;if(!s||f==='key')return;
    if(f==='prov'){s.prov=e.target.value;s.st=null;s.err='';kStatus()}
    else if(f==='on'){s.on=e.target.checked;if(s.on){s.err='';const n=document.querySelector(`.knote[data-id="${s.id}"]`);if(n)n.remove()}e.target.closest('.krow').classList.toggle('off',!s.on);kStatus()}
    saveKeys();keysUI()});
  $('klist').addEventListener('click',e=>{const a=e.target.dataset.a;if(!a)return;const s=slotOf(e.target),i=slots.indexOf(s);
    if(a==='up'&&i>0)[slots[i-1],slots[i]]=[slots[i],slots[i-1]];
    else if(a==='down'&&i<slots.length-1)[slots[i+1],slots[i]]=[slots[i],slots[i+1]];
    else if(a==='del'&&slots.length>1){if(s.key.trim()&&!confirm(`Remove key ${i+1} · ${provName(s)}?`))return;slots.splice(i,1)}
    else return;
    renderKeys();saveKeys();keysUI()});
  keysUI();
}
