/* ---------- Checking answers (fill-in blanks, whole sentences, multiple choice) and the drill's buttons ----------
   Typing helpers (long vowels, accents, umlauts) and the wording of a sentence's result are in site/language.js. */
function check(){
  if(checked){next();return;}
  if(q.mode==='id')return checkId();
  if(q.mode!=='blank')return checkT();
  const blanks=q.tokens.filter(t=>t.blank),spans=[...$('qbody').querySelectorAll('.blank')];let all=true;const fb=[];
  blanks.forEach((t,i)=>{
    const inp=spans[i].querySelector('input'),r=grade(t,inp.value);inp.disabled=true;
    spans[i].classList.add(r.ok?'ok':'bad');stats.total++;if(r.ok)stats.right++;else all=false;
    const la=`<span class="la">${esc(t.la)}</span>`,what=`${esc(t.concept)} of <span class="la">${esc(t.lemma)}</span>`;
    if(r.ok&&!r.macron)fb.push(`<li class="ok"><b class="ok">Correct.</b> ${la}: ${what}</li>`);
    else if(r.ok)fb.push(`<li class="mac"><b class="ok">Correct</b>, <b class="mac">but check the ${TXT.marks}.</b> You wrote <span class="la">${esc(inp.value.trim())}</span>; the full form is ${la} (${what}).</li>`);
    else if(r.essential)fb.push(`<li class="bad"><b class="bad">Incorrect: ${TXT.markMatters} matters here.</b> <span class="la">${esc(inp.value.trim())}</span> is ${TXT.diffForm}. The answer is ${la} (${what}).</li>`);
    else fb.push(`<li class="bad"><b class="bad">Incorrect.</b> ${r.empty?'No answer given. ':''}The answer is ${la}${t.alt?' or <span class="la">'+esc(t.alt.join(', '))+'</span>':''}: ${what}</li>`);
  });
  stats.streak=all?stats.streak+1:0;
  q.submitted=spans.map(s=>s.querySelector('input').value.trim()).join(', ');q.result=all?'correct':'incorrect';react(all?'ok':'bad');
  $('feedback').innerHTML=fb.join('');checked=true;$('check').textContent='Next sentence';$('check').focus();score();
}
let busy=false;
async function checkT(){
  if(busy)return;
  const inp=$('qbody').querySelector('input.full'),e2l=q.mode==='e2l',prev=stats.streak,cur=q;
  let r=e2l?gradeLatin(q,inp.value):gradeEnglish(q,inp.value),aiR=null,aiErr='';
  inp.disabled=true;
  if(!r.ok&&!r.empty&&!r.essential){
    busy=true;$('check').disabled=true;moodTok++;setFelix('thinking');$('feedback').innerHTML=`<li>Checking with ${esc(aiName())}…</li>`;
    try{aiR=await aiGrade(q,inp.value.trim())}catch(e){aiErr=e.message||'the AI could not be reached'}
    busy=false;$('check').disabled=false;if(cur!==q)return;
    if(aiR&&aiR.ok)r={ok:true,ai:true};
  }
  const counts=r.ok&&!q.leaked;
  inp.classList.add(counts?'ok':r.ok&&q.leaked?'leak':'bad');stats.total++;if(counts)stats.right++;stats.streak=counts?prev+1:0;if(counts)award();
  q.submitted=inp.value.trim();q.result=r.ok?'correct':'incorrect';react(counts?(r.macron?'mac':'ok'):r.ok&&q.leaked?'leak':'bad');
  const model=`<span class="la">${esc(e2l?q.latin:cap(q.en)+q.end)}</span>`,order=e2l?TXT.anyOrder:'';
  const why=aiR&&aiR.reason?`<br>${latH(aiR.reason)}`:aiErr?`<br>The AI check failed (${esc(aiErr)}), so only the built-in checker ran.`:'';
  let li;
  if(r.ai)li=`<li class="ok"><b class="ok">Correct.</b>${why} The site's version: ${model}</li>`;
  else li=resultLine(r,model,why,order,e2l,inp);
  if(q.leaked&&r.ok)li=`<li class="mac"><b class="mac">Correct, but not counted.</b> Your answer was right, but a question you asked before answering was too leading, so this one doesn't count toward your score.${why} ${model}</li>`;
  else if(q.leaked){li=li.replace(/<br><button class="btn quiet" id="override">[^<]*<\/button>/,'');li+=`<li class="bad"><b class="bad">This sentence also counts as wrong</b> because one of your questions before answering was too leading.</li>`;}
  $('feedback').innerHTML=li;checked=true;$('check').textContent='Next sentence';$('check').focus();score();renderChat();
  const o=$('override');if(o)o.addEventListener('click',()=>{stats.right++;stats.streak=prev+1;o.remove();react('ok');score()});
  addXC();if(!q.xc)showTopic();
}
$('qbody').addEventListener('click',e=>{
  const o=e.target.dataset&&e.target.dataset.o;if(!o||checked)return;checked=true;
  const right=o===q.answer,ok=right&&!q.leaked;stats.total++;if(ok)stats.right++;stats.streak=ok?stats.streak+1:0;if(ok)award();q.submitted=o;q.result=right?'correct':'incorrect';react(ok?'ok':right?'leak':'bad');
  $('qbody').querySelectorAll('.choices button').forEach(b=>{b.disabled=true;if(b.dataset.o===q.answer)b.classList.add(q.leaked&&b===e.target?'leak':'ok');else if(b===e.target)b.classList.add('bad')});
  $('feedback').innerHTML=`<li class="${ok?'ok':right?'mac':'bad'}"><b class="${ok?'ok':right?'mac':'bad'}">${ok?'Correct.':right?'Correct, but not counted.':'Incorrect.'}</b>${right&&!ok?' A question you asked before answering was too leading, so this one doesn’t count toward your score.':''} ${cap(q.answer)}: ${esc(q.explain)}</li>`;renderChat();
  $('check').hidden=false;$('check').textContent='Next line';$('check').focus();score();
});
$('qbody').addEventListener('focusin',e=>{if(e.target.tagName==='INPUT')lastInput=e.target});
$('qbody').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();
  const ins=[...$('qbody').querySelectorAll('input')],i=ins.indexOf(e.target);if(i<ins.length-1)ins[i+1].focus();else check();}});
setupTyping();
$('macrons').addEventListener('click',e=>{if(e.target.tagName!=='BUTTON'||!lastInput||lastInput.disabled)return;
  const t=lastInput,p=t.selectionStart??t.value.length;t.value=t.value.slice(0,p)+e.target.textContent+t.value.slice(t.selectionEnd??p);t.focus();t.setSelectionRange(p+1,p+1);});
$('check').addEventListener('click',check);
$('askbtn').addEventListener('click',ask);
$('askq').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ask()}});
$('startbtn').addEventListener('click',tryStart);
$('back').addEventListener('click',()=>{$('drill').hidden=true;$('start').hidden=false;$('bar').hidden=false;window.scrollTo(0,0)});
