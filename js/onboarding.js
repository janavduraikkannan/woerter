
/* ---------- First-visit onboarding: the site's cat walks a new user through getting a free Groq key and (optionally) an account ---------- */
const ONB_PRIV=`<div class="onbtri">
  <section class="ok"><h3>Private</h3><ul>
    <li>Your AI key, unless you choose to save it. ${SITE.name} has no server of its own: the key goes straight from your browser to the AI company.</li>
    <li>Without an account, your progress stays in this browser only.</li></ul></section>
  <section class="maybe"><h3>Up to other companies</h3><ul>
    <li>When an answer is checked or you ask me something, the sentence, your answer and your question go to the AI company (Groq). What they keep is up to their privacy policy. ${SITE.name} can’t promise anything about it.</li>
    <li>The email you sign up with goes to Groq, not to ${SITE.name}.</li>
    <li>GitHub hosts this site and Google Firebase stores accounts.</li></ul></section>
  <section class="no"><h3>Not private</h3><ul>
    <li>The leaderboard and anything you put in your profile can be seen by other people.</li>
    <li>Account data isn’t encrypted: anyone with your account key can open it, and the site’s owner can see it.</li>
    <li>If you set a password, it’s never stored anywhere, so a forgotten password can’t be recovered. Your username is public.</li>
    <li>A key you save in your browser or account is stored as plain text.</li></ul></section></div>
  <p class="hint">Never type personal details (your address, phone number, passwords) into the chat or your profile.</p>`;
