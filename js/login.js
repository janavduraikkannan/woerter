
/* ---------- Optional username + password login ----------
   Verba has no server and never asks for an email. You log in with your unique username (case and macrons don't
   matter: "Fēlīx" and "felix" are the same) plus a password. The username and password are stretched together in
   this browser (PBKDF2-SHA256, 310,000 rounds). Part of the result names a record in logins/, and the rest is an AES
   key that encrypts the account key stored in that record. The password itself is never stored or sent anywhere,
   so a wrong password just finds nothing. Only someone holding the account key can change or remove the record
   (a hash chain made from the account key, checked by firestore.rules). Because the record is built from the
   username, changing your username switches the old record off, and you set your password again. */
const LOGIN_ITER=310000;
const u8b64=b=>btoa(String.fromCharCode(...b)),b64u8=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function loginKeys(hid,pw){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);
  const bits=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode('verba-login-v2:'+hid),iterations:LOGIN_ITER},base,384));
  const id=[...bits.slice(0,16)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const aes=await crypto.subtle.importKey('raw',bits.slice(16),'AES-GCM',false,['encrypt','decrypt']);
  return{id,aes};
}
const loginLink=async(id,i)=>{const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('verba-login-chain:'+acct.key+':'+id+':'+i)));return[...b].map(x=>x.toString(16).padStart(2,'0')).join('')};
const LDOC=id=>`projects/${ACCOUNTS.projectId}/databases/(default)/documents/logins/${id}`;
const LURL=id=>`https://firestore.googleapis.com/v1/projects/${ACCOUNTS.projectId}/databases/(default)/documents/logins/${id}`+(ACCOUNTS.apiKey?`?key=${ACCOUNTS.apiKey}`:'');
async function loginGet(id){const r=await fetch(LURL(id));if(r.status===404)return null;if(!r.ok)throw new Error(r.status===403?'Password login isn’t switched on yet (the site’s security rules need publishing).':'The account server returned error '+r.status+'.');
  const f=(await r.json()).fields||{};return{n:Number((f.n||{}).integerValue||0),iv:(f.iv||{}).stringValue||'',ct:(f.ct||{}).stringValue||''}}
