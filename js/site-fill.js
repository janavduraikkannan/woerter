/* ---------- Fills in the site-specific parts of a shared page (index.html, keys.html, getkey.html) ----------
   Runs at the end of <body>, before every other script. Values come from site/config.js.
   <template data-s="key"></template>      is replaced by FILL[key]()   (text or HTML)
   data-s-attr="attr=key;attr2=key:arg"     sets each attribute to FILL[key](arg) */
(function(){
  const img=f=>`img/${SITE.catDir}/${f}.svg?v=${SITE.catV}`;
  const FILL={
    name:()=>SITE.name, cat:()=>SITE.cat, lang:()=>LANG_NAME,
    face:f=>img(f), pageFace:f=>`img/${SITE.catDir}/${f}.svg`,
    catThe:()=>`${SITE.cat} the cat`, catOfSite:()=>`${SITE.cat}, the ${SITE.name} cat`, catHappy:()=>`${SITE.cat} looking happy`,
    askLabel:()=>`Your question for ${SITE.cat}`, acctIcon:()=>'#gi-'+SITE.acctIcon,
    heroH1:()=>`Learn ${LANG_NAME} by <em>writing</em> it.`,
    courseSelect:()=>'<select id="bCourse" aria-label="Course"><option value="">All courses</option>'+LEVELS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')+`<option value="done">Finished ${LANG_NAME}</option></select>`,
    nav:()=>HTML.nav, boardTitle:()=>HTML.boardTitle, heroP:()=>HTML.heroP, heroBubble:()=>HTML.heroBubble, usesTab:()=>HTML.usesTab,
    chartsTitle:()=>HTML.chartsTitle, usesHead:()=>HTML.usesHead, macLabel:()=>HTML.macLabel, macHint:()=>HTML.macHint,
    credits:()=>HTML.credits, limit:()=>HTML.limit
  };
  const val=k=>{const i=k.indexOf(':');return i<0?FILL[k]():FILL[k.slice(0,i)](k.slice(i+1))};
  document.querySelectorAll('template[data-s]').forEach(t=>{t.outerHTML=val(t.dataset.s)});
  document.querySelectorAll('[data-s-attr]').forEach(el=>{el.dataset.sAttr.split(';').forEach(p=>{const i=p.indexOf('=');el.setAttribute(p.slice(0,i),val(p.slice(i+1)))});el.removeAttribute('data-s-attr')});
})();