let onb={i:0,keyOk:false,saved:false,newAcct:''};
const ONB=[
 {face:'delighted',say:TXT.onbHello,
  body:()=>`<p class="onbstep">Welcome</p><h2 id="onbTitle">Practice ${LANG_NAME} sentences, one at a time</h2>
   <p>Pick the topics your class has covered, translate sentences between English and ${LANG_NAME}, and earn XP for a daily streak.</p>
   <p class="onbbig">One thing first: ${SITE.name} needs a free AI key to work.${TXT.onbAlso} The key lets the site check your sentences and lets me answer your questions. Without one, practice can’t start.</p>
   <p>I’ll show you how to get one for free. No credit card, no cost.</p>
   <div class="row"><button type="button" class="onblink" id="onbHave">I already have an AI key</button><button type="button" class="onblink" id="onbLogin">${TXT.onbLogin}</button></div>`,
  next:'Let’s get set up'},
 {face:'sly',say:'Before you sign up for anything, here’s the honest truth about privacy.',
  body:()=>`<p class="onbstep">Step 1 of 5 · Privacy</p><h2 id="onbTitle">What’s private, and what isn’t</h2>${ONB_PRIV}`,next:'Got it'},
 {face:'cheeky',say:'A few rules for signing up. These matter, so read them carefully!',
  body:()=>`<p class="onbstep">Step 2 of 5 · Before you start</p><h2 id="onbTitle">Who should make the key</h2><ul>
   <li><b>Use a personal email</b> that you can open right now. <b>Don’t use your school email</b> unless a teacher or other school staff member has said it’s OK.</li>
   <li><b>Under 18?</b> Groq’s rules say account holders must be 18 or older. Ask a parent or guardian to make the key with you. They can follow the <a href="getkey.html" target="_blank" rel="noopener">written guide</a>, then give you the key.</li>
   <li>Groq is a separate company with its own rules. ${SITE.name} isn’t part of Groq.</li></ul>`,next:'Next'},
 {face:'happy',say:'Watch this short video, then do the same thing in a new tab. I’ll wait right here.',
  body:()=>`<p class="onbstep">Step 3 of 5 · Get your key</p><h2 id="onbTitle">Get a free key from Groq</h2>
   <video controls preload="metadata" playsinline poster="media/groq-key-poster.jpg"><source src="media/groq-key-tutorial.mp4" type="video/mp4"><track kind="captions" src="media/groq-key-tutorial.vtt" srclang="en" label="English">Your browser can’t play this video. Use the written steps below.</video>
   <p><a class="btn" href="https://groq.com" target="_blank" rel="noopener">Open groq.com in a new tab</a></p>
   <details><summary>Show the written steps</summary><ol>
    <li>On groq.com, click <b>Start Building</b> (top right).</li>
    <li>Type your personal email and click <b>Continue with email</b>.</li>
    <li>Open the email from Groq and click the link inside (check Spam or Junk if you can’t find it).</li>
    <li>Click <b>API Keys</b> at the top, then <b>Create API Key</b>.</li>
    <li>Type any name, like <b>${SITE.name}</b>, leave <b>No expiration</b>, and click <b>Submit</b>.</li>
    <li>Click <b>Copy</b>. Groq shows the key only once!</li></ol></details>
   <p class="hint">Sharing this with a parent? Send them <a href="getkey.html" target="_blank" rel="noopener">the full guide page</a>.</p>`,next:'I have my key'},
 {face:'shocked',say:'Groq shows your key only once! Save it somewhere safe before you do anything else.',
  body:()=>`<p class="onbstep">Step 4 of 5 · Save and paste</p><h2 id="onbTitle">Save your key, then paste it here</h2>
   <p class="onbbig">Paste your key into a notes app, a password manager, or a document only you can see. Treat it like a password: don’t share it or post it anywhere.</p>
   <p><b>Your AI key</b> (it starts with <code>gsk_</code>). Click the box, then press Ctrl+V (Cmd+V on a Mac):</p>
   <input id="onbKey" type="password" autocomplete="off" spellcheck="false" placeholder="gsk_…" aria-label="Your AI key" value="${esc(slots[0].key)}">
   <div class="row"><button class="btn quiet" type="button" id="onbCheck">Check my key</button><span class="msg" id="onbMsg"></span></div>
   <label class="chk"><input type="checkbox" id="onbSaved"${onb.saved?' checked':''}> I saved my key somewhere safe</label>
   <label class="chk"><input type="checkbox" id="onbRem"${keyRemB?' checked':''}> Remember my key on this browser</label>
   <p class="hint">Only tick “Remember” on your own device, not on a shared or school computer. The key is stored as plain text in this browser.</p>`,next:'Next'},
 {face:'adoring',say:'Last thing, and it’s optional: an account keeps your XP and streak on every device.',skip:()=>{try{return!acctReady()}catch(e){return true}},
  body:()=>acct.key?`<p class="onbstep">Step 5 of 5 · Account (optional)</p><h2 id="onbTitle">You have an account</h2>
   ${onb.newAcct?`<p class="onbbig">Here’s your account key. Save it too, separately from your AI key. It’s the only way to sign in on another device.</p><div class="keybox">${esc(showKey(onb.newAcct))}</div><div class="row"><button class="btn quiet" type="button" id="onbACopy">Copy account key</button><span class="msg" id="onbAMsg"></span></div>`:'<p>This browser is already signed in.</p>'}
   <label class="chk"><input type="checkbox" id="onbRemA"${keyRemA?' checked':''}> Also save my AI key to my account</label>
   <p class="hint">Then it follows you to every device you log in on. It’s stored as plain text in your account, so keep your account key (and password) private.</p>
   ${loginOn()?`<p>You can also log in with <b>@${esc(board.handle||loginOn().hid)}</b> and your password.</p>`:`<details class="onbemail"${onb.emailOpen?' open':''}><summary>Optional: pick a username and password</summary><p>Easier than typing your account key on a new device. Your account key will still work too.</p>${pwSetHTML('oS',false)}</details>`}`
  :`<p class="onbstep">Step 5 of 5 · Account (optional)</p><h2 id="onbTitle">Make a free account?</h2>
   <p>An account saves your XP, streak, topics and settings, so you can pick up on any device, and it puts you on the leaderboard (you choose a username later).</p>
   <p>You get an <b>account key</b>, and that key is your account. Save it somewhere safe, just like your AI key. After that you can pick a username and password too, so logging in on another device is easier.</p>
   <div class="row"><button class="btn" type="button" id="onbMake">Create my account</button><button type="button" class="onblink" id="onbSignin">I already have an account: log in</button><span class="msg" id="onbAMsg"></span></div>
   <p class="hint">You can skip this and make an account later with the Account button at the top.</p>`,next:()=>acct.key?'Next':'Skip for now'},
 {face:SITE.proudFace,say:TXT.onbDone,
  body:()=>`<p class="onbstep">All done</p><h2 id="onbTitle">How ${SITE.name} works</h2><ul>
   <li>Pick the topics your class has covered, then click <b>Start practice</b>.</li>
   <li>Click a word under <b>Vocabulary</b> to type it into your answer.</li>
   <li>Hover over (or tap) a ${LANG_NAME} word with a dotted underline to see what it means.</li>
   ${TXT.onbTyping}<li>Ask me anything in <b>Ask ${SITE.cat}</b>. But a question that gives away the answer before you submit makes that sentence count as wrong!</li>
   <li>Need this guide again? Click <b>New here? Get a free key</b> under the key box.</li></ul>`,next:'Start learning'},
 {face:'happy',say:TXT.onbBack,skip:()=>!onb.login,backTo:0,
  body:()=>`<p class="onbstep">Log in</p><h2 id="onbTitle">Log in to your account</h2>
   <p>Use your username and password, or your account key. Either one works.</p>${loginFormHTML('oL')}
   <p class="hint">Forgot your password? Log in with your account key, then set a new password in Account. Without either one, the account can’t be recovered.</p>`,
  next:'I’m new: set me up',go:()=>{onb.login=false;onbGo(1)}}
];
const ONB_LOGIN=ONB.length-1;
const onbFace=m=>`img/${SITE.catDir}/${m}.svg?v=${SITE.catV}`;
function onbShow(){
  const st=ONB[onb.i];$('onbFelix').src=onbFace(st.face);$('onbSay').innerHTML=latH(st.say);
  $('onbBody').innerHTML=st.body();
  const shown=ONB.filter(x=>!(x.skip&&x.skip()));$('onbDots').innerHTML=shown.map(x=>`<i class="${x===st?'on':''}"></i>`).join('');
  $('onbBack').style.visibility=onb.i?'visible':'hidden';
  $('onbNext').textContent=typeof st.next==='function'?st.next():st.next;
  const h=$('onbHave');if(h)h.onclick=()=>onbGo(4);
  const lg=$('onbLogin');if(lg)lg.onclick=()=>{onb.login=true;onbGo(ONB_LOGIN)};
  if(onb.i===ONB_LOGIN)bindLoginForm('oL',onbLoggedIn);
  if(onb.i===4)onbKeyStep();
  if(onb.i===5)onbAcctStep();
  $('onb').scrollTop=0;onbNextState();
}
function onbNextState(){$('onbNext').disabled=onb.i===4&&!(onb.keyOk&&onb.saved)}
function onbGo(i){const d=i>onb.i?1:-1;while(ONB[i]&&ONB[i].skip&&ONB[i].skip())i+=d;onb.i=Math.max(0,Math.min(ONB.length-1,i));onbShow()}
function onbUseKey(k,st){
  // Put the key where the site reads it: slot 1 in simple mode, or on top of the ranked list in advanced mode.
  if(advanced&&slots[0].key&&slots[0].key!==k){const ex=slots.find(x=>x.key===k);if(ex)slots.splice(slots.indexOf(ex),1);slots.unshift(mkSlot({key:k}))}
  else slots[0].key=k;
  const s=slots[0];s.prov=st.prov;s.st=st;s.err='';s.on=true;fillSimple();saveKeys();keysUI(true);
}
function onbKeyStep(){
  const msg=(t,c)=>{$('onbMsg').className='msg '+(c||'');$('onbMsg').textContent=t};
  if(onb.keyOk)msg('Your key works!','ok');
  $('onbKey').addEventListener('input',()=>{onb.keyOk=false;msg('');onbNextState()});
  $('onbSaved').addEventListener('change',e=>{onb.saved=e.target.checked;onbNextState()});
  $('onbRem').addEventListener('change',e=>{keyRemB=e.target.checked;lsSet('verba-keys-browser',keyRemB);saveKeys();keysUI()});
  $('onbCheck').onclick=async()=>{
    const k=$('onbKey').value.trim().replace(/\s+/g,'');$('onbKey').value=k;
    if(!k){msg('Paste your key in the box first.','bad');return}
    msg('Checking…');$('onbCheck').disabled=true;
    try{const st=await detectKey(k,'auto');onbUseKey(k,st);onb.keyOk=true;$('onbFelix').src=onbFace('delighted');
      msg(`Your key works! (${PROVIDERS[st.prov].name})`,'ok');if(!onb.saved)$('onbSay').innerHTML=latH('It works! Now tick the box to show you saved it somewhere safe.')}
    catch(e){onb.keyOk=false;$('onbFelix').src=onbFace('sad');
      msg((e.message||'That key didn’t work')+'. Check that you copied the whole key, with nothing missing.','bad')}
    finally{$('onbCheck').disabled=false;onbNextState()}};
}
function onbAcctStep(){
  const msg=(t,c)=>{const m=$('onbAMsg');if(m){m.className='msg '+(c||'');m.textContent=t}};
  const mk=$('onbMake');if(mk)mk.onclick=async()=>{msg('Creating…');mk.disabled=true;try{onb.newAcct=await makeAccount();$('onbFelix').src=onbFace(SITE.proudFace);onbShow();$('onbNext').textContent='Next'}catch(e){mk.disabled=false;msg(e.message,'bad')}};
  const si=$('onbSignin');if(si)si.onclick=()=>{onb.login=true;onbGo(ONB_LOGIN)};
  const em=$('oSGo');if(em){bindPwSet('oS',()=>{onb.emailOpen=false;$('onbFelix').src=onbFace('delighted');setTimeout(()=>{if($('onb').open&&onb.i===5)onbShow()},1800)});const d=document.querySelector('.onbemail');if(d)d.ontoggle=()=>onb.emailOpen=d.open}
  const cp=$('onbACopy');if(cp)cp.onclick=async()=>{try{await navigator.clipboard.writeText(showKey(onb.newAcct));msg('Copied! Now paste it somewhere safe.','ok')}catch(e){msg('Select the key above and copy it.','bad')}};
  const ra=$('onbRemA');if(ra)ra.onchange=e=>{keyRemA=e.target.checked;lsSet('verba-keys-account',keyRemA);try{pushNow()}catch(x){}keysUI()};
}
function onbLoggedIn(){onb.login=false;$('onbFelix').src=onbFace('delighted');
  if(slots.some(x=>x.key)){onb.keyOk=true;onbGo(ONB.length-2);$('onbSay').innerHTML=latH(TXT.helloAgain+' You’re logged in and your AI key came with your account. All set!')}
  else{onbGo(1);$('onbSay').innerHTML=latH('You’re logged in! Your account doesn’t have an AI key saved, so let’s get you one.')}}
function onbDone(){lsSet(SITE.id+'-onboarded',true);if($('onb').open)$('onb').close()}
function openOnb(i=0){onb.keyOk=!!(slots[0].st&&slots[0].key);$('onb').showModal();onbGo(i);$('onbNext').focus()}
function setupOnboarding(){
  $('onbNext').onclick=()=>{const st=ONB[onb.i];if(st.go)return st.go();if(onb.i>=ONB_LOGIN-1){onbDone();return}onbGo(onb.i+1)};
  $('onbBack').onclick=()=>{const st=ONB[onb.i];if(st.backTo!==undefined){onb.login=false;return onbGo(st.backTo)}onbGo(onb.i-1)};
  $('onbClose').onclick=()=>onbDone();
  $('onb').addEventListener('close',()=>lsSet(SITE.id+'-onboarded',true));
  $('kguide').addEventListener('click',()=>openOnb(0));
  // First visit: no key anywhere and not signed in.
  if(!lsGet(SITE.id+'-onboarded',false)&&!slots.some(x=>x.key)&&!acct.key)openOnb(0);
}
