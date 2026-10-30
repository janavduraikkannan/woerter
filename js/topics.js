/* ---------- Start screen: topic levels, build-your-own lists, focus buttons and the start bar ---------- */
function buildStart(){
  store.get('topics',[]).forEach(id=>TOPICS.some(t=>t.id===id)&&selected.add(id));
  store.get('tFocus',[]).forEach(id=>selected.has(id)&&tFocus.add(id));
  $('levels').innerHTML=LEVELS.map(([lv,name])=>{
    const ts=TOPICS.filter(t=>t.level===lv),groups=[...new Set(ts.map(t=>t.group))];
    return `<section class="level"><h2><span class="num">${lv}</span>${name}</h2><button class="all" data-lv="${lv}">Select all</button>`+
      groups.map(g=>`<h3>${g}</h3>`+ts.filter(t=>t.group===g).map(t=>`<div class="frow${tFocus.has(t.id)?' focused':''}"><label class="${TAUGHT.has(t.id)?'taught':''}"><input type="checkbox" value="${t.id}" ${selected.has(t.id)?'checked':''}><span>${esc(t.name)}</span></label><button type="button" class="fbtn" data-t="${t.id}" aria-pressed="${tFocus.has(t.id)}" aria-label="Focus on ${esc(t.name)}">Focus</button></div>`).join('')).join('')+`</section>`;
  }).join('');
  $('levels').addEventListener('change',e=>{if(e.target.value){e.target.checked?selected.add(e.target.value):(selected.delete(e.target.value),tFocus.delete(e.target.value));tFocusUI();sync();}});
  $('levels').addEventListener('click',e=>{
    const fb=e.target.closest('.fbtn');
    if(fb){const v=fb.dataset.t;if(tFocus.has(v))tFocus.delete(v);else{tFocus.add(v);selected.add(v);fb.parentNode.querySelector('input').checked=true}tFocusUI();sync();return}
    const lv=e.target.dataset.lv;if(!lv)return;
    const boxes=[...e.target.parentNode.querySelectorAll('input')],on=!boxes.every(b=>b.checked);
    boxes.forEach(b=>{b.checked=on;on?selected.add(b.value):(selected.delete(b.value),tFocus.delete(b.value))});tFocusUI();sync();});
  const m0=document.querySelector(`input[name=mode][value=${store.get('mode','e2l')}]`);if(m0)m0.checked=true;
  $('legend').hidden=!TAUGHT.size;$('pickTaught').addEventListener('click',()=>{document.querySelectorAll('#levels input').forEach(b=>{if(TAUGHT.has(b.value)){b.checked=true;selected.add(b.value)}});sync()});
  $('limit').checked=store.get('limit',SITE.limitDefault);
  $('prov').value=store.get('prov','auto');
  store.get('bFrames',[]).forEach(x=>FRAMES.some(f=>f[0]===x)&&bFrames.add(x));store.get('bIngs',[]).forEach(x=>ING_ALL.some(f=>f[0]===x)&&bIngs.add(x));
  store.get('bFocus',[]).forEach(x=>(bFrames.has(x)||bIngs.has(x))&&bFocus.add(x));
  $('per').value=store.get('per','2');
  $('frames').innerHTML=FRAMES.map(([id,name])=>`<div class="frow${bFocus.has(id)?' focused':''}"><label class="taught"><input type="checkbox" value="${id}" ${bFrames.has(id)?'checked':''}><span>${esc(name)}</span></label><button type="button" class="fbtn" data-f="${id}" aria-pressed="${bFocus.has(id)}" aria-label="Focus on ${esc(name)}">Focus</button></div>`).join('');
  const groups=[...new Set(ING_ALL.map(x=>x[2]))];
  $('ings').innerHTML=groups.map(g=>`<div><h3>${g}</h3>`+ING_ALL.filter(x=>x[2]===g).map(([id,name])=>`<div class="frow${bFocus.has(id)?' focused':''}"><label class="taught"><input type="checkbox" value="${id}" ${bIngs.has(id)?'checked':''}><span>${esc(name)}</span></label><button type="button" class="fbtn" data-f="${id}" aria-pressed="${bFocus.has(id)}" aria-label="Focus on ${esc(name)}">Focus</button></div>`).join('')+'</div>').join('');
  $('frames').addEventListener('change',e=>{const v=e.target.value;e.target.checked?bFrames.add(v):(bFrames.delete(v),bFocus.delete(v));focusUI();sync()});
  $('ings').addEventListener('change',e=>{const v=e.target.value;e.target.checked?bIngs.add(v):(bIngs.delete(v),bFocus.delete(v));focusUI();sync()});
  $('paneBuild').addEventListener('click',e=>{const b=e.target.closest('.fbtn');if(!b)return;const v=b.dataset.f,isF=FRAMES.some(f=>f[0]===v);
    if(bFocus.has(v))bFocus.delete(v);else{bFocus.add(v);(isF?bFrames:bIngs).add(v);b.parentNode.querySelector('input').checked=true;}
    focusUI();sync()});
  $('per').addEventListener('change',()=>store.set('per',$('per').value));
  const setTab=t=>{if(!['topics','build','uses'].includes(t))t='topics';tab=t;[['topics','Topics'],['build','Build'],['uses','Uses']].forEach(([k,n])=>{$('tab'+n).setAttribute('aria-selected',t===k);$('pane'+n).hidden=t!==k});document.querySelector('#bar fieldset').hidden=t==='uses';store.set('tab',t);sync()};
  $('tabTopics').addEventListener('click',()=>setTab('topics'));$('tabBuild').addEventListener('click',()=>setTab('build'));$('tabUses').addEventListener('click',()=>setTab('uses'));
  buildUsePane();
  setTab(store.get('tab','topics'));
}
function tFocusUI(){document.querySelectorAll('#levels .fbtn').forEach(b=>{const on=tFocus.has(b.dataset.t);b.setAttribute('aria-pressed',on);b.parentNode.classList.toggle('focused',on)})}
function focusUI(){document.querySelectorAll('#paneBuild .fbtn').forEach(b=>{const on=bFocus.has(b.dataset.f);b.setAttribute('aria-pressed',on);b.parentNode.classList.toggle('focused',on)})}
function sync(){
  if(tab==='uses'){usesSync();return}
  if(tab==='build'){
    const n=bFrames.size;$('startbtn').disabled=!n;
    $('count').textContent=n?`${n} sentence type${n>1?'s':''}, ${bIngs.size} item${bIngs.size===1?'':'s'} inside`+(bFocus.size?`, ${bFocus.size} in focus`:''):'Choose at least one main sentence type';
    const gapOnly=[...bFrames].every(f=>f==='gap'),condOnly=[...bFrames].every(f=>f==='condP'||f==='condF');
    $('buildnote').textContent=bFrames.size&&gapOnly?'Gapping only uses adjectives, adverbs, the future, the passive and the ablative of agent; other items are skipped.':bFrames.size&&condOnly&&bIngs.has('fut')?'Open conditions set their own tense, so “Future tense” is skipped.':'';
    store.set('bFrames',[...bFrames]);store.set('bIngs',[...bIngs]);store.set('bFocus',[...bFocus]);
    return;
  }
  const n=selected.size;$('startbtn').disabled=!n;
  $('count').textContent=n?`${n} topic${n>1?'s':''} selected`+(tFocus.size?`, ${tFocus.size} in focus`:''):'Choose at least one topic';
  document.querySelectorAll('.all').forEach(b=>{const boxes=[...b.parentNode.querySelectorAll('input')];b.textContent=boxes.every(x=>x.checked)?'Clear all':'Select all'});
  store.set('topics',[...selected]);store.set('tFocus',[...tFocus]);
}
const mixed=()=>document.querySelector('input[name=style]:checked').value==='mixed';
const modeSel=()=>tab==='uses'?'id':document.querySelector('input[name=mode]:checked').value;
