/* ---------- German: the rest of the course's form uses, for the identify-the-use tab ----------
   Loaded after js/usemode.js (the language name, LANG_NAME, is in site/config.js). The Konjunktiv II uses start from the course's own k2 and k2wenn
   generators and tag the one verb that shows the use. */
const useAsk=ty=>`Which use of ${USES[ty.c].word} is`;
const useOf=ty=>`use of ${USES[ty.c].word}`;
const XC_SKIP=()=>false;
const MORE_ID_TOPIC={k2:['k2Pol'],k2wenn:['k2Cond','k2Wish']};
/* topic generators return unfinished sentences; finish() builds the display text the drill shows */
function fromTopic(id){const t=TOPICS.find(x=>x.id===id);for(let i=0;i<30;i++){try{return finish(t.gen())}catch(e){}}throw new Error('no '+id+' sentence')}
/* these forms have no English verb attached, so English mode looks for these words */
const K2_EN={wäre:['were','was'],wären:['were'],wärst:['were'],wärt:['were'],hätte:['had'],hätten:['had'],hättest:['had'],hättet:['had'],
  könnte:['could'],könnten:['could'],könntest:['could'],würde:['would'],würden:['would'],würdest:['would'],müsste:['had to'],müssten:['had to'],dürfte:['were allowed to'],dürften:['were allowed to']};
/* the wenn clause of an unreal condition: its tokens, the index of its verb, and its English */
function wennClause(){
  const x=fromTopic('k2wenn'),j=x.tokens.findIndex(t=>t.cids&&t.cids[0]==='k2'),m=x.en.match(/^if (.*?), /i);
  if(j<0||!m||!K2_EN[x.tokens[j].la.toLowerCase()])throw new Error('no wenn clause');
  return{x,j,en:m[1]};
}

addUses('k2',{name:'Konjunktiv II',word:'Konjunktiv II',level:'IV'},[
  {id:'k2Cond',full:'an unreal condition (Konjunktiv II)',n:'Unreal condition',syn:['unreal condition','condition','contrary to fact','hypothetical','if clause','wenn clause','unreal if'],what:'the if-part of something untrue or unlikely right now',la:'Wenn ich Zeit hätte, …',en:'If I had time, …',
    gen:()=>{const{x,j}=wennClause(),t=x.tokens[j];t.cids=['k2Cond',...t.cids];t.enHint=K2_EN[t.la.toLowerCase()];return x}},
  {id:'k2Pol',full:'a polite request (Konjunktiv II)',n:'Polite request',syn:['polite','politeness','polite request','courtesy','request','softened','softening','would you'],what:'asks for something politely (würden Sie …, könnten Sie …)',la:'Würden Sie bitte das Fenster öffnen?',en:'Would you please open the window?',
    gen:()=>{const x=fromTopic('k2'),i=x.tokens.findIndex(t=>t.cids&&t.cids.includes('aux')),m=x.en.match(/^(.*?) would (.*)$/);
      if(i<0||!m||x.tokens.some(t=>t.cids&&t.cids.includes('gern')))throw new Error('no plain würde sentence');
      const w=Object.assign(W('würden','werden : will (würden Sie …? would you …?)',['k2Pol','k2']),{enHint:['would']});
      return finish(S([w,W('Sie','Sie : you (formal)',['subj']),W('bitte','bitte : please'),...x.tokens.slice(i+1)],['would you please '+m[2]],'?'))}},
  {id:'k2Wish',full:'an unreal wish (Konjunktiv II)',n:'Unreal wish',syn:['wish','unreal wish','if only','wishing','hope','desire','wenn nur'],what:'wishes that something were different (wenn … nur …!)',la:'Wenn ich nur Zeit hätte!',en:'If only I had time!',
    gen:()=>{const{x,j,en}=wennClause(),cl=x.tokens.slice(0,j+1);if(cl.some(t=>t.la==='du'))throw new Error('if I were you');
      const t=cl[j];t.post='';t.cids=['k2Wish',...t.cids];t.enHint=K2_EN[t.la.toLowerCase()];cl.splice(2,0,W('nur','nur : only (wenn … nur: if only)'));
      return finish(S(cl,['if only '+en],'!'))}}]);
