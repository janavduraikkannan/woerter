
/* Click a vocab word to type it into the answer box at the cursor (or at the end if the cursor was never placed). */
const vocabLi=v=>{const w=vocabWords(v);return `<li tabindex="0" role="button" data-la="${esc(w.la)}" data-en="${esc(w.en)}" title="Click to put “${esc(q&&q.mode==='l2e'?w.en:w.la)}” in your answer">${esc(v)}</li>`};
document.addEventListener('selectionchange',()=>{const a=document.activeElement;if(a&&a.tagName==='INPUT'&&$('qbody').contains(a))a.dataset.caret='1'});
function insertVocab(li){
  if(!q||q.choice||checked)return;
  let inp=lastInput&&$('qbody').contains(lastInput)&&!lastInput.disabled?lastInput:$('qbody').querySelector('input:not(:disabled)');
  if(!inp)return;
  const word=q.mode==='l2e'?li.dataset.en:li.dataset.la;if(!word)return;
  const v=inp.value,placed=inp.dataset.caret==='1'&&inp.selectionStart!=null;
  const a=placed?inp.selectionStart:v.length,b=placed?(inp.selectionEnd??a):v.length;
  const before=v.slice(0,a),after=v.slice(b);
  const pre=before&&!/\s$/.test(before)?' ':'',post=after&&/^[^\s.,;:!?)]/.test(after)?' ':'';
  inp.value=before+pre+word+post+after;
  const pos=(before+pre+word).length;
  inp.focus();inp.setSelectionRange(pos,pos);inp.dataset.caret='1';lastInput=inp;
}
$('vlist').addEventListener('mousedown',e=>{if(e.target.closest('li'))e.preventDefault()}); // keep the cursor where it is in the answer box
$('vlist').addEventListener('click',e=>{const li=e.target.closest('li');if(li)insertVocab(li)});
$('vlist').addEventListener('keydown',e=>{const li=e.target.closest('li');if(li&&(e.key==='Enter'||e.key===' ')){e.preventDefault();insertVocab(li)}});
$('vtoggle').addEventListener('click',()=>{const l=$('vlist');l.hidden=!l.hidden;$('vtoggle').textContent=l.hidden?'Show':'Hide'});
