/* ---------- Identify the use: grading a named use, extra credit and the use charts ----------
   What counts as a use, how the sentence is marked and how identify questions are made are in site/language.js (normU, phraseOf, latinMarked, pickXC, makeIdentify). */
function lev(a,b){const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]}
function useMatches(ty,u){return ty.syn.some(s0=>{const s=normU(s0)||s0;if(!s)return false;if(u===s)return true;if(u.length>=4&&(u.includes(s)||s.includes(u)))return true;return s.length>=6&&lev(u,s)<=2})}
function gradeUse(id,input){
  const u=normU(input);if(!u)return{empty:true};
  const ty=TYPES[id],sib=USES[ty.c].list.filter(x=>x.id!==id&&useMatches(x,u));
  if(useMatches(ty,u))return sib.length?{vague:true}:{ok:true};
  return{ok:false};
}
function useTable(ck){const u=USES[ck];return`<table><tr><th>Use</th><th>What it shows</th><th>Example</th></tr>${u.list.map(x=>`<tr><th>${esc(x.n)}</th><td class="uw">${esc(x.what)}</td><td><span class="la">${esc(x.la)}</span><br><small>${esc(x.en)}</small></td></tr>`).join('')}</table>`}
function buildUses(){
  $('usesBody').innerHTML=Object.keys(USES).map(k=>`<details class="cwrap udet" data-case="${k}"><summary>${USES[k].name} uses</summary>${useTable(k)}</details>`).join('');
  $('usesBody').querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{if(!d.open||!q)return;(q.opened=q.opened||new Set()).add(d.dataset.case);
    if(q.xc&&!q.xc.done&&TYPES[q.xc.id].c===d.dataset.case)renderXC();
    if(q.mode==='id'&&!checked&&TYPES[q.idType].c===d.dataset.case)$('idnote').textContent=`You opened the ${USES[d.dataset.case].name} uses chart, so this one won't earn XP.`;}));
}
function closeUses(){document.querySelectorAll('#usesBody details').forEach(d=>d.open=false)}
function idBody(){
  const ty=TYPES[q.idType];
  return`${idHead(ty)}
  <input class="full" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${TXT.usePlaceholder}" aria-label="The use">
  <div class="row idrow"><button type="button" class="btn quiet" id="idmc">Multiple choice (${XP_USE.mc} XP)</button><span class="hint" id="idnote"></span></div>
  <div class="choices" id="idch" hidden>${USES[ty.c].list.map(x=>`<button type="button" data-u="${x.id}">${esc(x.n)}</button>`).join('')}</div>`;
}
function useLine(qq,tok,id){const ty=TYPES[id];return`<span class="la">${esc(phraseOf(qq,tok))}</span> is <b>${esc(ty.full)}</b>: ${esc(ty.what)}.`}
async function checkId(viaMC){
  if(busy)return;
  const inp=$('qbody').querySelector('input.full');let r=viaMC?{ok:viaMC===q.idType}:gradeUse(q.idType,inp.value),aiR=null,aiErr='';
  if(r.empty){$('feedback').innerHTML='<li class="mac">Type a use first, or choose <b>Multiple choice</b>.</li>';return}
  if(r.vague){$('feedback').innerHTML=`<li class="mac"><b class="mac">Be more specific.</b> “${esc(inp.value.trim())}” fits more than one ${useOf(TYPES[q.idType])}. Try again.</li>`;return}
  if(!viaMC&&!r.ok){const cur=q;busy=true;$('check').disabled=inp.disabled=true;moodTok++;setFelix('thinking');$('feedback').innerHTML=`<li>Checking with ${esc(aiName())}…</li>`;
    try{aiR=await aiGradeUse(q.idType,inp.value.trim(),q,q.idTok)}catch(e){aiErr=e.message||'the AI could not be reached'}
    busy=false;$('check').disabled=false;if(cur!==q)return;
    if(aiR&&aiR.vague){inp.disabled=false;inp.focus();moodTok++;setFelix('happy');$('feedback').innerHTML=`<li class="mac"><b class="mac">Be more specific.</b> ${esc(aiR.reason)} Try again.</li>`;return}
    if(aiR&&aiR.ok)r={ok:true,ai:true};}
  const ty=TYPES[q.idType],voided=!!(q.opened&&q.opened.has(ty.c)),counts=r.ok&&!voided&&!q.leaked,prev=stats.streak,mc=!!viaMC||q.usedMC;
  checked=true;inp.disabled=true;$('idmc').disabled=true;
  $('idch').querySelectorAll('button').forEach(b=>{b.disabled=true;if(b.dataset.u===q.idType)b.classList.add(counts?'ok':r.ok?'leak':'ok');else if(b.dataset.u===viaMC)b.classList.add('bad')});
  inp.classList.add(counts?'ok':r.ok?'leak':'bad');
  stats.total++;if(counts){stats.right++;stats.streak=prev+1;award(1,mc?XP_USE.mc:XP_USE.typed)}else stats.streak=0;
  q.submitted=viaMC?ty.c+': '+(TYPES[viaMC]||{}).n:inp.value.trim();q.result=r.ok?'correct':'incorrect';react(counts?'ok':r.ok?'leak':'bad');
  const why=voided?`you opened the ${USES[ty.c].name} uses chart on this problem`:'a question you asked before answering was too leading';
  const head=counts?`<b class="ok">Correct${mc?', with multiple choice':''}.</b>`:r.ok?`<b class="mac">Correct, but not counted,</b> because ${why}.`:`<b class="bad">Not quite.</b>`;
  $('feedback').innerHTML=`<li class="${counts?'ok':r.ok?'mac':'bad'}">${head} ${useLine(q,q.idTok,q.idType)}${aiNote(aiR,aiErr)}${q.enMark?'':`<br><small>The sentence means: ${esc(enPlain(q))}</small>`}${!r.ok&&!mc&&!q.leaked?MARK_BTN:''}</li>`;
  $('check').textContent='Next sentence';$('check').focus();score();renderChat();
  wireMarkOk(()=>{stats.right++;score()});
}
function addXC(){
  const tok=pickXC(q);if(!tok)return;q.xc={tok,id:TY(tok.cids[0]),done:false,mc:false,open:false};
  const li=document.createElement('li');li.className='xc';li.id='xcli';li.innerHTML=`<button type="button" class="btn quiet xcbtn" id="xcbtn">+ Extra credit</button> <span class="hint">${TXT.xcHint}</span>`;
  $('feedback').appendChild(li);$('xcbtn').addEventListener('click',()=>{q.xc.open=true;renderXC();const i=$('xcin');if(i)i.focus()});
}
/* the topic label gives the extra credit away, so it starts hidden on translation problems */
function hideTopic(){const tr=q&&(q.mode==='e2l'||q.mode==='l2e');q.topicShown=!tr;$('concept').hidden=tr;$('showtopic').hidden=!tr;
  $('showtopic').textContent='Show topic';$('showtopic').title='Showing the topic voids this problem’s extra credit';}
