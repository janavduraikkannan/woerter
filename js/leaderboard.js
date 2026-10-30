
/* ---------- Optional profile, profile pages and the public, live leaderboard ----------
   Each account gets a public leaderboard entry at board/<id>, where the id is a hash of the secret account key,
   so the entry never reveals the key. To change an entry you must show the previous link of a hash chain built
   from your key (checked by firestore.rules), so only the account's owner can update it.
   Usernames are unique: handles/<id> records which entry owns each one. Macrons and other accents are ignored
   when comparing, so "Mārcus" and "marcus" are the same username. */
const myCourse=()=>{const c=store.get('course','');return COURSES.some(x=>x[0]===c)?c:''}; // this language's course (Verba keeps it in the profile instead)
const SCHOOLS=['Collierville High School'];
const PROF0={first:'',last:'',disp:'',handle:'',school:'',sOther:false,nvis:'school',course:'',board:true,pic:'',img:'',bio:'',motto:'',banner:''};
const normH=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const fold=x=>normH(x).replace(/\s+/g,' ').trim();
const validHid=h=>/^[a-z0-9_]{3,20}$/.test(h);
const cleanHandle=x=>[...String(x||'').normalize('NFC').replace(/\s+/g,'_')].filter(ch=>/^[a-z0-9_]$/.test(normH(ch))).join('').slice(0,20);
function prof(){
  const raw=store.get('profile',{})||{};
  if('user'in raw&&!('disp'in raw)){ // older profiles: the old username becomes the display name, and we try to keep it as the unique username
    raw.disp=String(raw.user||'');const h=cleanHandle(raw.user);raw.handle=validHid(normH(h))?h:'';delete raw.user;store.set('profile',raw)}
  return Object.assign({},PROF0,raw);
}
const fullName=p=>[p.first,p.last].map(x=>String(x||'').trim()).filter(Boolean).join(' ');
const normSchool=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' ');
const courseShort=c=>c&&COURSE_SHORT[c.replace('+','')]?COURSE_SHORT[c.replace('+','')]+(c.endsWith('+')?' · completed':''):'';
const courseLong=c=>(COURSES.find(x=>x[0]===c)||['',''])[1];
function wkId(d=new Date()){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);const y=t.getUTCFullYear(),w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);return y+'-W'+String(w).padStart(2,'0')}
/* the AP completion tag; COURSES, ANIMALS, PICS and BANNERS come from site/config.js */
const laureaTag=()=>`<span class="laurea"><svg class="gi" aria-hidden="true"><use href="#gi-laurel-crown"/></svg>${LWS(...SITE.laurea)}</span>`;
const PIC=Object.fromEntries(PICS.map(p=>[p.id,p]));
const fileURL=(f,w)=>'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(f.replace(/ /g,'_'))+'?width='+(w||250);
var commons={info:null,loading:null};
function loadCommons(){ // which preset files exist, plus each one's author and license, straight from Wikimedia Commons
  if(commons.loading)return commons.loading;
  const files=[...new Set(PICS.flatMap(p=>p.f))];
  const u='https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=330&iiextmetadatafilter=Artist|LicenseShortName&titles='+encodeURIComponent(files.map(f=>'File:'+f).join('|'));
  return commons.loading=fetch(u).then(r=>r.json()).then(j=>{
    const norm={};((j.query||{}).normalized||[]).forEach(x=>norm[x.to]=x.from);
    const info={};Object.values((j.query||{}).pages||{}).forEach(pg=>{const from=(norm[pg.title]||pg.title).replace(/^File:/,'');
      if(pg.missing!==undefined||!pg.imageinfo){info[from]=null;return}
      const ii=pg.imageinfo[0],m=ii.extmetadata||{},strip=h=>{const d=document.createElement('div');d.innerHTML=h||'';return d.textContent.trim().replace(/\s+/g,' ')};
      info[from]={thumb:ii.thumburl,page:ii.descriptionurl,artist:strip((m.Artist||{}).value)||'Unknown',lic:strip((m.LicenseShortName||{}).value)||'see file page'}});
    commons.info=info;return info}).catch(()=>{commons.info={};return commons.info});
}
const picFile=q=>{const i=commons.info;if(!i)return q.f[0];return q.f.find(f=>i[f])||q.f.find(f=>!(f in i))||null};
function avErr(img){const alt=(img.dataset.alt||'').split('|').filter(Boolean);if(alt.length){img.dataset.alt=alt.slice(1).join('|');img.src=fileURL(alt[0])}else img.remove()}
const avColor=k=>['#A9442A','#2E5E66','#946A10','#5A7A2C','#8E3B4F','#5B4E8C'][parseInt(String(k||'0').replace(/[^0-9a-f]/g,'').slice(0,4)||'0',16)%6];
var picCache=new Map();try{Object.entries(JSON.parse(localStorage.getItem('verba-pics')||'{}')).forEach(([k,v])=>picCache.set(k,v))}catch(e){}
function cachePic(k,v){picCache.delete(k);picCache.set(k,v);while(picCache.size>40)picCache.delete(picCache.keys().next().value);try{localStorage.setItem('verba-pics',JSON.stringify(Object.fromEntries(picCache)))}catch(e){}}
function avatarHTML(r,cls){
  const label=String(r.disp||r.user||r.handle||'?').trim(),ini=esc(([...label][0]||'?').toUpperCase()),p=String(r.pic||''),c=`av ${cls||''}" style="background:${avColor(r.pid)}`;
  if(p.startsWith('p:')&&PIC[p.slice(2)]){const q=PIC[p.slice(2)],f=picFile(q)||q.f[0];return`<span class="${c}"><i>${ini}</i><img src="${fileURL(f)}" data-alt="${esc(q.f.filter(x=>x!==f).join('|'))}" style="object-position:${q.pos}" alt="" loading="lazy" onerror="avErr(this)"></span>`}
  if(p.startsWith('u:')){const src=r.img||picCache.get(r.pid+p);return`<span class="${c}" data-pid="${r.pid}" data-pv="${p}"><i>${ini}</i>${src?`<img src="${src}" alt="">`:''}</span>`}
  return`<span class="${c}"><i>${ini}</i></span>`;
}
async function fillAvatars(root){ // uploaded pictures are kept out of the leaderboard query and fetched only for rows on screen
  const need=[...root.querySelectorAll('.av[data-pid]')].filter(a=>!a.querySelector('img'));let i=0;
  const work=async()=>{while(i<need.length){const a=need[i++],k=a.dataset.pid+a.dataset.pv;let src=picCache.get(k);
    if(!src){try{const r=await fetch(FS()+'/'+SITE.board+'/'+a.dataset.pid+'?mask.fieldPaths=img'+(ACCOUNTS.apiKey?'&key='+ACCOUNTS.apiKey:''));if(r.ok){src=fromFs((await r.json()).fields).img||'';if(src)cachePic(k,src)}}catch(e){}}
    if(src&&/^data:image\/jpeg;base64,/.test(src)){const im=new Image();im.alt='';im.src=src;a.appendChild(im)}}};
  await Promise.all([work(),work(),work(),work()]);
}
async function fileToAvatar(file){
  const url=URL.createObjectURL(file),img=new Image();img.src=url;await img.decode();
  for(const S of[128,96,72]){const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,S,S);
    const m=Math.min(img.naturalWidth,img.naturalHeight);x.drawImage(img,(img.naturalWidth-m)/2,(img.naturalHeight-m)/2,m,m,0,0,S,S);
    for(let q=.85;q>.35;q-=.1){const d=c.toDataURL('image/jpeg',q);if(d.length<=15000){URL.revokeObjectURL(url);return d}}}
  URL.revokeObjectURL(url);throw new Error('That picture is too detailed to shrink enough. Try another one.');
}

