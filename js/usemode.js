/* ---------- Identify-the-use tab: choose the uses to drill, AI grading for typed uses ----------
   Loaded from index.html between the engine and the main script. Nothing here runs on load;
   index.html calls buildUsePane() from buildStart(), usesSync() from sync(), and aiGradeUse() from checkId() and xcCheck(). */
const XP_USE={typed:3,mc:1}; // identify mode and extra credit both pay these, with no streak bonus
const uSel=new Set();
function buildUsePane(){
  store.get('uSel',[]).forEach(x=>TYPES[x]&&uSel.add(x));
  if(!uSel.size)Object.keys(TYPES).forEach(x=>uSel.add(x));
  $('useLevels').innerHTML=Object.entries(USES).map(([k,u])=>`<section class="level"><h2>${esc(u.name)}</h2><button class="all" data-c="${k}">Select all</button>`+
    u.list.map(x=>`<label><input type="checkbox" value="${x.id}"${uSel.has(x.id)?' checked':''}><span>${esc(x.n)}</span></label>`).join('')+`</section>`).join('');
  $('useLevels').addEventListener('change',e=>{const v=e.target.value;if(!TYPES[v])return;e.target.checked?uSel.add(v):uSel.delete(v);sync()});
  $('useLevels').addEventListener('click',e=>{if(!e.target.dataset.c)return;
    const boxes=[...e.target.parentNode.querySelectorAll('input')],on=!boxes.every(b=>b.checked);
    boxes.forEach(b=>{b.checked=on;on?uSel.add(b.value):uSel.delete(b.value)});sync()});
  $('useXP').textContent=`+${XP_USE.typed} XP for a typed answer, +${XP_USE.mc} XP with multiple choice.`;
}
function usesSync(){
  const n=uSel.size;$('startbtn').disabled=!n;
  $('count').textContent=n?`${n} use${n>1?'s':''} selected`:'Choose at least one use';
  $('useLevels').querySelectorAll('.all').forEach(b=>{const boxes=[...b.parentNode.querySelectorAll('input')];b.textContent=boxes.every(x=>x.checked)?'Clear all':'Select all'});
  store.set('uSel',[...uSel]);
}
/* "Mark my answer as correct": typed answers only, never any XP */
const MARK_BTN='<br><button type="button" class="btn quiet markok" id="markok">Mark my answer as correct</button><span class="hint">No XP</span>';
function wireMarkOk(onMark){const m=$('markok');if(!m)return;
  m.addEventListener('click',()=>{onMark();const h=m.nextElementSibling;if(h&&h.classList.contains('hint'))h.remove();m.outerHTML='<b class="mac">Marked correct (no XP).</b>';react('ok')})}
const aiNote=(aiR,aiErr)=>aiR&&aiR.reason?`<br>${esc(aiR.reason)}`:aiErr?`<br>The AI check failed (${esc(aiErr)}), so only the built-in checker ran.`:'';
/* The built-in matcher runs first; this only sees typed answers it rejected, so it can accept paraphrases like "made of" for material. */
async function aiGradeUse(id,answer,qq,tok){
  const ty=TYPES[id],cs=USES[ty.c],line=latinMarked(qq,tok).replace(/<\/?mark>/g,'**').replace(/<[^>]+>/g,'');
  const t=await aiChat([{role:'system',content:'You grade a grammar exercise for a high school student. The student sees a sentence with one word or phrase highlighted (between ** marks) and must name which use of a grammatical form it shows. '+
    'Decide whether the student named the correct use. Accept the textbook name, other common textbook names, synonyms, paraphrases, partial names that still point only to the correct use, and misspellings. For example, for a genitive of material, "material of which", "made of" and "materialistic" are all correct. '+
    'Mark it wrong if it names or describes a different use from the list, names a different grammatical form, or is not an attempt at an answer. Mark it vague only if it fits two or more uses in the list equally well. '+
    'Reply with JSON only: {"verdict":"correct"|"wrong"|"vague","reason":"one short sentence to the student about their answer"}. If the verdict is vague, the reason must not name or hint at the correct use.'},
    {role:'user',content:`Form: ${cs.name}\nAll uses of this form the student has learned: ${cs.list.map(x=>`${x.n} (${x.what})`).join('; ')}\nCorrect use: ${ty.n} (${ty.what})\nSentence: ${line}\nStudent's answer: ${answer}`}]);
  const j=parseJ(t),v=String(j.verdict||'').toLowerCase();
  return{ok:v==='correct',vague:v==='vague',reason:String(j.reason||'')};
}
