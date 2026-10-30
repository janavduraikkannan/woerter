/* ---------- Identify-the-use tab: choose the uses to drill, English or target-language sentences, AI grading for typed uses ----------
   Loaded from index.html between the engine and the main script, then js/moreuses.js adds each language's extra uses.
   Nothing here runs on load; index.html calls buildUsePane() from buildStart(), usesSync() from sync(),
   useEnMark() from makeIdentify(), idHead() from idBody(), and aiGradeUse() from checkId() and xcCheck(). */
const XP_USE={typed:3,mc:1}; // identify mode and extra credit both pay these, with no streak bonus, in either language
const uSel=new Set();
let useLang='tl'; // 'tl': sentences in the language being learned; 'en': English, with that language underneath
/* moreuses.js calls this to add a use group, or more uses to an existing one */
function addUses(group,def,list){
  if(!USES[group])USES[group]=Object.assign({list:[]},def);
  list.forEach(x=>{USES[group].list.push(x);TYPES[x.id]=Object.assign(x,{c:group})});
}
/* a use is shaded when a topic that practices it is shaded on the topics tab (TAUGHT comes from the class notes) */
function taughtUses(){
  const out=new Set();if(typeof TAUGHT==='undefined')return out;
  Object.entries(ID_TOPIC).forEach(([t,v])=>{if(TAUGHT.has(t))[].concat(v).forEach(x=>TYPES[x]&&out.add(x))});
  return out;
}
function buildUsePane(){
  Object.entries(MORE_ID_TOPIC).forEach(([k,v])=>{if(!(k in ID_TOPIC))ID_TOPIC[k]=v;else if(Array.isArray(ID_TOPIC[k]))ID_TOPIC[k]=[...new Set([...ID_TOPIC[k],...[].concat(v)])]});
  const sh=taughtUses();
  useLang=store.get('uLang','tl')==='en'?'en':'tl';
  store.get('uSel2',[]).forEach(x=>TYPES[x]&&uSel.add(x));
  if(!uSel.size)(sh.size?[...sh]:Object.keys(TYPES)).forEach(x=>uSel.add(x));
  $('useLang').innerHTML=`<b>Sentences in:</b> <label><input type="radio" name="ulang" value="tl"${useLang==='tl'?' checked':''}> ${LANG_NAME}</label> <label><input type="radio" name="ulang" value="en"${useLang==='en'?' checked':''}> English, with ${LANG_NAME} underneath</label>`;
  $('useLang').addEventListener('change',e=>{if(e.target.name==='ulang'){useLang=e.target.value;store.set('uLang',useLang)}});
  const groups=Object.keys(USES).sort((a,b)=>(USES[a].order||0)-(USES[b].order||0));
  $('useLevels').innerHTML=groups.map(k=>{const u=USES[k];return`<section class="level"><h2>${esc(u.name)}</h2><button class="all" data-c="${k}">Select all</button>`+
    u.list.map(x=>`<label class="${sh.has(x.id)?'taught':''}"><input type="checkbox" value="${x.id}"${uSel.has(x.id)?' checked':''}><span>${esc(x.n)}</span></label>`).join('')+`</section>`}).join('');
  $('useLevels').addEventListener('change',e=>{const v=e.target.value;if(!TYPES[v])return;e.target.checked?uSel.add(v):uSel.delete(v);sync()});
  $('useLevels').addEventListener('click',e=>{if(!e.target.dataset.c)return;
    const boxes=[...e.target.parentNode.querySelectorAll('input')],on=!boxes.every(b=>b.checked);
    boxes.forEach(b=>{b.checked=on;on?uSel.add(b.value):uSel.delete(b.value)});sync()});
  $('useLegend').hidden=!sh.size;
  $('pickTaughtUses').addEventListener('click',()=>{uSel.clear();sh.forEach(x=>uSel.add(x));$('useLevels').querySelectorAll('input').forEach(b=>b.checked=uSel.has(b.value));sync()});
  $('useXP').textContent=`+${XP_USE.typed} XP for a typed answer, +${XP_USE.mc} XP with multiple choice.`;
}
function usesSync(){
  const n=uSel.size;$('startbtn').disabled=!n;
  $('count').textContent=n?`${n} use${n>1?'s':''} selected`:'Choose at least one use';
  $('useLevels').querySelectorAll('.all').forEach(b=>{const boxes=[...b.parentNode.querySelectorAll('input')];b.textContent=boxes.every(x=>x.checked)?'Clear all':'Select all'});
  store.set('uSel2',[...uSel]);
}
/* "Mark my answer as correct": typed answers only, never any XP */
const MARK_BTN='<br><button type="button" class="btn quiet markok" id="markok">Mark my answer as correct</button><span class="hint">No XP</span>';
function wireMarkOk(onMark){const m=$('markok');if(!m)return;
  m.addEventListener('click',()=>{onMark();const h=m.nextElementSibling;if(h&&h.classList.contains('hint'))h.remove();m.outerHTML='<b class="mac">Marked correct (no XP).</b>';react('ok')})}