async function sha(x){return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))}
const hex=b=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
const b64=b=>btoa(String.fromCharCode(...b));
const FS=()=>`https://firestore.googleapis.com/v1/projects/${ACCOUNTS.projectId}/databases/(default)/documents`;
const DOCN=p=>`projects/${ACCOUNTS.projectId}/databases/(default)/documents/${p}`;
const qk=()=>ACCOUNTS.apiKey?`?key=${ACCOUNTS.apiKey}`:'';
const fsv=v=>typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:v instanceof Uint8Array?{bytesValue:b64(v)}:{stringValue:String(v)};
const fromFs=f=>{const o={};for(const[k,v]of Object.entries(f||{}))o[k]='integerValue'in v?Number(v.integerValue):'booleanValue'in v?v.booleanValue:'stringValue'in v?v.stringValue:'timestampValue'in v?v.timestampValue:'bytesValue'in v?v.bytesValue:'doubleValue'in v?v.doubleValue:null;return o};
async function fsGet(path){const r=await fetch(FS()+'/'+path+qk());if(r.status===404)return null;if(!r.ok)throw new Error(r.status===403?'The leaderboard isn’t switched on yet (its security rules need publishing).':'Couldn’t reach the leaderboard ('+r.status+').');const j=await r.json();return Object.assign(fromFs(j.fields),{pid:j.name.split('/').pop()})}
var board={pid:'',pidFor:'',n:null,hid:'',handle:'',taken:'',sig:'',busy:false,again:false,rows:null,at:0,err:'',lerr:'',view:'all',tick:null,loading:false};
async function myPid(){if(!acct.key)return '';if(board.pidFor!==acct.key){board.pid=hex(await sha('verba-board:'+acct.key)).slice(0,24);board.pidFor=acct.key;board.n=null;board.sig=''}return board.pid}
const chainLink=async i=>hex(await sha(SITE.id+'-chain:'+acct.key+':'+i));
function boardFields(){
  const p=prof(),d=store.get('days',{last:'',count:0}),w=store.get('wk',{id:'',xp:0}),cw=wkId(),on=p.board!==false,xp=Math.max(0,Math.floor(store.get('xp',0)));
  const school=String(p.school||'').trim().slice(0,60),name=fullName(p).slice(0,50),nvis=p.nvis==='all'?'all':(p.nvis==='school'&&school)?'school':'';
  let handle=String(p.handle||'').normalize('NFC').slice(0,20),hid=normH(handle);if(!validHid(hid)){hid='';handle=''}
  if(hid&&board.taken===hid){hid=board.hid;handle=board.handle}
  const pic=on&&/^(p:[a-z0-9-]{1,24}|u:[0-9a-f]{8})$/.test(p.pic)&&(!p.pic.startsWith('u:')||p.img)?p.pic:'';
  return{on,xp,wk:cw,wxp:w.id===cw?Math.min(w.xp,xp):0,days:Math.min(d.count||0,5000),dlast:d.last||'',best:Math.min(Math.max(store.get('best',0),d.count||0),5000),since:String(store.get('since','')).slice(0,10),
    disp:on?String(p.disp||'').trim().slice(0,24):'',handle,hid,name:on&&nvis?name:'',nvis:on&&name?nvis:'',school:on?school:'',course:on?(LANG?myCourse():(p.course||'')):'',
    pic,img:pic.startsWith('u:')?p.img:'',bio:on?String(p.bio||'').trim().slice(0,200):'',motto:on?String(p.motto||'').trim().slice(0,80):'',banner:on&&/^(c:[a-z]{2,10}|p:[a-z0-9-]{1,24})$/.test(p.banner)?p.banner:''};
}
async function readMine(pid){const d=await fsGet(SITE.board+'/'+pid);if(!d){board.n=-1;board.hid='';board.handle=''}else{board.n=d.n;board.hid=d.hid||'';board.handle=d.handle||''}}
async function pushBoard(){
  if(!acct.key||!acctReady())return;
  if(board.busy){board.again=true;return}
  board.busy=true;
  try{
    if(!store.get('since',''))store.set('since',today());
    const pid=await myPid();let f=boardFields(),sig=JSON.stringify(f);
    if(sig!==board.sig)for(let attempt=0;attempt<2;attempt++){
      if(board.n===null)await readMine(pid);
      f=boardFields();sig=JSON.stringify(f);
      let claim=false;
      if(f.hid&&f.hid!==board.hid){const h=await fsGet('handles/'+f.hid);
        if(h&&h.owner!==pid){board.taken=f.hid;f=boardFields();sig=JSON.stringify(f)}else claim=!h}
      const create=board.n<0,n=create?0:board.n+1,doc=Object.assign({},f,{n,prev:create?'':await chainLink(board.n),lock:await sha(await chainLink(n))}),fields={};
      for(const[k,v]of Object.entries(doc))fields[k]=fsv(v);
      const writes=[{update:{name:DOCN(SITE.board+'/'+pid),fields},updateTransforms:[{fieldPath:'t',setToServerValue:'REQUEST_TIME'}],currentDocument:{exists:!create}}];
      if(claim)writes.push({update:{name:DOCN('handles/'+f.hid),fields:{owner:{stringValue:pid}}},currentDocument:{exists:false}});
      if(board.hid&&board.hid!==f.hid){ // free the old username only if it is ours and SITE.otherBoard isn't still using it
        const old=await fsGet('handles/'+board.hid).catch(()=>null),other=await fsGet(SITE.otherBoard+'/'+pid).catch(()=>null);
        if(old&&old.owner===pid&&!(other&&other.hid===board.hid))writes.push({delete:DOCN('handles/'+board.hid)})}
      const r=await fetch(FS()+':commit'+qk(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({writes})});
      if(r.ok){board.n=n;board.sig=sig;board.hid=f.hid;board.handle=f.handle;board.err='';usernameChanged(f.hid);break}
      board.n=null; // another device may have updated first, or someone grabbed the username a moment ago: read again and retry once
      if(attempt)board.err=r.status===403?'The leaderboard refused your update. Its security rules may not be published yet.':'Updating your leaderboard entry failed ('+r.status+').';
    }
  }catch(e){board.err=e.message}
  finally{board.busy=false;if(board.again){board.again=false;setTimeout(pushBoard,1500)}if($('board').open)loadBoard();try{handleStatus()}catch(e){}}
}
const BOARD_FIELDS=['on','xp','wk','wxp','days','dlast','best','since','disp','user','handle','hid','name','nvis','school','course','pic','bio','motto','banner','t'];
async function loadBoard(){
  if(board.loading)return;board.loading=true;
  try{
    const r=await fetch(FS()+':runQuery'+qk(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({structuredQuery:{select:{fields:BOARD_FIELDS.map(f=>({fieldPath:f}))},from:[{collectionId:SITE.board}],orderBy:[{field:{fieldPath:'xp'},direction:'DESCENDING'}],limit:300}})});
    if(!r.ok)throw new Error(r.status===403?'The leaderboard isn’t switched on yet (its security rules need publishing).':'Couldn’t load the leaderboard ('+r.status+').');
    const j=await r.json();
    board.rows=j.filter(x=>x.document).map(x=>Object.assign(fromFs(x.document.fields),{pid:x.document.name.split('/').pop()}));
    board.at=Date.now();board.lerr='';
  }catch(e){board.lerr=e.message}
  board.loading=false;renderBoard();
}
const nameVisible=(r,vs)=>!!r.name&&(r.nvis==='all'||(r.nvis==='school'&&!!vs&&normSchool(r.school)===vs));
function mainName(r,vs){const a=ANIMALS[parseInt(String(r.pid).slice(0,4),16)%ANIMALS.length]||ANIMALS[0];
  return r.disp||r.user?esc(r.disp||r.user):r.handle?'@'+esc(r.handle):nameVisible(r,vs)?esc(r.name):`Anonymous <span class="lw" tabindex="0" data-en="${a[1]}">${a[0]}</span>`}
