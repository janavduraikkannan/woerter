/* ---------- Practice: starting, showing each new sentence, and the score line ----------
   The charts beside the sentence (buildCharts, renderCharts) and prep() are in site/language.js. */
async function tryStart(){
  $('keymsg').textContent='';store.set('prov',$('prov').value);
  const list=activeSlots();
  if(!list.length){if(!advanced&&!acct.key&&!slots.some(x=>x.key)){openOnb(3);return}$('keymsg').textContent=advanced?'Add a key, or turn one back on, under Edit keys.':'Paste an AI API key first. Tap ⓘ for keys that work.';if(!advanced)$('key').focus();return;}
  if(!list.some(s=>s.st)){$('startbtn').disabled=true;$('startbtn').textContent=list.length>1?'Checking keys…':'Checking key…';
    let ok=false,last=null;
    try{for(let i=0;i<list.length&&!ok;i++){const s=list[i];try{await useSlot(s);s.err='';ok=true}catch(e){last=e;s.err=e.message||'failed';if(advanced)keyNotice(s,e,list[i+1])}}}
    finally{$('startbtn').textContent='Start practice';sync();keysUI()}
    if(!ok){$('keymsg').textContent=advanced&&list.length>1?'None of your keys worked. '+(last.message||''):(last&&last.message?last.message+'.':'Could not reach the AI provider.');return}}
  start();
}
function start(){
  store.set('mode',modeSel());store.set('limit',$('limit').checked);setLimit($('limit').checked);
  stats.right=stats.total=stats.streak=0;
  $('start').hidden=true;$('bar').hidden=true;$('drill').hidden=false;window.scrollTo(0,0);next();
}
function next(){
  closeUses();q=prep(makeNext());q.opened=new Set();q.greetMood=R(GREET_MOODS);checked=false;q.chat=[];q.leaked=false;$('askq').value='';moodTok++;
  $('feedback').innerHTML='';$('check').textContent='Check answer';
  const blanks=q.choice?[]:q.tokens.filter(t=>t.blank);
  $('concept').textContent=blanks.length>1?'Mixed: '+[...new Set(blanks.map(b=>TOPICS.find(t=>b.cids.includes(t.id)&&selected.has(t.id))||q.topic).map(t=>t.name))].join(' + '):q.topic.name;
  q.mode=(q.choice||q.form)?'blank':modeSel();
  if(q.mode!=='blank')$('concept').textContent=q.topic.name;
  hideTopic();
  $('macrons').hidden=$('machint').hidden=!!q.choice||q.mode==='l2e'||q.mode==='id';$('check').hidden=!!q.choice;$('vocab').hidden=!!q.choice;
  if(q.choice){
    $('qbody').innerHTML=`<p class="line">${esc(q.line)}</p><p class="cite">${esc(q.cite)}</p><p class="english">Which device does this line show?</p><div class="choices">${q.options.map(o=>`<button data-o="${o}">${cap(o)}</button>`).join('')}</div>`;
  }else if(q.mode==='id'){
    $('qbody').innerHTML=idBody();
    $('idmc').addEventListener('click',()=>{q.usedMC=true;$('idch').hidden=false;$('qbody').querySelector('input.full').disabled=true;$('idmc').disabled=true;$('check').hidden=true;$('idnote').textContent=q.opened.has(TYPES[q.idType].c)?$('idnote').textContent:`Pick one for ${XP_USE.mc} XP.`});
    $('idch').addEventListener('click',e=>{const u=e.target.dataset&&e.target.dataset.u;if(u&&!checked){$('check').hidden=false;checkId(u)}});
    const seen=new Set();$('vlist').innerHTML=q.tokens.map(t=>t.vocab).filter(v=>v&&!seen.has(v)&&seen.add(v)).map(v=>vocabLi(v)).join('');
    const f=$('qbody').querySelector('input.full');f.focus();lastInput=f;
  }else if(q.mode!=='blank'){
    const e2l=q.mode==='e2l';q.latin=sentenceText(q)+q.end;
    $('qbody').innerHTML=`<p class="${e2l?'english':'line'}" style="margin-top:0">${esc(e2l?cap(q.en)+q.end:q.latin)}</p><input class="full" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type the whole sentence in ${e2l?LANG_NAME:'English'}" aria-label="Your translation">`;
    const seen=new Set();
    $('vlist').innerHTML=[...q.tokens.map(t=>t.vocab),...(q.extraVocab||[])].filter(v=>v&&!seen.has(v)&&seen.add(v)).map(v=>vocabLi(v)).join('');
    const f=$('qbody').querySelector('input');f.focus();lastInput=f;
  }else{
    const showForm=false;let first=true,i=0;
    const html=q.tokens.map(t=>{
      let out;
      if(t.blank){const w=Math.max(7,t.la.length+2);
        out=`<span class="blank" data-i="${i++}"><input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" style="width:${w}ch" aria-label="Form of ${esc(t.lemma)}"><small><i>${esc(t.lemma)}</i>${showForm&&!q.form?' · '+esc(t.concept):''}</small></span>`;}
      else out=`<span class="w">${esc(first?cap(t.la):t.la)}</span>`;
      first=false;return out+(t.post?`<span class="w" style="margin-left:-.38em">${t.post}</span>`:'');
    }).join('')+(q.form?'':`<span class="w" style="margin-left:-.38em">${q.end}</span>`);
    $('qbody').innerHTML=(q.form?`<p class="english" style="margin:0 0 6px">${esc(q.en)}.</p>`:'')+`<p class="sentence">${html}</p>`+(q.form?'':`<p class="english">${esc(cap(q.en))}${q.end}</p>`);
    const seen=new Set();
    $('vlist').innerHTML=q.tokens.filter(t=>t.vocab&&!seen.has(t.vocab)&&seen.add(t.vocab)).map(t=>vocabLi(t.vocab)).join('');
    const f=$('qbody').querySelector('input');if(f){f.focus();lastInput=f;}
  }
  renderCharts(q);renderChat();score();
  setFelix(q.greetMood);
}
const makeNext=()=>modeSel()==='id'?makeIdentify():tab==='build'?makeBuilt(bFrames,bIngs,$('per').value,bFocus):(tFocus.size?makeFocused(selected,tFocus):makeQuestion(selected,false));
function score(){$('score').innerHTML=`<b>${stats.right}</b> of <b>${stats.total}</b> correct · streak <b>${stats.streak}</b>`}