function showTopic(){if(!q)return;q.topicShown=true;$('concept').hidden=false;$('showtopic').hidden=true;if(q.xc&&!q.xc.done)renderXC()}
const xcVoid=(qq,ty)=>qq.opened&&qq.opened.has(ty.c)?`you opened the ${USES[ty.c].name} uses chart`:qq.topicShown&&qq.topicShownEarly?'you showed the topic':'';
function renderXC(){
  const x=q.xc,li=$('xcli');if(!x||!li||!x.open)return;const ty=TYPES[x.id],cs=USES[ty.c],why=xcVoid(q,ty),voided=!!why;
  if(x.done)return;
  const keep=$('xcin')?$('xcin').value:'';
  li.innerHTML=`<b>Extra credit</b> · ${voided?`<span class="bad">${cap(why)} on this problem, so this is practice only (no XP).</span>`:`<span class="hint">+${XP_USE.typed} XP, or +${XP_USE.mc} XP with multiple choice. Showing the topic or opening the ${cs.name} uses chart voids it.</span>`}
  <p class="line xcline">${latinMarked(q,x.tok)}</p>
  <p>${useAsk(ty)} <mark class="la">${esc(phraseOf(q,x.tok))}</mark>?</p>
  <div class="row"><input type="text" id="xcin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the use" aria-label="Extra credit answer"${x.mc?' disabled':''}><button type="button" class="btn quiet" id="xcgo"${x.mc?' hidden':''}>Check</button><button type="button" class="btn quiet" id="xcmc"${x.mc?' disabled':''}>Multiple choice (${XP_USE.mc} XP)</button></div>
  <div class="choices" id="xcch"${x.mc?'':' hidden'}>${cs.list.map(u=>`<button type="button" data-xu="${u.id}">${esc(u.n)}</button>`).join('')}</div><p id="xcmsg"></p>`;
  if($('xcin'))$('xcin').value=keep;
  $('xcgo').addEventListener('click',()=>xcCheck());
  $('xcin').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();xcCheck()}});
  $('xcmc').addEventListener('click',()=>{x.mc=true;renderXC()});
  $('xcch').addEventListener('click',e=>{const u=e.target.dataset&&e.target.dataset.xu;if(u)xcCheck(u)});
}
async function xcCheck(viaMC){
  const x=q.xc;if(!x||x.done||x.busy)return;const ty=TYPES[x.id],cs=USES[ty.c];let aiR=null,aiErr='',r=viaMC?{ok:viaMC===x.id}:gradeUse(x.id,$('xcin').value);
  if(r.empty){$('xcmsg').textContent='Type a use first, or choose Multiple choice.';return}
  if(r.vague){$('xcmsg').innerHTML=`<b class="mac">Be more specific:</b> that fits more than one ${useOf(ty)}.`;return}
  if(!viaMC&&!r.ok){const cur=q,ans=$('xcin').value.trim();x.busy=true;$('xcin').disabled=$('xcgo').disabled=true;$('xcmsg').textContent=`Checking with ${aiName()}…`;
    try{aiR=await aiGradeUse(x.id,ans,q,x.tok)}catch(e){aiErr=e.message||'the AI could not be reached'}
    x.busy=false;if(cur!==q||x.done)return;if($('xcin'))$('xcin').disabled=$('xcgo').disabled=false;
    if(aiR&&aiR.vague){$('xcmsg').innerHTML=`<b class="mac">Be more specific:</b> ${esc(aiR.reason)}`;return}
    if(aiR&&aiR.ok)r={ok:true,ai:true};}
  x.done=true;const why=xcVoid(q,ty),voided=!!why,pts=r.ok&&!voided?(x.mc?XP_USE.mc:XP_USE.typed):0;
  const li=$('xcli');li.className=r.ok?(pts?'ok':'mac'):'bad';
  li.innerHTML=`<b class="${r.ok?(pts?'ok':'mac'):'bad'}">Extra credit: ${r.ok?(pts?`correct! +${pts} XP`:`correct, but no XP because ${why}`):'not quite'}.</b> ${useLine(q,x.tok,x.id)}${aiNote(aiR,aiErr)}${!r.ok&&!x.mc?MARK_BTN:''}`;
  wireMarkOk(()=>{li.className='mac'});
  if(pts)gainXP(pts,li);react(pts?'ok':r.ok?'leak':'bad');showTopic();
}