async function loginWrite(id,old,payload){ // payload null = switch the record off
  const create=!old,n=create?0:old.n+1,sha=async x=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)));
  const fields={v:{integerValue:'1'},iv:{stringValue:payload?payload.iv:''},ct:{stringValue:payload?payload.ct:''},n:{integerValue:String(n)},
    prev:{stringValue:create?'':await loginLink(id,old.n)},gate:{bytesValue:u8b64(await sha(await loginLink(id,n)))}};
  return{update:{name:LDOC(id),fields},updateTransforms:[{fieldPath:'t',setToServerValue:'REQUEST_TIME'}],currentDocument:{exists:!create}};
}
async function loginCommit(writes){
  const r=await fetch(`https://firestore.googleapis.com/v1/projects/${ACCOUNTS.projectId}/databases/(default)/documents:commit`+(ACCOUNTS.apiKey?`?key=${ACCOUNTS.apiKey}`:''),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({writes})});
  if(!r.ok)throw new Error(r.status===403?'Saving the password was refused. Try a different password. (Or the site’s security rules may not be published yet.)':'Saving the password failed (error '+r.status+').');
}
async function loginOpen(rec,aes){const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64u8(rec.iv)},aes,b64u8(rec.ct));return JSON.parse(new TextDecoder().decode(pt)).k}
async function switchOffLogin(id){if(!id)return;const o=await loginGet(id);if(o&&o.ct)await loginCommit([await loginWrite(id,o,null)])}
const loginOn=()=>{const l=store.get('login',null);return l&&l.hid&&l.id?l:null}; // older email logins (from before usernames) count as off
async function claimUsername(raw){ // make sure the signed-in account owns this username, claiming it if needed
  const h=cleanHandle(String(raw||'').replace(/^@/,'')),hid=normH(h);
  if(!validHid(hid))throw new Error('Pick a username first: 3 to 20 letters, numbers or _.');
  if(board.hid===hid&&acct.key)return hid;
  store.set('profile',Object.assign(prof(),{handle:h}));
  while(board.busy)await sleep(150);board.sig='';await pushBoard();while(board.busy)await sleep(150);
  if(board.taken===hid)throw new Error(`@${h} is taken. Pick a different username.`);
  if(board.hid!==hid)throw new Error(board.err||'Couldn’t save that username. Try again.');
  return hid;
}
async function setPasswordLogin(rawUser,pw){ // add a password, or change it, for the signed-in account
  if(!acct.key)throw new Error('Log in first.');
  const hid=await claimUsername(rawUser),{id,aes}=await loginKeys(hid,pw),cur=store.get('login',null);
  const ex=await loginGet(id);
  if(ex&&ex.ct){let mine=false;try{mine=await loginOpen(ex,aes)===acct.key}catch(e){}if(!mine)throw new Error('Pick a different password.')}
  const iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},aes,new TextEncoder().encode(JSON.stringify({k:acct.key}))));
  const writes=[await loginWrite(id,ex,{iv:u8b64(iv),ct:u8b64(ct)})];
  if(cur&&cur.id&&cur.id!==id){const o=await loginGet(cur.id);if(o&&o.ct)writes.push(await loginWrite(cur.id,o,null))}
  await loginCommit(writes);store.set('login',{hid,id});acct.loginLost=false;await pushNow();
}
async function removePasswordLogin(){const cur=store.get('login',null);if(cur&&cur.id)await switchOffLogin(cur.id);store.set('login',null);await pushNow()}
async function usernameChanged(newHid){ // called after the username changes: the old password record no longer matches
  const l=loginOn();if(!l||l.hid===newHid)return;
  try{await switchOffLogin(l.id)}catch(e){}
  store.set('login',null);acct.loginLost=true;
  toast('sly','Your username changed, so your password was switched off. Set it again in Account.');
}
async function passwordSignIn(user,pw){
  const hid=normH(cleanHandle(String(user||'').trim().replace(/^@/,'')));
  if(!validHid(hid))throw new Error('Type your username (3 to 20 letters, numbers or _).');
  if(!pw)throw new Error('Type your password.');
  const{id,aes}=await loginKeys(hid,pw),rec=await loginGet(id),bad='Wrong username or password, or this account hasn’t set a password. Your account key still works if you have it.';
  if(!rec||!rec.ct)throw new Error(bad);
  let k;try{k=await loginOpen(rec,aes)}catch(e){throw new Error(bad)}
  return signInWithKey(k);
}
const PW_WARN=`<div class="warnbox"><b>Optional, and please read:</b><ul>
  <li><b>If you forget your password, it’s gone forever.</b> There’s no “forgot password,” and no one can reset it. Your <b>account key</b> still works, so it’s strongly recommended that you keep it saved somewhere safe.</li>
  <li>Use a password you don’t use anywhere else, at least 8 characters. ${TXT.whoIsnt} isn’t a company and can’t promise this is secure: usernames are public, so a short or reused password could let someone into your account.</li>
  <li>Your password is never stored, not even by the site’s owner.</li>
  <li>If you change your username later, your password switches off and you set it again.</li></ul></div>`;
const loginFormHTML=px=>`<div class="lgtabs" role="tablist"><button type="button" role="tab" id="${px}TE" aria-selected="true">Username and password</button><button type="button" role="tab" id="${px}TK" aria-selected="false">Account key</button></div>
  <div id="${px}FE"><input id="${px}Em" autocomplete="username" spellcheck="false" autocapitalize="off" placeholder="Username" aria-label="Username"><input id="${px}Pw" type="password" autocomplete="current-password" placeholder="Password" aria-label="Password">
    <p class="hint" style="margin-top:0">${TXT.loginHint}</p>
    <div class="row"><button class="btn" type="button" id="${px}GoE">Log in</button></div></div>
  <div id="${px}FK" hidden><input id="${px}Key" autocomplete="off" spellcheck="false" placeholder="VERBA-XXXX-XXXX-…" aria-label="Your account key">
    <div class="row"><button class="btn" type="button" id="${px}GoK">Log in with key</button></div></div>
  <p class="msg" id="${px}Msg"></p>`;
