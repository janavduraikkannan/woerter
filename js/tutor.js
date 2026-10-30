/* ---------- The AI tutor cat: grading with the AI, asking questions, the cat's faces and the chat ----------
   What the cat is called and says (PERSONA, GREETINGS, LEAD_RULES ...) and the grading prompt live in site/cat.js. */
const parseJ=t=>{const m=String(t).replace(/```(json)?/g,'').match(/\{[\s\S]*\}/);if(!m)throw new Error('the AI gave an unreadable reply');return JSON.parse(m[0])};
const ctxOf=q=>{const e2l=q.mode==='e2l',vocab=[...new Set(q.tokens.map(t=>t.vocab).filter(Boolean))].join('; ');
  if(q.mode==='id'&&q.idTok){const ty=TYPES[q.idType];return{e2l:false,src:q.latin+` (which ${TXT.useOf}${USES[ty.c].word} is "${phraseOf(q,q.idTok)}"?)`,model:`"${phraseOf(q,q.idTok)}" is ${ty.full}. The sentence means: ${cap(q.en)}${q.end}`,vocab}}
  return{e2l,src:q.choice?q.line+' ('+q.cite+')':e2l?cap(q.en)+q.end:q.latin,model:q.choice?q.answer:e2l?q.latin:cap(q.en)+q.end,vocab}};
async function aiGrade(q,answer){
  const c=ctxOf(q);
  const t=await aiChat(gradeMessages(c,answer));
  const j=parseJ(t);return{ok:j.correct===true,reason:String(j.reason||'')};
}
// thinking is never picked by the AI: the site shows it while waiting for an AI reply.
const FACES={...MOODS,thinking:'waiting for the AI'};
// Faces the site picks itself (no API call): greeting a new exercise, and reacting to an answer by its result.
const askBefore=lv=>PERSONA+"You are tutoring a high school student with one practice exercise from "+COURSE[lv]+". The student has NOT submitted yet and is asking you a question. You are shown the exercise, the correct answer, the student's current draft (whatever is typed in the answer box right now), and every earlier question and reply about this exercise, each with the draft as it was at that moment. Treat the whole conversation as context. Use the draft only as a reference to understand what the student is thinking. Do NOT correct the draft, point out mistakes in it, or say whether it is right or wrong, unless the student specifically asks you to check, correct, fix or fill in their answer. Jobs: 1) Decide whether the newest question is too leading, using these rules for this course. "+LEAD_RULES[lv]+" Judge the question by what it asks, not by whether your honest reply happens to touch the sentence. A question that only becomes a giveaway combined with earlier ones counts as too leading. When it is a close call, decide in the student's favor. 2) Answer the newest question helpfully in 2 to 4 short sentences. If it is too leading, still answer it, but do not write out the whole translated sentence unless the student asked you to correct or fill in their answer. 3) Only if the student explicitly asks you to correct, fix, change, rewrite or fill in their answer, put the full corrected answer in \"edit\" (it will replace the text in their answer box; keep everything in their draft that was already right and fix only what is wrong). Otherwise \"edit\" must be null. Reply only with JSON: {\"leading\": true or false, \"why\": \"one short sentence explaining the judgment\", \"reply\": \"your answer to the student\", \"edit\": null or \"the full corrected answer\", \"mood\": \"one of the expressions\"}.";
const levelOf=q=>{const order=LEVELS.map(l=>l[0]);const lv=q.topic&&q.topic.level;return order.includes(lv)?lv:'I'};
const ASK_AFTER=()=>PERSONA+"You are tutoring a high school "+LANG_NAME+" student. The student has already submitted an answer to this exercise, so you may explain everything openly, including the full answer, why their answer was right or wrong, and the grammar involved. Treat the whole conversation about this exercise as context. Answer the newest question clearly in 2 to 5 short sentences. Reply only with JSON: {\"reply\": \"your answer\", \"mood\": \"one of the expressions\"}.";
const draftOf=()=>{const f=$('qbody').querySelector('input.full');return f?f.value.trim():''};
async function aiAsk(q,question,draft){
  const c=ctxOf(q),after=checked;
  const hist=q.chat.filter(x=>!x.pending&&!x.err).map((x,i)=>`Q${i+1}${x.after?' (after submitting)':''} [answer box said: ${x.draft||'(empty)'}]: ${x.q}\nA${i+1}: ${x.a}${x.after?'':x.leading?' [judged too leading]':' [judged fine]'}${x.edit?` [you edited their answer to: ${x.edit}]`:''}`).join('\n')||'(none)';
  const user=`Course: ${COURSE[levelOf(q)]}\nExercise type: ${exerciseType(q,c)}\nSentence: ${c.src}\nCorrect answer: ${c.model}\nVocabulary shown to the student: ${c.vocab||'(none)'}\n${after?`Student's submitted answer: ${q.submitted||'(none)'}\nResult: ${q.result||''}\n`:`Student's current draft in the answer box: ${draft||'(empty)'}\n`}Earlier conversation about this exercise:\n${hist}\nNewest question: ${question}`;
  const t=await aiChat([{role:'system',content:after?ASK_AFTER():askBefore(levelOf(q))},{role:'user',content:user}]);
  const moodOf=m=>MOODS[m]?m:'happy';
  if(after){try{const j=parseJ(t);return{a:String(j.reply||''),mood:moodOf(j.mood),latin:cleanG(j.latin),after:true}}catch(e){return{a:t.trim(),mood:'happy',after:true}}}
  const j=parseJ(t),edit=typeof j.edit==='string'&&j.edit.trim()&&!q.choice?j.edit.trim():null;
  return{a:String(j.reply||''),leading:j.leading===true||!!edit,why:String(j.why||''),edit,mood:moodOf(j.mood),latin:cleanG(j.latin)};
}
const mdL=s=>md(s).replace(LW,(_,w,d)=>`<span class="lw" tabindex="0" data-en="${d.trim()}">${w.trim()}</span>`);
function md(s){
  const inl=t=>esc(t).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+?)\*\*/g,'<b>$1</b>').replace(/__([^_]+?)__/g,'<b>$1</b>')
    .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g,'$1<i>$2</i>').replace(/(^|[^_\w])_(?!\s)([^_\n]+?)_(?!\w)/g,'$1<i>$2</i>');
  const out=[];let list=null;
  const close=()=>{if(list){out.push(`<${list.t}>${list.items.map(i=>`<li>${i}</li>`).join('')}</${list.t}>`);list=null}};
  for(const raw of String(s).replace(/\r/g,'').split('\n')){
    const line=raw.trim(),ul=line.match(/^[-*•]\s+(.*)/),ol=line.match(/^\d+[.)]\s+(.*)/),hd=line.match(/^#{1,6}\s+(.*)/);
    if(ul||ol){const t=ul?'ul':'ol';if(!list||list.t!==t){close();list={t,items:[]}}list.items.push(inl((ul||ol)[1]));continue}
    close();
    if(!line){out.push('');continue}
    if(/^(-{3,}|\*{3,})$/.test(line))continue;
    out.push(hd?`<b>${inl(hd[1])}</b>`:inl(line));
  }
  close();
  return out.join('\n').replace(/\n{2,}/g,'<br><br>').replace(/\n(?!<\/?[uo]l)/g,'<br>').replace(/\n/g,'').replace(/(<br>)+(<[uo]l>)/g,'$2').replace(/(<\/[uo]l>)(<br>)+/g,'$1');
}
const FV='?v='+SITE.catV,felixImg=m=>`img/${SITE.catDir}/${FACES[m]?m:'happy'}.svg${FV}`,faceImg=m=>`img/${SITE.catDir}/face-${FACES[m]?m:'happy'}.svg${FV}`;
function setFelix(m){const f=$('felix');if(!f)return;f.src=felixImg(m);f.alt=`${SITE.cat} looking ${m}`;f.classList.remove('react');void f.offsetWidth;f.classList.add('react');}
function renderChat(){
  const greet=`<li class="greet"><div class="arow"><img src="${faceImg(q.greetMood||'happy')}" alt=""><div class="ca">${latH(q.greeting||GREETINGS[0])}</div></div></li>`;
  $('chat').innerHTML=greet+q.chat.map((x,k)=>`<li><p class="cq"><b>You${x.after?' (after answering)':''}:</b> ${esc(x.q)}</p><div class="arow"><img src="${faceImg(x.pending?'thinking':x.err?'sad':x.mood)}" alt=""><div class="ca" data-k="${k}">${x.pending?`<i>${latH(x.thinking)}</i><span class="typing"><i></i><i></i><i></i></span>`:x.err?`<span class="tag bad">Couldn't ask</span> ${esc(x.err)}`:`${x.after?'':x.leading?`<span class="tag bad">Too leading</span> `:`<span class="tag ok">Fine to ask</span> `}${mdL(x.a)}${x.why&&!x.after?`<br><small>${esc(x.why)}</small>`:''}${x.edit?`<br><span class="tag edit">Edited your answer</span> <span class="la">${esc(x.edit)}</span>`:''}`}</div></div></li>`).join('');
  const box=$('chat');box.querySelectorAll('.ca[data-k]').forEach(el=>{const x=q.chat[+el.dataset.k];if(x&&!x.pending&&x.latin)glossify(el,x.latin)});box.scrollTop=box.scrollHeight;
  $('askhint').textContent=checked?'Ask anything now; questions after answering never affect your score.':q.leaked?'A question was too leading, so this sentence will count as wrong. You can still answer it.':'Before you answer: a question that gives away part of the answer makes this sentence count as wrong.';
  $('askhint').className='hint'+(q.leaked&&!checked?' warn':'');
}
async function ask(){
  const inp=$('askq'),text=inp.value.trim();if(!text||!q)return;
  const draft=checked?(q.submitted||''):draftOf(),cur=q,item={q:text,pending:true,after:checked,draft,thinking:R(THINKING)};
  q.chat.push(item);inp.value='';renderChat();moodTok++;setFelix('thinking');
  try{Object.assign(item,await aiAsk(cur,text,draft))}catch(e){item.err=e.message||'The AI could not be reached'}
  item.pending=false;if(!item.after&&item.leading)cur.leaked=true;
  if(item.edit&&cur===q&&!checked){const f=$('qbody').querySelector('input.full');if(f&&!f.disabled){f.value=item.edit;}}
  if(cur===q){renderChat();moodTok++;setFelix(item.err?'sad':item.mood)}
}
