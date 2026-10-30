

/* ---------- Account page: profile settings ---------- */
var hcheck={timer:null,last:''};
async function handleStatus(){
  const el=$('pHandleMsg'),inp=$('pHandle');if(!el||!inp)return;
  const v=cleanHandle(inp.value),hid=normH(v);
  if(!v){el.className='opt';el.textContent='optional · must be unique';return}
  if(!validHid(hid)){el.className='opt bad';el.textContent='3 to 20 letters, numbers or _';return}
  if(board.taken===hid){el.className='opt bad';el.textContent=`@${v} is taken. Try another.`;return}
  if(acct.key&&board.hid===hid){el.className='opt ok';el.textContent=`@${board.handle} is yours`;return}
  if(!acct.key){el.className='opt';el.textContent='create an account key to claim it';return}
  el.className='opt';el.textContent='checking…';
  clearTimeout(hcheck.timer);hcheck.timer=setTimeout(async()=>{try{const h=await fsGet('handles/'+hid),me=await myPid();if(normH(cleanHandle($('pHandle').value))!==hid)return;
    if(h&&h.owner!==me){board.taken=hid;el.className='opt bad';el.textContent=`@${v} is taken. Try another.`}
    else{el.className='opt ok';el.textContent=h?`@${v} is yours`:`@${v} is available. Saving…`}}catch(e){el.className='opt';el.textContent=''}},450);
}
function profUI(){
  const P=$('profBody');if(!P)return;
  if(!acctReady()){P.innerHTML='';return}
  const p=prof(),sel=SCHOOLS.includes(p.school)?p.school:(p.sOther||p.school)?'*':'';
  const grid=g=>PICS.filter(x=>x.g===g).map(x=>`<button type="button" class="pick${p.pic==='p:'+x.id?' on':''}" data-pic="${x.id}" title="${esc(x.n)}" aria-label="${esc(x.n)}"><img src="${fileURL(x.f[0])}" data-alt="${esc(x.f.slice(1).join('|'))}" style="object-position:${x.pos}" alt="" loading="lazy" onerror="avErr(this)"><span>${esc(x.n)}</span></button>`).join('');
  P.innerHTML=`<hr><h3 class="ph">Profile &amp; leaderboard</h3>
    <p class="warnbox"><b>Everything here is optional, and none of it is private or secure.</b> Anything you fill in, including a picture you upload, can be seen by anyone who knows how to look, even with “only students at my school” picked. Only add what you’d be fine with anyone seeing.</p>
    <div class="pf"><span>Profile picture <span class="opt">optional</span></span>
      <div class="picrow"><span id="pPrev"></span><div class="row" style="margin:0"><label class="btn quiet upl">Upload a picture<input type="file" id="pUpload" accept="image/*" hidden></label><button type="button" class="btn quiet" id="pPicNone">No picture</button></div></div>
      <p class="hint" id="pPicMsg">Or pick one below. Uploads are cropped to a square and shrunk.</p>
      <p class="pgh">${TXT.famous}</p><div class="picks">${grid('fig')}</div>
      <p class="pgh">Landmarks</p><div class="picks">${grid('place')}</div>
      <details class="credits2"><summary>Picture credits</summary><ul id="pCredits"><li>Loading from Wikimedia Commons…</li></ul></details></div>
    <label class="pf">Display name <span class="opt">optional · what the leaderboard shows; doesn’t have to be unique</span><input id="pDisp" maxlength="24" value="${esc(p.disp)}"></label>
    <label class="pf">Username <span class="opt" id="pHandleMsg"></span><span class="hwrap"><b>@</b><input id="pHandle" maxlength="20" spellcheck="false" autocomplete="off" value="${esc(p.handle)}"></span></label>
    <p class="hint">Your unique name for your profile link, search and logging in. ${TXT.usernameHint} If you’ve set a password, changing your username switches it off until you set it again.</p>
    <div class="pgrid"><label class="pf">First name <span class="opt">optional</span><input id="pFirst" maxlength="25" autocomplete="given-name" value="${esc(p.first)}"></label>
    <label class="pf">Last name <span class="opt">optional</span><input id="pLast" maxlength="25" autocomplete="family-name" value="${esc(p.last)}"></label></div>
    <p class="hint">First name, last name, both or neither.</p>
    <label class="pf">School <span class="opt">optional</span><select id="pSchool"><option value="">No school</option>${SCHOOLS.map(x=>`<option${sel===x?' selected':''}>${esc(x)}</option>`).join('')}<option value="*"${sel==='*'?' selected':''}>Other (type it in)</option></select></label>
    <label class="pf" id="pSchoolCL"${sel==='*'?'':' hidden'}>Your school <input id="pSchoolC" maxlength="60" value="${esc(sel==='*'?p.school:'')}"></label>
    <label class="pf">Who can see your name <span class="opt" id="pVisH"></span><select id="pVis"><option value="">Nobody</option><option value="school">Only students who picked my school</option><option value="all">Everyone</option></select></label>
    <label class="pf">${LANG_NAME} course <span class="opt">optional · change it any time</span><select id="pCourse">${COURSES.map(([v,l])=>`<option value="${v}"${(LANG?myCourse():p.course)===v?' selected':''}>${l}</option>`).join('')}</select></label>
    <p class="hint">Pick “completed” if you finished that course and aren’t taking ${LANG_NAME} anymore.</p>
    <div id="pAward"></div>
    <label class="pf">Motto <span class="opt">optional · shown on your profile, ${LANG_NAME} welcome</span><input id="pMotto" maxlength="80" value="${esc(p.motto)}" placeholder="${TXT.mottoEg}"></label>
    <label class="pf">About me <span class="opt">optional</span><textarea id="pBio" maxlength="200" rows="2">${esc(p.bio)}</textarea></label>
    <div class="pf"><span>Profile banner</span><div class="banners">${BANNERS.map(b=>`<button type="button" class="ban${p.banner===b[0]?' on':''}" data-ban="${b[0]}" style="background:${b[1]}" title="${b[2]}" aria-label="${b[2]}"></button>`).join('')}${PICS.filter(x=>x.g==='place').map(x=>`<button type="button" class="ban${p.banner==='p:'+x.id?' on':''}" data-ban="p:${x.id}" title="${esc(x.n)}" aria-label="${esc(x.n)}"><img src="${fileURL(x.f[0])}" alt="" loading="lazy" onerror="this.parentNode.remove()"></button>`).join('')}</div></div>
    <label class="chk"><input type="checkbox" id="pBoard"${p.board!==false?' checked':''}> Show me on the public leaderboard</label>
    <div class="row"><button type="button" class="btn quiet" id="pView">View my profile</button></div>
    <p class="msg" id="pmsg"></p>`;
  const prev=()=>{const q=prof();$('pPrev').innerHTML=avatarHTML(Object.assign({},q,{pid:board.pid||'0'}),'big');P.querySelectorAll('.pick').forEach(b=>b.classList.toggle('on',q.pic==='p:'+b.dataset.pic));P.querySelectorAll('.ban').forEach(b=>b.classList.toggle('on',q.banner===b.dataset.ban))};
  const vis=()=>{const hasS=$('pSchool').value&&($('pSchool').value!=='*'||$('pSchoolC').value.trim());$('pVis').querySelector('[value=school]').disabled=!hasS;
    const cur=prof().nvis;$('pVis').value=cur==='school'&&!hasS?'':cur;
    $('pVisH').textContent=!fullName(prof())?'add a name above first':hasS?'':'pick a school to share it with classmates only';
    $('pAward').innerHTML=$('pCourse').value==='AP+'?`<div class="laurea-card"><svg class="gi" aria-hidden="true"><use href="#gi-laurel-crown"/></svg><div>${TXT.award()}</div></div>`:''};
  const done=()=>{$('pmsg').className='msg ok';$('pmsg').textContent=acct.key?'Saved. The leaderboard updates in a few seconds.':'Saved on this browser. Create an account key above to join the leaderboard.'};
  const patch=o=>{store.set('profile',Object.assign(prof(),o));prev();done()};
  const save=e=>{
    const old=prof(),s=$('pSchool').value;$('pSchoolCL').hidden=s!=='*';
    if(e&&e.target.id==='pHandle'){const c=cleanHandle(e.target.value.replace(/^@/,''));if(c!==e.target.value){const at=e.target.selectionStart;e.target.value=c;try{e.target.setSelectionRange(at-1,at-1)}catch(x){}}}
    const n=Object.assign(old,{first:$('pFirst').value.trim(),last:$('pLast').value.trim(),disp:$('pDisp').value.trim(),handle:cleanHandle($('pHandle').value),
      school:s==='*'?$('pSchoolC').value.trim():s,sOther:s==='*',nvis:e&&e.target.id==='pVis'?$('pVis').value:old.nvis,...(LANG?{}:{course:$('pCourse').value}),board:$('pBoard').checked,
      motto:$('pMotto').value.trim(),bio:$('pBio').value.trim()});
    const wasAP=(LANG?myCourse():store.get('profile',{}).course)==='AP+';
    store.set('profile',n);if(LANG)store.set('course',$('pCourse').value);vis();handleStatus();
    if($('pCourse').value==='AP+'&&!wasAP){boom(true);toast('adoring',TXT.apToast)}
    done();
  };
  P.querySelectorAll('input:not([type=file]),select,textarea').forEach(x=>x.addEventListener(x.tagName==='SELECT'||x.type==='checkbox'?'change':'input',save));
  P.querySelectorAll('.pick').forEach(b=>b.onclick=()=>patch({pic:'p:'+b.dataset.pic,img:''}));
  P.querySelectorAll('.ban').forEach(b=>b.onclick=()=>patch({banner:b.dataset.ban}));
  $('pPicNone').onclick=()=>patch({pic:'',img:''});
  $('pUpload').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('pPicMsg').textContent='Shrinking…';
    try{const d=await fileToAvatar(f),pv='u:'+hex(await sha(d)).slice(0,8);patch({pic:pv,img:d});$('pPicMsg').textContent='Uploaded. Remember: anyone can see this picture.'}catch(x){$('pPicMsg').textContent=x.message||'That file didn’t work as a picture.'}e.target.value=''};
  $('pView').onclick=async()=>{if(!acct.key){$('pmsg').className='msg bad';$('pmsg').textContent='Create an account key first to get a profile page.';return}
    const pid=await myPid(),h=normH(prof().handle);goTo(validHid(h)&&board.taken!==h?'u/'+h:'p/'+pid)};
  prev();vis();handleStatus();
  loadCommons().then(info=>{
    if(!$('pCredits'))return;
    P.querySelectorAll('.pick').forEach(b=>{const q=PIC[b.dataset.pic],f=picFile(q);if(!f&&Object.keys(info).length)b.remove();else if(f&&info[f]){const im=b.querySelector('img');if(im&&info[f].thumb&&!im.src.includes(encodeURIComponent(f.replace(/ /g,'_')))){im.src=info[f].thumb}else if(im&&info[f].thumb)im.src=info[f].thumb}});
    const items=PICS.map(q=>{const f=picFile(q),i=f&&info[f];return i?`<li><b>${esc(q.n)}</b>: ${esc(i.artist)}, ${esc(i.lic)} · <a href="${esc(i.page)}" target="_blank" rel="noopener">Wikimedia Commons</a></li>`:''}).join('');
    $('pCredits').innerHTML=items||'<li>Credits couldn’t be loaded right now. Every preset picture is a freely licensed file on Wikimedia Commons.</li>';
  });
}
$('showtopic').addEventListener('click',()=>{if(q&&!checked||q&&q.xc&&!q.xc.done)q.topicShownEarly=true;showTopic()});
$('acctbtn').addEventListener('click',()=>{$('acct').showModal();acctUI();profUI()});
$('acctClose').addEventListener('click',()=>$('acct').close());
$('acct').addEventListener('click',e=>{if(e.target===$('acct'))$('acct').close()});