const aiNote=(aiR,aiErr)=>aiR&&aiR.reason?`<br>${esc(aiR.reason)}`:aiErr?`<br>The AI check failed (${esc(aiErr)}), so only the built-in checker ran.`:'';

/* ---------- English sentences: find the English words that match the highlighted word ---------- */
// hints written for translating, like "(use a dative of possession)", would give the use away; small markers like "(pl.)" stay
const EN_KEEP=/^\((pl|sg|f|m|formal|informal|fam)\.?\)$/i;
const enPlain=qq=>cap(String(qq.en).replace(/\s*\([^)]*\)/g,m=>EN_KEEP.test(m.trim())?m:'').replace(/\s+([,.!?])/g,'$1').replace(/\s+/g,' ').trim())+qq.end;
const EN_FUNC=new Set('the a an of with from out to for by than at into onto on in inside away my your his her its our their this that these those some any'.split(' '));
const EN_AUX=new Set('was were would will had has have is are am be been being did do does used to not could should might must shall can please'.split(' '));
const EN_PL={man:'men',woman:'women',child:'children',person:'people',foot:'feet',tooth:'teeth',mouse:'mice',goose:'geese',ox:'oxen',wife:'wives',life:'lives',knife:'knives',leaf:'leaves',wolf:'wolves',half:'halves',shelf:'shelves',thief:'thieves'};
const deacc=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const enWordsOf=s=>{const out=[];s.replace(/[A-Za-zÀ-ÿ'’]+/g,(w,i)=>{out.push({w:deacc(w).replace(/['’]s$/,'').replace(/['’]$/,''),i,j:i+w.length})});return out};
function plurals(n){const m=n.match(/^(.*?)(\S+)$/),pre=m[1],w=m[2];
  return[EN_PL[w]||'',/(s|sh|ch|x|z|o)$/.test(w)?w+'es':'',/[^aeiou]y$/.test(w)?w.slice(0,-1)+'ies':'',w+'s'].filter(Boolean).map(x=>pre+x)}
function verbForms(b){const m=b.match(/^(\S+)(.*)$/);if(!m)return[];const w=m[1],rest=m[2],cv=/[^aeiou][aeiou][bdgklmnprt]$/.test(w);
  const f=[w,/(s|sh|ch|x|z|o)$/.test(w)?w+'es':/[^aeiou]y$/.test(w)?w.slice(0,-1)+'ies':w+'s',
    /e$/.test(w)?w+'d':/[^aeiou]y$/.test(w)?w.slice(0,-1)+'ied':w+'ed',/ie$/.test(w)?w.slice(0,-2)+'ying':/[^e]e$/.test(w)?w.slice(0,-1)+'ing':w+'ing'];
  if(cv)f.push(w+w.slice(-1)+'ed',w+w.slice(-1)+'ing');
  return f.map(x=>x+rest)}
function enCands(t){
  const c=new Set(),add=p=>{p=deacc(String(p||'').trim());if(p)c.add(p)};
  (t.enHint||[]).forEach(add);
  if(t.vb){const v=t.vb;[v.e,v.past,v.pp,v.ing].forEach(add);if(v.e)verbForms(v.e).forEach(add);
    const be=String(v.e||'').match(/^be(\b.*)$/);if(be)'am is are was were been being'.split(' ').forEach(w=>add(w+be[1]));
    const hv=String(v.e||'').match(/^have(\b.*)$/);if(hv)['has','had'].forEach(w=>add(w+hv[1]));}
  else if(t.vocab){const g=t.vocab.split(' : ').slice(1).join(' : ').replace(/\([^)]*\)/g,' ');
    g.split(/[,;\/]/).map(s=>s.trim()).filter(Boolean).forEach(s=>{if(/^to /.test(s))verbForms(s.slice(3)).forEach(add);else{add(s);plurals(s).forEach(add)}})}
  else if(/^[A-ZÀ-Ý]/.test(t.la||''))add(t.la);
  return[...c];
}
function enMatches(words,cands){
  const r=[];cands.forEach(p=>{const ps=p.split(/\s+/);for(let i=0;i+ps.length<=words.length;i++)if(ps.every((x,k)=>words[i+k].w===x))r.push([i,i+ps.length-1])});
  return r.filter((a,k)=>!r.some((b,m)=>m!==k&&b[0]<=a[0]&&b[1]>=a[1]&&b[1]-b[0]>a[1]-a[0])).filter((a,k,arr)=>arr.findIndex(b=>b[0]===a[0]&&b[1]===a[1])===k).sort((a,b)=>a[0]-b[0]);
}
/* when the English has more than one candidate, use word order or the verb's tense to pick; give up if it's still unclear */
function pickRange(qq,t,words,rs){
  if(rs.length===1)return rs[0];
  const same=qq.tokens.filter(x=>x.lemma&&x.lemma===t.lemma),k=same.indexOf(t);
  if(same.length===rs.length&&k>=0)return rs[k];
  const before=r=>words.slice(Math.max(0,r[0]-2),r[0]).map(x=>x.w).join(' '),tt=String(t.t||'');
  const f=/^(impf|imp)$/.test(tt)?r=>/(used to|was|were)$/.test(before(r))
    :/^(pret|perf|pc|praet|pqp|plup)$/.test(tt)?r=>!/(used to|would|will|to|was|were)$/.test(before(r))
    :/cond|k2/.test(tt)||(t.cids||[]).some(c=>/cond|k2/.test(c))?r=>/(would|could|should)$/.test(before(r)):null;
  if(f){const g=rs.filter(f);if(g.length===1)return g[0]}
  return null;
}
function idSpan(qq,tok){
  if(typeof spanIdx==='function')return spanIdx(qq,tok);
  const i=qq.tokens.indexOf(tok);return[isPrepTok(qq.tokens[i-1])?i-1:i,i+(tok.span||0)];
}
function enMark(qq){
  const text=enPlain(qq),words=enWordsOf(text),tok=qq.idTok,[a,b]=idSpan(qq,tok);
  let lo=1e9,hi=-1,verb=false,after=false;
  for(let j=a;j<=b;j++){const t=qq.tokens[j];if(!t||t.hide)continue;
    const rs=enMatches(words,[...enCands(t),...(t===tok&&TYPES[qq.idType].enWords||[])]);if(!rs.length)continue;
    const r=pickRange(qq,t,words,rs);if(!r){if(t===tok)return null;continue}
    lo=Math.min(lo,r[0]);hi=Math.max(hi,r[1]);if(t.vb||(t.cids||[]).some(c=>/cond|k2|aux/.test(c)))verb=true;if(j>qq.tokens.indexOf(tok))after=true;}
  if(hi<0)return null;
  const set=verb?EN_AUX:EN_FUNC;while(lo>0&&set.has(words[lo-1].w))lo--;
  // a preposition like por or para: take in the words it governs
  if(tok.span&&!tok.vb&&!after){let n=qq.tokens.slice(qq.tokens.indexOf(tok)+1,b+1).filter(t=>!t.hide&&!(t.cids||[]).includes('art')).length;
    while(hi+1<words.length&&EN_FUNC.has(words[hi+1].w))hi++;while(n-->0&&hi+1<words.length)hi++;}
  // a phrase set off by a comma (the ablative absolute) runs to that comma
  if(TYPES[qq.idType].enToComma){const c=text.indexOf(',',words[lo].i);if(c>0)while(hi+1<words.length&&words[hi+1].j<=c)hi++}
  if(hi-lo>8)return null;
  const s=words[lo].i,e=words[hi].j;
  return{html:esc(text.slice(0,s))+'<mark>'+esc(text.slice(s,e))+'</mark>'+esc(text.slice(e)),phrase:text.slice(s,e)};
}
/* makeIdentify skips a sentence when English mode can't find its English words */
function useEnMark(qq){if(useLang!=='en'){qq.enMark=null;return true}qq.enMark=enMark(qq);return!!qq.enMark}
function idHead(ty){
  const tl=latinMarked(q,q.idTok),ph=esc(phraseOf(q,q.idTok)),ask=useAsk(ty);
  if(q.enMark)return`<p class="english useen" style="margin-top:0">${q.enMark.html}</p><p class="line usetl">${tl}</p><p class="english">${ask} <mark>${esc(q.enMark.phrase)}</mark> <span class="la">(${ph})</span>?</p>`;
  return`<p class="line" style="margin-top:0">${tl}</p><p class="english">${ask} <mark class="la">${ph}</mark>?</p>`;
}

/* The built-in matcher runs first; this only sees typed answers it rejected, so it can accept paraphrases like "made of" for material. */
async function aiGradeUse(id,answer,qq,tok){
  const ty=TYPES[id],cs=USES[ty.c],line=latinMarked(qq,tok).replace(/<\/?mark>/g,'**').replace(/<[^>]+>/g,'');
  const t=await aiChat([{role:'system',content:'You grade a grammar exercise for a high school student. The student sees a sentence with one word or phrase highlighted (between ** marks) and must name which use of a grammatical form it shows. '+
    'Decide whether the student named the correct use. Accept the textbook name, other common textbook names, synonyms, paraphrases, partial names that still point only to the correct use, and misspellings. For example, for a genitive of material, "material of which", "made of" and "materialistic" are all correct. '+
    'Mark it wrong if it names or describes a different use from the list, names a different grammatical form, or is not an attempt at an answer. Mark it vague only if it fits two or more uses in the list equally well. '+
    'Reply with JSON only: {"verdict":"correct"|"wrong"|"vague","reason":"one short sentence to the student about their answer"}. If the verdict is vague, the reason must not name or hint at the correct use.'},
    {role:'user',content:`Form: ${cs.name}\nAll uses of this form the student has learned: ${cs.list.map(x=>`${x.n} (${x.what})`).join('; ')}\nCorrect use: ${ty.n} (${ty.what})\nSentence: ${line}${qq.enMark?`\nEnglish shown to the student: ${qq.enMark.html.replace(/<\/?mark>/g,'**').replace(/&[a-z#0-9]+;/g,"'")}`:''}\nStudent's answer: ${answer}`}]);
  const j=parseJ(t),v=String(j.verdict||'').toLowerCase();
  return{ok:v==='correct',vague:v==='vague',reason:String(j.reason||'')};
}
