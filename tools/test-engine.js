// node tools/test-engine.js [samples per topic] [topic id]
const E=require('../site/engine.js');const N=+process.argv[2]||200,only=process.argv[3];
let bad=0;const show=+process.env.SHOW||3;
for(const t of E.TOPICS){if(only&&t.id!==only)continue;const seen=[];let err=0;
  for(let i=0;i<N;i++){let q;try{q=E.makeQuestion(new Set([t.id]))}catch(e){err++;if(err<3)console.log('THROW',t.id,e.stack.split('\n').slice(0,3).join(' | '));continue}
    const d=q.display,txt=d+' '+q.en+' '+(q.enAlt||[]).join(' ');
    if(/undefined|null|NaN|\[object/.test(txt)||!d.trim()){bad++;if(bad<40)console.log('BAD',t.id,'|',d,'|',q.en)}
    if(!q.form){const g=E.gradeLatin(q,d);if(!g.ok||g.caps){bad++;if(bad<40)console.log('SELF',t.id,'|',d,JSON.stringify(g))}
      const ge=E.gradeEnglish(q,q.en);if(!ge.ok){bad++;if(bad<40)console.log('ENSELF',t.id,'|',q.en)}}
    if(seen.length<show)seen.push(`  ${d}${q.end}  —  ${q.en}${q.end}${q.altTokens&&q.altTokens.length?'  [+'+q.altTokens.length+' orders]':''}`)}
  console.log(`== ${t.id} (${t.level}) ${t.name}${err?'  THROWS:'+err:''}\n`+seen.join('\n'))}
// identify mode
for(const ty of Object.keys(E.TYPES)){let found=0;for(let i=0;i<30;i++){try{const q=E.idQuestion(ty);if(q.tokens.some(x=>x.cids&&x.cids[0]===ty))found++}catch(e){console.log('IDTHROW',ty,e.message)}}if(found<10)console.log('ID weak',ty,found+'/30')}
// build mode
for(let i=0;i<300;i++){const fr=new Set([E.FRAMES[i%E.FRAMES.length][0]]),ings=new Set(E.ING_ALL.filter(()=>Math.random()<.3).map(x=>x[0]));try{const q=E.makeBuilt(fr,ings,'2',new Set());const g=E.gradeLatin(q,q.display);if(!g.ok){bad++;console.log('BSELF',q.display)}if(/undefined|null/.test(q.display+q.en)){bad++;console.log('BBAD',q.display,q.en)}}catch(e){bad++;console.log('BTHROW',e.message)}}
console.log('problems:',bad);