function bindLoginForm(px,done){
  const msg=(t,c)=>{const m=$(px+'Msg');if(m){m.className='msg '+(c||'');m.textContent=t}};
  const tab=e=>{$(px+'TE').setAttribute('aria-selected',e);$(px+'TK').setAttribute('aria-selected',!e);$(px+'FE').hidden=!e;$(px+'FK').hidden=e;msg('')};
  $(px+'TE').onclick=()=>tab(true);$(px+'TK').onclick=()=>tab(false);
  const go=async(f,btn)=>{$(btn).disabled=true;msg('Logging in…');try{await f();msg('');done()}catch(e){msg(e.message,'bad')}finally{if($(btn))$(btn).disabled=false}};
  $(px+'GoE').onclick=()=>go(()=>passwordSignIn($(px+'Em').value,$(px+'Pw').value),px+'GoE');
  $(px+'GoK').onclick=()=>go(async()=>{const k=normKey($(px+'Key').value);if(k.length!==24)throw new Error('That key looks incomplete. It should be VERBA- plus 24 letters and numbers.');await signInWithKey(k)},px+'GoK');
  $(px+'Pw').addEventListener('keydown',e=>{if(e.key==='Enter')$(px+'GoE').click()});
  $(px+'Key').addEventListener('keydown',e=>{if(e.key==='Enter')$(px+'GoK').click()});
}
const pwSetHTML=(px,change)=>{const h=board.hid?board.handle:prof().handle;return`${PW_WARN}
  <label class="pf">Username <span class="opt">${board.hid?'your username; changing it here changes it everywhere':'pick one: it must be unique, and it’s public'}</span><span class="hwrap"><b>@</b><input id="${px}Em" autocomplete="username" spellcheck="false" autocapitalize="off" maxlength="20" value="${esc(h||'')}" aria-label="Username"></span></label>
  <input id="${px}Pw" type="password" autocomplete="new-password" placeholder="${change?'New password':'Password'} (8+ characters)" aria-label="Password">
  <input id="${px}Pw2" type="password" autocomplete="new-password" placeholder="Type the password again" aria-label="Type the password again">
  <label class="chk"><input type="checkbox" id="${px}Ok"> I understand: if I forget this password, it’s gone forever, and I’ll keep my account key saved too.</label>
  <div class="row"><button class="btn" type="button" id="${px}Go">${change?'Save new password':'Set my password'}</button></div><p class="msg" id="${px}Msg"></p>`};
