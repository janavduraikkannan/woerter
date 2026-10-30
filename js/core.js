/* ---------- Core: page state, the store (localStorage), escaping and hover definitions ----------
   Loaded first of the shared scripts. LEVELS, TAUGHT and the rest of the site's data come from site/config.js. */
const $=id=>document.getElementById(id);
const bFrames=new Set(),bIngs=new Set(),bFocus=new Set(),tFocus=new Set();let tab='topics';
const selected=new Set();let q=null,checked=false,lastInput=null;
const stats={right:0,total:0,streak:0};
/* Accounts are shared by every language site: the profile, login and AI settings are global (verba.*); XP, levels, streaks and topics
   belong to one language. Verba (SITE.langKey null) keeps Latin progress under verba.* too; the others use their own prefix (mots.*). */
const LANG=SITE.langKey,GLOBAL_KEYS=['profile','login','prov','keyadv'],LANG_KEYS=['xp','days','wk','best','since','topics','bFrames','bIngs','bFocus','tFocus','per','mode','limit','tab','course'];
const SK=k=>(GLOBAL_KEYS.includes(k)?'verba.':SITE.id+'.')+k;
const store={get(k,d){try{const v=localStorage.getItem(SK(k));return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(SK(k),JSON.stringify(v))}catch(e){}try{acctDirty(k)}catch(e){}}};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Target-language words with hover definitions. In fixed text, write {word|English}; AI replies send a word→meaning map instead.
const LW=/\{([^{}|]+)\|([^{}]+)\}/g;
const LWS=(la,en)=>`<span class="lw" tabindex="0" data-en="${esc(en)}">${la}</span>`;
const latH=s=>esc(String(s)).replace(LW,(_,w,d)=>`<span class="lw" tabindex="0" data-en="${d}">${w}</span>`);
const plain=s=>String(s).replace(LW,'$1');
const cleanG=o=>{const g={};if(Array.isArray(o))o.forEach(x=>{if(x&&typeof x==='object'){const v=Object.values(x).filter(y=>typeof y==='string');if(v.length>1)g[v[0]]=v[1]}});else if(o&&typeof o==='object')Object.entries(o).forEach(([k,v])=>{g[k]=v});
  const out={};Object.entries(g).forEach(([k,v])=>{k=String(k).normalize('NFC').trim();if(k&&k.length<60&&typeof v==='string'&&v.trim())out[k]=v.trim().slice(0,140)});return out};
function glossify(el,map){
  const fold=foldWord; // site/language.js: how accents are ignored when matching words
  const keys=[...new Set(Object.keys(map||{}).map(fold))].sort((a,b)=>b.length-a.length);if(!keys.length)return;
  const low={};Object.keys(map).forEach(k=>low[fold(k)]=map[k]);
  const re=new RegExp('(?<![\\p{L}\\p{M}])('+keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\p{L}\\p{M}])','giu');
  const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('.lw,.tag,.la,code')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  nodes.forEach(n=>{const t=n.nodeValue.normalize('NFC'),ft=fold(t);re.lastIndex=0;if(!re.test(ft))return;re.lastIndex=0;
    const f=document.createDocumentFragment();let i=0,m;
    while((m=re.exec(ft))){f.append(t.slice(i,m.index));const sp=document.createElement('span');sp.className='lw';sp.tabIndex=0;sp.textContent=t.slice(m.index,m.index+m[0].length);sp.dataset.en=low[m[0]]||'';f.append(sp);i=m.index+m[0].length}
    f.append(t.slice(i));n.replaceWith(f)});
}
let moodTok=0;
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

