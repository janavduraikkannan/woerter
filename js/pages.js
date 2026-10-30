
/* ---------- Pages: profile pages (#u/username) and the ranks page (#ranks) ---------- */
var page={inside:false};
const TOP_RANK=RANKS[RANKS.length-1]; // the last named rank (site/config.js)
function lvlProgress(xp){const n=rankLv(xp),a=lvlXP(n),b=lvlXP(n+1);return{n,a,b,pct:Math.max(0,Math.min(100,Math.round(100*(xp-a)/(b-a)))),left:b-xp}}
const bar=(pct,label)=>`<div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(label)}"><i style="width:${pct}%"></i></div>`;
const pvTop=()=>`<div class="pvtop"><button class="btn quiet" type="button" id="pvBack">← Back</button></div>`;
function pvBind(){const b=$('pvBack');if(b)b.onclick=()=>{if(page.inside&&history.length>1){history.back()}else{history.replaceState(null,'',location.pathname+location.search);route()}}}
function renderRanks(){
  const xp=store.get('xp',0),P=lvlProgress(xp),r=RANKS[Math.min(P.n,RANKS.length)-1],top=lvlXP(RANKS.length),ov=Math.min(100,Math.round(100*xp/top));
  const ladder=RANKS.map((k,i)=>{const lv=i+1,need=lvlXP(lv),got=xp>=need,cur=Math.min(P.n,RANKS.length)===lv;
    return`<li class="rk${got?' got':''}${cur?' cur':''}"><span class="rnum">${lv}</span><div><b class="lw" tabindex="0" data-en="${k[1]}">${k[0]}</b> <span class="muted">${k[1]}</span>${cur?'<span class="youtag">you</span>':''}<small>${RANK_INFO[i]}</small>${cur&&lv<RANKS.length?bar(P.pct,'Progress to the next rank'):''}</div><span class="rxp">${need.toLocaleString()} XP<small>${got?'reached ✓':(need-xp).toLocaleString()+' to go'}</small></span></li>`}).join('');
  const more=[1,2,3].map(k=>`Lv ${RANKS.length+k} at ${lvlXP(RANKS.length+k).toLocaleString()} XP`).join(', ');
  $('pageview').innerHTML=pvTop()+`<section class="pv ranks">
    <h1><svg class="gi" aria-hidden="true"><use href="#gi-laurel-crown"/></svg>Ranks &amp; levels</h1>
    <div class="pcard rnow"><div><p class="muted">You are</p><h2><span class="lw" tabindex="0" data-en="${r[1]}">${r[0]}</span> <span class="muted">· Level ${P.n}</span></h2>
      <p><b>${xp.toLocaleString()} XP</b> · ${P.left.toLocaleString()} XP to Level ${P.n+1} (${lvlXP(P.n+1).toLocaleString()} XP)</p>${bar(P.pct,'Progress to the next level')}
      <p class="muted" style="margin-top:14px">${P.n>=RANKS.length?'You’ve reached '+LWS(...TOP_RANK)+', the top rank. Every level from here is pure glory.':`Road to ${LWS(...TOP_RANK)}: ${xp.toLocaleString()} of ${top.toLocaleString()} XP`}</p>${P.n>=RANKS.length?'':bar(ov,'Progress to '+TOP_RANK[0])}</div></div>
    <h2>How XP works</h2>
    <div class="pcard"><p>Every answer that counts as correct earns XP. The first one in a row earns <b>10 XP</b>, and each correct answer after that in the same run earns 2 more: 12, 14, 16, 18, then <b>20 XP</b> for every answer from the sixth in a row on. A wrong answer resets the run to 10.</p>
      <p>Answers don’t earn XP if they’re wrong, or if you asked ${SITE.cat} a question that was too leading before answering. Questions after you answer never cost anything.</p>
      <p>Each level needs 100 more XP than the one before: Level <i>n</i> starts at 50 × <i>n</i> × (<i>n</i> − 1) XP, so 100 XP for Level 2, 300 for Level 3, 600 for Level 4 and so on. Your <b>day streak</b> counts days in a row with at least one correct answer, and <b>weekly XP</b> on the leaderboard resets every Monday.</p></div>
    <h2>All ranks</h2>
    <ol class="ladder">${ladder}</ol>
    <p class="muted">After ${LWS(...TOP_RANK)} the levels keep going: ${more}, and so on.</p></section>`;
  pvBind();
}
function badgesFor(r,place,wplace){
  const lv=rankLv(r.xp),best=Math.max(r.best||0,r.days||0);
  const B=BADGES(r,place,wplace,lv,best).map(([i,la,en,d,ok])=>[i,LWS(la,en),d,ok]);
  return B;
}
async function showProfile(key){
  const pv=$('pageview');pv.innerHTML=pvTop()+'<section class="pv"><p class="muted">Loading profile…</p></section>';pvBind();
  try{
    let pid;
    if(key.startsWith('u/')){const hid=normH(key.slice(2));const h=validHid(hid)?await fsGet('handles/'+hid):null;
      if(!h){pv.innerHTML=pvTop()+`<section class="pv"><h1>No one here</h1><p>No student has the username <b>@${esc(key.slice(2))}</b>.</p></section>`;pvBind();return}pid=h.owner}
    else pid=key.slice(2).replace(/[^0-9a-f]/g,'');
    const me=acct.key?await myPid():'',own=pid===me;
    let r=await fsGet(SITE.board+'/'+pid);
    if(own){r=Object.assign({},r||{},boardFields(),{pid});if(r.pic.startsWith('u:'))r.img=prof().img}
    if(!r){pv.innerHTML=pvTop()+`<section class="pv"><h1>No profile yet</h1><p>${own?'Your profile appears once you’ve signed in with an account key and the leaderboard has your entry.':'This profile doesn’t exist.'}</p></section>`;pvBind();return}
    if(r.on===false&&!own){pv.innerHTML=pvTop()+`<section class="pv"><h1>Hidden profile</h1><p>This student has chosen not to appear on the leaderboard.</p></section>`;pvBind();return}
    if(!board.rows)await loadBoard();
    const vs=normSchool(prof().school),rows=(board.rows||[]).filter(x=>x.on!==false&&x.xp>0).map(x=>x.pid===pid?Object.assign({},x,{xp:r.xp,wxp:r.wxp,wk:r.wk}):x);
    if(!rows.some(x=>x.pid===pid)&&r.xp>0)rows.push(r);
    const cw=wkId(),place=rows.slice().sort((a,b)=>b.xp-a.xp).findIndex(x=>x.pid===pid)+1;
    const wrows=rows.filter(x=>x.wk===cw&&x.wxp>0).sort((a,b)=>b.wxp-a.wxp),wplace=wrows.findIndex(x=>x.pid===pid)+1;
    const srows=r.school?rows.filter(x=>normSchool(x.school)===normSchool(r.school)).sort((a,b)=>b.xp-a.xp):[],splace=srows.findIndex(x=>x.pid===pid)+1;
    const P=lvlProgress(r.xp||0),rk=RANKS[Math.min(P.n,RANKS.length)-1],days=streakOf(r),best=Math.max(r.best||0,days);
    const bn=String(r.banner||''),bc=BANNERS.find(b=>b[0]===bn),bp=bn.startsWith('p:')&&PIC[bn.slice(2)];
    const bstyle=bp?`background-image:url('${fileURL(picFile(bp)||bp.f[0],960)}')`:`background:${bc?bc[1]:avColor(pid)}`;
    const nameLine=nameVisible(r,vs)||(own&&r.name)?`<p class="pname">${esc(r.name)}${own&&r.nvis!=='all'?` <span class="muted">(${r.nvis==='school'?'only your school sees this':'hidden'})</span>`:''}</p>`:'';
    const badges=badgesFor(r,place,wplace),earned=badges.filter(b=>b[3]),locked=own?badges.filter(b=>!b[3]):[];
    const bdg=b=>`<li class="bdg${b[3]?'':' locked'}"><svg class="gi" aria-hidden="true"><use href="#gi-${b[0]}"/></svg><b>${b[1]}</b><small>${b[2]}</small></li>`;
    const link=location.origin+location.pathname+'#'+profKey(r);
    pv.innerHTML=`<div class="pvtop"><button class="btn quiet" type="button" id="pvBack">← Back</button><button class="btn quiet" type="button" id="pvCopy">Copy profile link</button>${own?'<button class="btn" type="button" id="pvEdit">Edit profile</button>':''}</div>
    <section class="pv prof">
      <div class="pbanner" style="${bstyle}"></div>
      <div class="phead">${avatarHTML(r,'big')}<div class="pht"><h1>${mainName(r,vs)} ${r.course==='AP+'?laureaTag():''}${own?'<span class="youtag">you</span>':''}</h1>${r.handle?`<p class="phandle">@${esc(r.handle)}</p>`:own?'<p class="phandle muted">No username yet. Pick one in Edit profile so people can find you.</p>':''}${nameLine}</div></div>
      ${r.motto?`<blockquote class="pmotto">“${esc(r.motto)}”</blockquote>`:''}${r.bio?`<p class="pbio">${esc(r.bio)}</p>`:''}
      <div class="pstats">
        <a class="pcard pst rankcard" href="#ranks"><small>Rank</small><b><span class="lw" tabindex="0" data-en="${rk[1]}">${rk[0]}</span></b><span>Level ${P.n} · ${(r.xp||0).toLocaleString()} XP</span>${bar(P.pct,'Progress to the next level')}<small>${P.left.toLocaleString()} XP to Level ${P.n+1} · see all ranks</small></a>
        <div class="pcard pst"><small>Leaderboard</small><b>${place?'#'+place:'–'}</b><span>all time${splace?` · #${splace} at ${esc(r.school)}`:''}</span></div>
        <div class="pcard pst"><small>This week</small><b>${(r.wk===cw?r.wxp:0).toLocaleString()} XP</b><span>${wplace?'#'+wplace+' this week':'no XP yet this week'}</span></div>
        <div class="pcard pst"><small>Day streak</small><b><svg class="gi" aria-hidden="true" style="color:var(--accent)"><use href="#gi-fluffy-flame"/></svg> ${days}</b><span>best ${best} day${best===1?'':'s'}</span></div>
      </div>
      <dl class="pdl">${r.school?`<dt>School</dt><dd>${esc(r.school)}</dd>`:''}${r.course?`<dt>${LANG_NAME} course</dt><dd>${esc(courseLong(r.course))}</dd>`:''}${r.since?`<dt>Member since</dt><dd>${new Date(r.since+'T12:00').toLocaleDateString(undefined,{month:'long',year:'numeric'})}</dd>`:''}</dl>
      <h2>${LWS(...SITE.honors)} <span class="muted">honors</span></h2>
      <ul class="badges">${earned.map(bdg).join('')||'<li class="muted">No honors yet. Keep practicing!</li>'}${locked.map(bdg).join('')}</ul>
      ${own&&r.on===false?'<p class="warnline">Your profile is hidden from everyone else because “Show me on the public leaderboard” is off.</p>':''}
    </section>`;
    pvBind();fillAvatars(pv);
    $('pvCopy').onclick=async()=>{try{await navigator.clipboard.writeText(link);$('pvCopy').textContent='Copied!'}catch(e){prompt('Copy this link:',link)}};
    if(own)$('pvEdit').onclick=()=>{$('acct').showModal();acctUI();profUI()};
  }catch(e){pv.innerHTML=pvTop()+`<section class="pv"><h1>Couldn’t load this profile</h1><p>${esc(e.message)}</p></section>`;pvBind()}
}
function route(){
  const h=decodeURIComponent(location.hash.slice(1)),pv=$('pageview'),on=h==='ranks'||/^(u|p)\//.test(h);
  document.body.classList.toggle('paged',on);pv.hidden=!on;
  if(!on){page.inside=false;return}
  scrollTo(0,0);if(h==='ranks')renderRanks();else showProfile(h);
}
addEventListener('hashchange',route);
addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('paged')&&!document.querySelector('dialog[open]')){const b=$('pvBack');if(b)b.click()}});
(function(){const x=document.querySelector('.topbar .xp');x.classList.add('golink');x.setAttribute('role','link');x.tabIndex=0;x.title='See all ranks and how XP works';
  const go=()=>{page.inside=true;location.hash='ranks'};x.addEventListener('click',go);x.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})})();
document.querySelectorAll('.topbar .hud>.chip').forEach(c=>{if(c.querySelector('#hudDays')){c.classList.add('golink');c.addEventListener('click',()=>{page.inside=true;location.hash='ranks'})}});
