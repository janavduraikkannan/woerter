/* ---------- Page widgets: the hover-definition tooltip and the light/dark switch ---------- */
(function(){
  // The tooltip has to sit in the browser's top layer: open dialogs (onboarding, leaderboard, account) are drawn above
  // everything else on the page, so a normal element would be hidden behind them.
  const tip=document.createElement('div');tip.id='lwtip';tip.hidden=true;tip.setAttribute('role','tooltip');document.body.appendChild(tip);
  const canPop=typeof tip.showPopover==='function';if(canPop)tip.setAttribute('popover','manual');
  const lw=e=>e.target&&e.target.closest?e.target.closest('.lw'):null;
  const raise=t=>{const host=t.closest('dialog[open]')||document.body;if(tip.parentNode!==host){if(canPop&&tip.matches(':popover-open'))tip.hidePopover();host.appendChild(tip)}
    if(canPop){try{if(tip.matches(':popover-open'))tip.hidePopover();tip.showPopover()}catch(e){}}};
  const show=t=>{tip.textContent=t.dataset.en;tip.hidden=false;raise(t);const r=t.getBoundingClientRect();
    tip.style.left=Math.max(8,Math.min(r.left+r.width/2-tip.offsetWidth/2,innerWidth-tip.offsetWidth-8))+'px';
    let top=r.top-tip.offsetHeight-8;if(top<8)top=r.bottom+8;tip.style.top=top+'px'};
  document.addEventListener('mouseover',e=>{const t=lw(e);if(t&&t.dataset.en)show(t)});
  document.addEventListener('mouseout',e=>{const t=lw(e);if(t&&!t.contains(e.relatedTarget)&&document.activeElement!==t)tip.hidden=true});
  document.addEventListener('focusin',e=>{const t=lw(e);if(t&&t.dataset.en)show(t)});
  document.addEventListener('focusout',e=>{if(lw(e))tip.hidden=true});
  document.addEventListener('click',e=>{const t=lw(e);if(t&&t.dataset.en){t.focus();show(t)}});
  addEventListener('scroll',()=>{tip.hidden=true},true);
})();
(function(){
  var root=document.documentElement, tt=document.getElementById("theme-toggle");
  tt.setAttribute("aria-label",root.getAttribute("data-theme")==="dark"?"dark":"light");
  tt.addEventListener("click",function(){
    var next=root.getAttribute("data-theme")==="dark"?"light":"dark";
    root.setAttribute("data-theme",next);tt.setAttribute("aria-label",next);
    try{localStorage.setItem("verba-theme",next);}catch(e){}
  });
})();
