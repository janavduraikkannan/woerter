/* ---------- German: how the language behaves in the shared practice code ----------
   Each piece here is called by a shared script (named beside it). Grammar itself is in engine.js. */
/* js/core.js glossify(): fold a word so accents don't stop a hover definition from matching */
const foldWord=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').normalize('NFC').toLowerCase();
/* capitalize the first letter, after any opening ¿ ¡ or highlight marker */
const capES=s=>String(s).replace(/^([¿¡\u0001]*)(\p{L})/u,(m,a,b)=>a+b.toUpperCase());
/* js/drill.js next(): the sentence as shown, without its end mark */
const sentenceText=q=>capES(q.display);
/* js/drill.js: get a new question ready */
function prep(x){x.mode=(x.choice||x.form)?'blank':modeSel();if(!x.choice)x.latin=capES(x.display)+x.end;x.greeting=R(GREETINGS);return x}
/* ---------- charts beside the sentence: buildCharts() runs once at start-up, renderCharts(q) on every new sentence ---------- */
function buildCharts(){
  const set=h=>{$('cbody').hidden=h;$('ctoggle').textContent=h?'Show':'Hide';store.set('chartsHidden',h)};
  $('ctoggle').addEventListener('click',()=>set(!$('cbody').hidden));set(store.get('chartsHidden',false));
}
const PRS=['ich','du','er, sie, es','wir','ihr','sie, Sie'];
function conjT(cap_,verbs,t,note){
  return `<div class="cwrap"><table><caption>${cap_}</caption><tr><th></th>${verbs.map(v=>`<th>${v.replace('|','')}</th>`).join('')}</tr>${[0,1,2,3,4,5].map(p=>`<tr><th>${PRS[p]}</th>${verbs.map(v=>`<td>${esc(vphrase(vb(v.replace('|','')),t,p))}</td>`).join('')}</tr>`).join('')}</table>${note?`<p class="hint">${note}</p>`:''}</div>`}