function whoHTML(r,vs){
  const nm=nameVisible(r,vs)&&(r.disp||r.user||r.handle)&&fold(r.name)!==fold(r.disp||r.user||'')?` <span class="rn">(${esc(r.name)})</span>`:'';
  const sub=[r.handle?'@'+esc(r.handle):'',r.school?esc(r.school):'',courseShort(r.course)].filter(Boolean).join(' · ');
  return`<b>${mainName(r,vs)}</b>${nm}${r.course==='AP+'?' '+laureaTag():''}${r.pid===board.pid&&acct.key?'<span class="youtag">you</span>':''}${sub?`<small>${sub}</small>`:''}`;
}
const profKey=r=>r.hid?'u/'+r.hid:'p/'+r.pid;
const streakOf=r=>{const td=today(),yd=today(new Date(Date.now()-864e5));return(r.dlast===td||r.dlast===yd)?r.days:0};
function renderBoard(){
  const L=$('boardBody');if(!L)return;
  const p=prof(),vs=normSchool(p.school),cw=wkId(),q=fold($('bSearch').value).replace(/^@/,'');
  const week=board.view==='week',cf=$('bCourse').value,me=acct.key?board.pid:'';
  $('bScope').querySelector('[value=school]').disabled=!vs;if(!vs&&$('bScope').value==='school')$('bScope').value='all';
  $('blive').className='live'+(!board.lerr&&board.at?'':' off');
  if(board.lerr){$('bnote').innerHTML=`<span style="color:var(--bad)">${esc(board.lerr)}</span>`;L.innerHTML='';return}
  if(!board.rows){$('bnote').textContent='Loading…';L.innerHTML='';return}
  const sc=r=>q?r.xp:week?(r.wk===cw?r.wxp:0):r.xp;
  let rows=board.rows.filter(r=>r.on!==false&&(q||sc(r)>0));
  if(q)rows=rows.filter(r=>[r.disp,r.user,r.handle,nameVisible(r,vs)?r.name:''].some(x=>x&&fold(x).includes(q)));
  else{if($('bScope').value==='school')rows=rows.filter(r=>normSchool(r.school)===vs);
    if(cf==='done')rows=rows.filter(r=>/\+$/.test(r.course||''));else if(cf)rows=rows.filter(r=>r.course===cf)}
  rows.sort((a,b)=>sc(b)-sc(a)||String(a.t).localeCompare(String(b.t)));
  const all=board.rows.filter(r=>r.on!==false&&r.xp>0).sort((a,b)=>b.xp-a.xp),pos=r=>q?all.indexOf(r):rows.indexOf(r);
  const mi=rows.findIndex(r=>r.pid===me);
  const row=r=>{const i=pos(r),lv=rankLv(r.xp),rk=RANKS[Math.min(lv,RANKS.length)-1],days=streakOf(r);
    return`<li class="brow${r.pid===me?' me':''}${i>=0&&i<3&&!q?' p'+(i+1):''}" data-go="${profKey(r)}" tabindex="0" role="link" aria-label="Open profile"><span class="bpos">${i>=0?i+1:'–'}</span>${avatarHTML(r)}<div class="bwho">${whoHTML(r,vs)}</div><span class="blv">Lv ${lv} <span class="lw" tabindex="0" data-en="${rk[1]}">${rk[0]}</span></span><span class="bdays" title="Day streak">${days?`<svg class="gi" aria-hidden="true"><use href="#gi-fluffy-flame"/></svg>${days}`:''}</span><span class="bxp">${sc(r).toLocaleString()} XP</span></li>`};
  const SHOW=100;let h=rows.slice(0,SHOW).map(row).join('');
  if(!q&&mi>=SHOW)h+=`<li class="bgap" aria-hidden="true">···</li>`+row(rows[mi]);
  const hq=cleanHandle($('bSearch').value.replace(/^@/,'')),hid=normH(hq);
  if(q&&!rows.some(r=>r.hid===hid)&&validHid(hid))h+=`<li class="bmore"><button class="kbtn" type="button" data-go="u/${hid}">Look up @${esc(hq)}</button></li>`;
  L.innerHTML=h||`<li class="hint" style="padding:10px">${q?'Nobody matches that search.':week?'Nobody has earned XP this week yet. Be the first!':'Nobody here yet.'}</li>`;
  fillAvatars(L);
  let note='';
  if(q)note=`${rows.length} found. Click anyone to see their profile.`;
  else if(!acct.key)note='Create an account key (the Account button) to join the leaderboard.';
  else if(board.err)note=`<span style="color:var(--bad)">${esc(board.err)}</span>`;
  else if(p.board===false)note='You’re hidden from the leaderboard. Turn it back on in Account.';
  else if(mi===0)note=`You’re in first place! <span class="lw" tabindex="0" data-en="well done!">Euge</span>!`;
  else if(mi>0)note=`You’re #${mi+1}. ${(sc(rows[mi-1])-sc(rows[mi])+1).toLocaleString()} XP to move up a place.`;
  else note=week?'Get an answer right this week to appear here.':'Get an answer right to appear here.';
  $('bnote').innerHTML=note;
}
function boardTick(){
  if(!$('board').open){clearInterval(board.tick);board.tick=null;return}
  const s=board.at?Math.round((Date.now()-board.at)/1000):0;
  $('bage').textContent=board.lerr?'offline':!board.at?'connecting':s<5?'live':'live · '+s+'s ago';
  if(document.visibilityState==='visible'&&(!board.at||Date.now()-board.at>30000))loadBoard();
}
function openBoard(){$('board').showModal();renderBoard();loadBoard();pushBoard();clearInterval(board.tick);board.tick=setInterval(boardTick,1000)}
$('boardbtn').addEventListener('click',openBoard);
$('boardClose').addEventListener('click',()=>$('board').close());
$('board').addEventListener('click',e=>{if(e.target===$('board'))$('board').close()});
document.querySelector('#board .btabs').addEventListener('click',e=>{const v=e.target.dataset&&e.target.dataset.v;if(!v)return;board.view=v;document.querySelectorAll('#board .btabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.v===v));renderBoard()});
$('bScope').addEventListener('change',renderBoard);$('bCourse').addEventListener('change',renderBoard);$('bSearch').addEventListener('input',renderBoard);
const goTo=k=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());page.inside=true;location.hash=k};
$('boardBody').addEventListener('click',e=>{if(e.target.closest('.lw'))return;const g=e.target.closest('[data-go]');if(g)goTo(g.dataset.go)});
$('boardBody').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.go)goTo(e.target.dataset.go)});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&$('board').open)loadBoard()});