function bindPwSet(px,done){
  const msg=(t,c)=>{const m=$(px+'Msg');if(m){m.className='msg '+(c||'');m.textContent=t}};
  $(px+'Em').addEventListener('input',e=>{const c=cleanHandle(e.target.value.replace(/^@/,''));if(c!==e.target.value)e.target.value=c});
  $(px+'Go').onclick=async()=>{
    const u=$(px+'Em').value,pw=$(px+'Pw').value;
    if(!validHid(normH(cleanHandle(u))))return msg('Pick a username: 3 to 20 letters, numbers or _.','bad');
    if(pw.length<8)return msg('Use at least 8 characters for your password.','bad');
    if(pw!==$(px+'Pw2').value)return msg('The two passwords don’t match.','bad');
    if(!$(px+'Ok').checked)return msg('Tick the box to show you understand the password can’t be recovered.','bad');
    $(px+'Go').disabled=true;msg('Saving… (this takes a second)');
    try{await setPasswordLogin(u,pw);msg(`Saved! You can now log in on any device with @${board.handle} and your password.`,'ok');done&&done()}catch(e){msg(e.message,'bad')}finally{if($(px+'Go'))$(px+'Go').disabled=false}};
}
function acctUI(force){
  try{keysUI()}catch(e){}
  $('acctbtn').classList.toggle('on',!!acct.key);$('acctlbl').textContent=acct.key?'Synced':'Account';
  $('acctbtn').setAttribute('aria-label',acct.key?'Account: synced':'Account: not signed in');
  if(!$('acct').open)return;
  const B=$('acctBody');
  if(!force&&((B.contains(document.activeElement)&&document.activeElement.tagName==='INPUT')||($('lgForm')&&$('lgForm').innerHTML)))return; // don't wipe a form someone is using
  if(!acctReady()){B.innerHTML=`<h2 id="acctTitle">Accounts are coming soon</h2><p>Accounts will let you keep your XP, streak and settings on every device. The site's account server isn't switched on yet.</p>`;return}
  if(acct.key){
    const lg=loginOn();
    B.innerHTML=`<h2 id="acctTitle">Your account</h2><p>This browser is signed in. Your XP, streak, topics and settings save to your account automatically.</p><p class="hint">${TXT.sameAccount} Your profile, username and password are shared; XP, levels and streaks are separate for each language.</p>
      <p><b>Your account key</b> <span class="hint">(recommended: keep a copy somewhere safe)</span></p>
      <div class="keybox" id="keyshow">${esc(showKey(acct.key))}</div>
      <div class="row"><button class="btn quiet" id="kcopy">Copy key</button><button class="btn quiet" id="ksync">Sync now</button><button class="btn quiet" id="kout">Log out here</button></div>
      <p class="msg ${acct.err?'bad':'ok'}" id="kmsg">${acct.err?esc(acct.err):acct.last?'Last synced '+acct.last.toLocaleTimeString():''}</p>
      <p class="hint">The key always logs you in, even if you also set a password. Keep it private: anyone with it can open your account.</p>
      <hr><h3 class="ph">Password <span class="opt">optional</span></h3>
      ${lg?`<p>You can log in on any device with your username <b>@${esc(board.handle||lg.hid)}</b> and your password.</p>
        <div class="row"><button class="btn quiet" id="lgChange">Change password</button><button class="btn quiet" id="lgRemove">Turn off password login</button></div><div id="lgForm"></div><p class="msg" id="lgMsg"></p>`
      :`${acct.loginLost?'<p class="warnline">Your username changed, so your old password was switched off. Set it again below.</p>':''}<p>Set a password so you can log in with your username instead of typing your account key.</p><div class="row"><button class="btn quiet" id="lgAdd">Set a password</button></div><div id="lgForm"></div><p class="msg" id="lgMsg"></p>`}`;
    $('kcopy').onclick=async()=>{try{await navigator.clipboard.writeText(showKey(acct.key));$('kmsg').className='msg ok';$('kmsg').textContent='Copied!'}catch(e){$('kmsg').textContent='Select the key above and copy it.'}};
    $('ksync').onclick=async()=>{$('kmsg').textContent='Syncing…';await pullNow();await pushNow()};
    $('kout').onclick=()=>{if(!confirm('Log out on this browser? Make sure you have your account key (or your username and password) first.'))return;acct.key='';board.pidFor='';board.pid='';board.hid='';board.handle='';try{localStorage.removeItem('verba-account')}catch(e){}acctUI(true);profUI()};
    const open=ch=>{$('lgForm').innerHTML=pwSetHTML('lgS',ch);bindPwSet('lgS',()=>setTimeout(()=>{if($('acct').open){acctUI(true);profUI()}},2200))};
    if($('lgAdd'))$('lgAdd').onclick=()=>open(false);
    if($('lgChange'))$('lgChange').onclick=()=>open(true);
    if($('lgRemove'))$('lgRemove').onclick=async()=>{if(!confirm('Turn off password login? You’ll need your account key to log in on other devices.'))return;
      $('lgMsg').textContent='Turning it off…';try{await removePasswordLogin();acctUI(true)}catch(e){$('lgMsg').className='msg bad';$('lgMsg').textContent=e.message}};
    return;
  }
  B.innerHTML=`<h2 id="acctTitle">Log in</h2><p>Log in to load your XP, streak, profile and settings on this device.</p>
    ${loginFormHTML('aL')}
    <hr><h3 class="ph">New here? Make a free account</h3>
    <p>An account keeps your progress on every device and puts you on the leaderboard. You get an <b>account key</b>, which is your account. You can also pick a username and password so logging in is easier.</p>
    <div class="row"><button class="btn" id="kmake">Create my account</button></div>
    <p class="msg" id="kmsg"></p>`;
  bindLoginForm('aL',()=>{$('acct').close();toast('happy',TXT.helloAgain+' Your progress is loaded.')});
  $('kmake').onclick=async()=>{$('kmsg').className='msg';$('kmsg').textContent='Creating…';try{await makeAccount();acctUI(true);const m=$('kmsg');if(m){m.className='msg ok';m.textContent='Account created! Copy your account key and keep it somewhere safe. You can set a username and password below.'}}catch(e){$('kmsg').className='msg bad';$('kmsg').textContent=e.message}};
}