function listT(cap_,head,rows,note){return `<div class="cwrap"><table><caption>${cap_}</caption><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map((c,i)=>i?`<td>${c}</td>`:`<th>${c}</th>`).join('')}</tr>`).join('')}</table>${note?`<p class="hint">${note}</p>`:''}</div>`}
const CASES4=['Nom.','Acc.','Dat.','Gen.'];
const CHARTS={
  pres:()=>conjT('Present tense: regular verbs',['spielen','arbeiten','tanzen'],'pres','Endings: -e, -st, -t, -en, -t, -en. A stem in -t or -d adds an e (du arbeitest); a stem in -s, -ß or -z just adds -t for du (du tanzt). Separable verbs send the prefix to the end: ich rufe dich an.'),
  irrpres:()=>conjT('Present tense: stem-changing verbs',['fahren','laufen','essen','lesen'],'pres','Only du and er/sie/es change: a → ä (fährt), au → äu (läuft), e → i (isst, nimmt), e → ie (liest, sieht).'),
  shw:()=>conjT('sein, haben, werden, wissen',['sein','haben','werden','wissen'],'pres',''),
  art:()=>listT('Articles by case',['','m.','f.','n.','pl.'],[
    ['<b>the</b>','','','',''],...CASES4.map((c,i)=>[c,...['m','f','n','pl'].map(g=>DEF[g][i])]),
    ['<b>a / no / my</b>','','','',''],...CASES4.map((c,i)=>[c,...['m','f','n','pl'].map(g=>g==='pl'?'– / keine / meine'.replace('keine',einW('kein',g,['nom','akk','dat','gen'][i])).replace('meine',einW('mein',g,['nom','akk','dat','gen'][i])):einW('ein',g,['nom','akk','dat','gen'][i]))])],
    'Only the masculine changes between nominative and accusative (der → den, ein → einen). Dative plural nouns add -n (den Kindern). kein and every possessive (mein, dein, sein, ihr, unser, euer, Ihr) take the endings of ein. dieser follows der: dieser, diesen, diesem, dieses.'),
  adj:()=>['weak','mixed','strong'].map(k=>listT(`Adjective endings ${{weak:'after der, dieser (weak)',mixed:'after ein, kein, mein (mixed)',strong:'with no article (strong)'}[k]}`,['','m.','f.','n.','pl.'],CASES4.map((c,i)=>[c,...['m','f','n','pl'].map(g=>'-'+ADJ_END[k][g][i])]),k==='strong'?'With no article, the adjective shows the case itself, like der/die/das would (heißer Kaffee, mit kaltem Wasser).':'')).join(''),
  pron:()=>listT('Personal pronouns',['','nominative','accusative','dative'],[['I, me','ich','mich','mir'],['you','du','dich','dir'],['he, him','er','ihn','ihm'],['she, her','sie','sie','ihr'],['it','es','es','ihm'],['we, us','wir','uns','uns'],['you all','ihr','euch','euch'],['they, them','sie','sie','ihnen'],['you (formal)','Sie','Sie','Ihnen']],'Two pronouns: accusative before dative (Ich gebe es ihm). A pronoun and a noun: the pronoun goes first.'),
  prep:()=>listT('Prepositions and their cases',['case','prepositions'],[['accusative','durch, für, gegen, ohne, um'],['dative','aus, bei, mit, nach, seit, von, zu'],['two-way','an, auf, hinter, in, neben, über, unter, vor, zwischen: accusative for movement (wohin?), dative for position (wo?)'],['genitive','wegen, trotz, während, statt'],['contractions','im = in dem, ins = in das, am = an dem, zum = zu dem, zur = zu der, beim = bei dem, vom = von dem']],''),
  perf:()=>listT('Perfect tense: haben or sein + past participle (at the end)',['','haben','sein'],[0,1,2,3,4,5].map(p=>[PRS[p],presF(SPECIAL.haben,p),presF(SPECIAL.sein,p)]),'Regular: ge- + stem + -t (gespielt). Irregular: ge- + stem + -en, often with a new vowel (gefahren, getrunken). Separable: the ge- goes after the prefix (angerufen). No ge- for be-, ver-, er- verbs or -ieren verbs (besucht). sein for movement and change of state (ist gegangen, ist aufgestanden), and for sein and bleiben. Past perfect: hatte or war + participle.'),
  praet:()=>conjT('Simple past (Präteritum)',['spielen','fahren','sein','haben'],'praet','Regular verbs add -te: spielte, spieltest. Irregular verbs change the stem and have no ending for ich and er/sie/es: fuhr, ging, aß. Modals: konnte, musste, durfte, sollte, wollte.'),
  modal:()=>listT('Modal verbs (+ infinitive at the end)',['','können','müssen','dürfen','sollen','wollen','möchten'],[0,1,2,3,4,5].map(p=>[PRS[p],...['können','müssen','dürfen','sollen','wollen','möchten'].map(m=>presF(SPECIAL[m],p))]),'ich and er/sie/es have no ending. Careful: nicht müssen means “don’t have to”; “must not” is nicht dürfen.'),
  fut:()=>listT('Future: werden + infinitive (at the end)',['','werden'],[0,1,2,3,4,5].map(p=>[PRS[p],presF(SPECIAL.werden,p)]),'Ich werde morgen Fußball spielen. German often uses the present with a time word for the future too: Morgen spiele ich Fußball.'),
  k2:()=>listT('Subjunctive II (would, were, had)',['','würde','wäre','hätte','könnte'],[0,1,2,3,4,5].map(p=>[PRS[p],WURDE[p],k2F(SPECIAL.sein,p),k2F(SPECIAL.haben,p),k2F(SPECIAL.können,p)]),'würde + infinitive for most verbs (ich würde spielen); sein, haben and the modals use their own forms. Past: hätte or wäre + participle (ich hätte gespielt). Wenn ich Zeit hätte, würde ich …'),
  pass:()=>listT('Passive: werden + past participle (at the end)',['','present','simple past'],[0,1,2,3,4,5].map(p=>[PRS[p],presF(SPECIAL.werden,p),praetF(SPECIAL.werden,p)]),'Das Buch wird gelesen (is read). Das Buch wurde gelesen (was read). By someone: von + dative (vom Lehrer).'),
  rel:()=>listT('Relative pronouns',['','m.','f.','n.','pl.'],CASES4.map((c,i)=>[c,...['m','f','n','pl'].map(g=>RELP[g][i])]),'Gender and number come from the noun it refers to; the case comes from its job in the relative clause. A comma comes before it, and the verb goes to the end: der Mann, den ich kenne.'),
  cmd:()=>listT('Commands',['','du','ihr','Sie'],[['spielen','spiel(e)!','spielt!','spielen Sie!'],['fahren','fahr!','fahrt!','fahren Sie!'],['essen','iss!','esst!','essen Sie!'],['anrufen','ruf … an!','ruft … an!','rufen Sie … an!'],['sein','sei!','seid!','seien Sie!']],'du: the stem, no -st; e → i verbs keep the change (iss, nimm, lies), a → ä verbs don’t (fahr, schlaf).'),
  order:()=>listT('Word order',['','rule'],[['statement','the conjugated verb is the 2nd element: Heute spiele ich Fußball.'],['question','the verb comes first, or right after the question word: Spielst du? Wann spielst du?'],['verb at the end','after weil, dass, wenn, ob and relative pronouns: …, weil ich müde bin.'],['two verbs','infinitives and participles go to the end: Ich kann heute nicht kommen.'],['separable verbs','the prefix goes to the end: Ich rufe dich morgen an.'],['in the middle','time, manner, place (heute, mit dem Bus, in die Stadt); nicht before places and the verb at the end']],'')
};
function renderCharts(qq){
  const ids=(qq&&qq.charts&&qq.charts.length?qq.charts:['pres']).filter(id=>CHARTS[id]);
  $('cbody').innerHTML=ids.map(id=>CHARTS[id]()).join('');
}
/* ---------- identify the use (js/identify.js) ---------- */
const normU=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z ]/g,' ').replace(/\b(nominative|accusative|dative|genitive|nominativ|akkusativ|dativ|genitiv|case|kasus|the|use|usage|it|is|its|this|type|for a|for an|a|an)\b/g,' ').replace(/\s+/g,' ').trim();
/* the highlighted words: the token itself plus any words it governs (por el parque) */
function spanIdx(qq,tok){const i=qq.tokens.indexOf(tok);return[i,i+(tok.span||0)]}
function phraseOf(qq,tok){const[a,b]=spanIdx(qq,tok);return contract(qq.tokens.slice(a,b+1).filter(t=>!t.hide).map(t=>t.la).join(' '))}
function latinMarked(qq,tok){
  const[a,b]=spanIdx(qq,tok),pre='';
  const words=[];qq.tokens.forEach((t,j)=>{if(t.hide)return;words.push({w:t.la+(t.post||''),m:j>=a&&j<=b})});
  let txt=words.map((x,i)=>(x.m?'\u0001':'')+x.w+(x.m?'\u0002':'')).join(' ');
  txt=contract(txt.replace(/\u0002 \u0001/g,' '));txt=capES(pre+txt.replace(/^\u0001/,'').replace(/^/,txt.startsWith('\u0001')?'\u0001':''));
  return esc(txt).replace(/\u0001/g,'<mark>').replace(/\u0002/g,'</mark>')+qq.end;
}
function pickXC(qq){
  if(!qq||qq.choice||!qq.tokens)return null;
  const c=qq.tokens.filter(t=>t.cids&&TY(t.cids[0])&&!XC_SKIP(t,qq));if(!c.length)return null;
  const pref=qq.topic&&ID_TOPIC[qq.topic.id],a=pref&&c.find(t=>pref.includes(TY(t.cids[0])));if(a)return a;
  return R(c);
}
function makeIdentify(){
  const fromIds=ids=>[...new Set(ids.flatMap(t=>ID_TOPIC[t]||[]))];
  const ft=fromIds([...tFocus]);let types=tab==='uses'?[...uSel]:tab==='build'?[]:(ft.length?ft:fromIds([...selected]));
  if(!types.length)types=Object.keys(TYPES).filter(x=>!/^gen/.test(x)||[...selected].some(t=>/^gen/.test(t)));
  for(let tries=0;tries<200;tries++){
    const ty=R(types);ALT=[];let qq;try{qq=TYPES[ty].gen?TYPES[ty].gen():idQuestion(ty)}catch(e){continue}
    const tok=qq.tokens.find(t=>t.cids&&TY(t.cids[0])===ty);if(!tok)continue;
    qq.idType=ty;qq.idTok=tok;if(!useEnMark(qq))continue;qq.topic={id:'identify',level:{nom:'I',akk:'I',dat:'II',gen:'III'}[TYPES[ty].c],name:'Identify: uses of the '+USES[TYPES[ty].c].name.toLowerCase()};
    qq.topic.level=TYPES[ty].level||USES[TYPES[ty].c].level||qq.topic.level||'I';
    return qq;
  }
  return makeQuestion(selected.size?selected:new Set(['nomakk']));
}
/* js/check.js checkT(): the feedback line for a checked translation (r: the grader's result) */
function resultLine(r,model,why,order,e2l,inp){
  let li;
  if(r.ok&&!r.macron&&!r.caps)li=`<li class="ok"><b class="ok">Correct.</b> ${model}</li>`;
  else if(r.ok&&r.caps)li=`<li class="mac"><b class="ok">Correct</b>, <b class="mac">but German nouns start with a capital letter:</b> <span class="la">${esc(r.caps.join(', '))}</span>. ${model}</li>`;
  else if(r.ok)li=`<li class="mac"><b class="ok">Correct</b>, <b class="mac">but check the umlauts.</b> With every umlaut: ${model}</li>`;
  else if(r.essential&&r.formal)li=`<li class="bad"><b class="bad">Incorrect: the capital letter matters here.</b> <span class="la">${esc(r.essential.join(', '))}</span> means “they” or “she”; formal “you” is <span class="la">Sie</span>, with a capital S. The answer is ${model}</li>`;
  else if(r.essential)li=`<li class="bad"><b class="bad">Incorrect: the umlaut matters here.</b> <span class="la">${esc(r.essential.join(', '))}</span> is a different word or form. The answer is ${model}</li>`;
  else{const notes=e2l&&!r.empty?explainDE(q,inp.value):[];li=`<li class="bad"><b class="bad">${r.empty?'No answer given.':'Incorrect.'}</b>${why}${why?'<br>':' '}One correct answer: ${model}${order}${notes.length?'<ul class="why">'+notes.map(n=>'<li>'+n+'</li>').join('')+'</ul>':''}${r.empty?'':'<br><button class="btn quiet" id="override">Count my answer as correct</button>'}</li>`;}
  return li;
}
/* js/check.js: typing helpers in the answer box and the question box, and the letter buttons */
function setupTyping(){
  const MAC={'a:':'ä','o:':'ö','u:':'ü','A:':'Ä','O:':'Ö','U:':'Ü','a"':'ä','o"':'ö','u"':'ü','A"':'Ä','O"':'Ö','U"':'Ü','s:':'ß'};
  const accType=(t,only)=>{const p=t.selectionStart,v=t.value,k=v.slice(p-2,p);if(p>1&&MAC[k]&&(!only||only.includes(k[1]))){t.value=v.slice(0,p-2)+MAC[k]+v.slice(p);t.setSelectionRange(p-1,p-1)}};
  $('qbody').addEventListener('input',e=>{const t=e.target;if(t.tagName!=='INPUT'||q.mode==='l2e'||q.mode==='id')return;accType(t)});
  $('macrons').innerHTML=['ä','ö','ü','ß','Ä','Ö','Ü'].map(c=>`<button type="button" aria-label="Insert ${c}">${c}</button>`).join('');
  $('askq').addEventListener('input',e=>accType(e.target,'"'));
}
/* js/vocab.js: the word to type when a vocabulary line is clicked */
function vocabWords(v){
  const i=v.indexOf(' : '),la=(i<0?v:v.slice(0,i)).trim(),en=i<0?'':v.slice(i+3).trim();
  let laW;const plain=la.replace(/\s*\([^)]*\)/g,'').trim();
  const plainD=plain.replace(/\|/g,'');if(/^(der|die|das) \S+/.test(plainD))laW=plainD.split(' ')[1].replace(/,$/,'');
  else if(/\|/.test(plain))laW=plainD.split(/[ ,]/)[0];
  else if(!/[,;/]/.test(plain)&&plain.split(' ').length<=3&&!/…/.test(plain))laW=plain;
  else laW=(plain.match(/^[^\s,(/]+/)||[plain])[0];
  const enW=en.split(/[;,]/)[0].replace(/\([^)]*\)/g,'').replace(/^to /,'').replace(/\s+/g,' ').trim()||en;
  return{la:laW,en:enW};
}
