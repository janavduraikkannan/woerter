const E=require('./engine.js');
const mk=(id)=>{for(;;){const q=E.makeQuestion(new Set([id]));if(!q.form)return q}};
function tryA(q,ans,label){const g=E.gradeLatin(q,ans);const ex=g.ok?[]:E.explainDE(q,ans);console.log(`${label.padEnd(10)} ${q.display}  ⟵  "${ans}"  → ${JSON.stringify(g)}${ex.length?'\n           '+ex.join('\n           '):''}`)}
for(let i=0;i<4;i++){const q=mk('nomakk');const w=q.display.replace(/\bden\b/,'der').replace(/\beinen\b/,'ein');if(w!==q.display)tryA(q,w,'case')}
for(let i=0;i<4;i++){const q=mk('stem');const w=q.display.replace(/ä/,'a').replace(/ü/,'u').replace(/ö/,'o');if(w!==q.display)tryA(q,w,'umlaut')}
for(let i=0;i<3;i++){const q=mk('stem');const w=q.display.replace(/ä/g,'ae').replace(/ü/g,'ue').replace(/ö/g,'oe').replace(/ß/g,'ss');tryA(q,w,'translit')}
for(let i=0;i<3;i++){const q=mk('v2');const t=q.display.split(' ');const w=[t[0],t[2],t[1],...t.slice(3)].join(' ');tryA(q,w,'order')}
for(let i=0;i<3;i++){const q=mk('sub');const w=q.display.replace(/,/g,'');const t=w.split(' ');const j=t.findIndex(x=>/^(weil|dass|ob|wenn)$/.test(x));if(j>=0&&j<t.length-3){const s=[...t];const last=s.pop();s.splice(j+2,0,last);tryA(q,s.join(' '),'suborder')}}
for(let i=0;i<3;i++){const q=mk('perf');tryA(q,q.display.toLowerCase(),'lowercase')}
for(let i=0;i<3;i++){const q=mk('adjweak');const w=q.display.replace(/(\w+)e(n?) (\p{Lu})/u,(m,a,b,c)=>a+(b?'e':'en')+' '+c);if(w!==q.display)tryA(q,w,'adj')}
{const q=E.makeQuestion(new Set(['sein']));tryA(q,q.display,'self')}
// schon / schön style clash
const tq={tokens:[{la:'die',forms:[]},{la:'Bäckerei',forms:[]},{la:'ist',forms:[]},{la:'schon',forms:[]},{la:'offen',forms:[]}],altTokens:[],end:'.'};
tryA(Object.assign(tq,{display:'die Bäckerei ist schon offen'}),'Die Backerei ist schön offen','tour');
tryA(tq,'Die Backerei ist schon offen','tour2');
// English
for(let i=0;i<3;i++){const q=mk('dat');console.log('EN',q.display,'|',q.en,'|',q.enAlt.slice(0,4).join(' / '),'|',E.gradeEnglish(q,q.enAlt[1]||q.en).ok)}
