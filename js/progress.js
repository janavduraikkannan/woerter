/* ---------- XP, levels, streaks, toasts and confetti ---------- */
const lvlXP=n=>50*n*(n-1);
const rankLv=xp=>{let n=1;while(xp>=lvlXP(n+1))n++;return n};
const today=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function hud(){
  const xp=store.get('xp',0),n=rankLv(xp),r=RANKS[Math.min(n,RANKS.length)-1],pct=Math.round(100*(xp-lvlXP(n))/(lvlXP(n+1)-lvlXP(n)));
  const d=store.get('days',{last:'',count:0}),y=today(new Date(Date.now()-864e5));
  $('hudDays').textContent=(d.last===today()||d.last===y)?d.count:0;
  $('hudLv').textContent='Lv '+n;$('hudRank').innerHTML=`${LWS(r[0],r[1])}<small>${r[1]}</small>`;$('hudXP').textContent=xp;
  $('hudBar').style.width=pct+'%';$('hudBarWrap').setAttribute('aria-valuenow',pct);
}
function toast(mood,text){const t=document.createElement('div');t.className='toast';t.innerHTML=`<img src="${faceImg(mood)}" alt=""><span>${latH(text)}</span>`;(document.querySelector('dialog[open]')||document.body).appendChild(t);if(typeof t.showPopover==='function'){t.setAttribute('popover','manual');t.classList.add('popt');try{t.showPopover()}catch(e){}}setTimeout(()=>t.remove(),3300)}
function boom(big){try{if(window.confetti)confetti({particleCount:big?160:60,spread:big?100:60,origin:{y:big?.35:.7},disableForReducedMotion:true,colors:SITE.confetti})}catch(e){}}
function gainXP(pts,anchor){
  const before=store.get('xp',0),after=before+pts;store.set('xp',after);
  {let w=store.get('wk',{id:'',xp:0});if(w.id!==wkId())w={id:wkId(),xp:0};w.xp+=pts;store.set('wk',w);}
  const f=document.createElement('span'),cb=anchor||$('check');f.className='xpfloat';f.textContent=`+${pts} XP`;
  if(anchor){f.style.position='fixed';const r=anchor.getBoundingClientRect();f.style.left=(r.right-90)+'px';f.style.top=(r.top+4)+'px';document.body.appendChild(f)}
  else{f.style.left=(cb.offsetLeft+cb.offsetWidth+12)+'px';f.style.top=(cb.offsetTop+4)+'px';cb.parentNode.appendChild(f)}
  setTimeout(()=>f.remove(),1400);
  const n0=rankLv(before),n1=rankLv(after);
  if(n1>n0){const r=RANKS[Math.min(n1,RANKS.length)-1];boom(true);toast('adoring',`Level ${n1}! You're now a {${r[0]}|${r[1]}}.`);hud();return true}
  hud();return false;
}
function award(mult=1,fixed=0){
  const pts=fixed||Math.max(1,Math.round((10+2*(Math.min(stats.streak,6)-1))*mult));
  const d=store.get('days',{last:'',count:0}),t=today(),y=today(new Date(Date.now()-864e5));
  if(d.last!==t){const c=d.last===y?d.count+1:1;store.set('days',{last:t,count:c});if(c>store.get('best',0))store.set('best',c);if(c>1)toast('delighted',`${c}-day streak! ${TXT.wellDone}! Keep it up!`);}
  const lv=gainXP(pts);
  if(!lv&&stats.streak&&stats.streak%5===0){boom(false);toast('laughing',`${stats.streak} in a row! ${TXT.onFire}`);}
}
function react(kind){moodTok++;setFelix(R(REACT_MOODS[kind]))}
