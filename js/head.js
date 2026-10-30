/* ---------- Runs in the <head> of every page, right after site/config.js: the page title and the tab icon ----------
   index.html uses SITE.title; keys.html and getkey.html give their own title in <html data-title> ({name} becomes SITE.name)
   and take their link and button colours from SITE.pageAccent and SITE.pageButton. */
(function(){
  var h=document.documentElement,t=h.getAttribute('data-title');
  document.title=t?t.replace('{name}',SITE.name):SITE.title;
  var l=document.createElement('link');l.rel='icon';l.type='image/svg+xml';l.href='img/'+SITE.catDir+'/happy.svg?v='+SITE.catV;document.head.appendChild(l);
  if(t){var st=document.createElement('style');st.textContent=':root{--accent:'+SITE.pageAccent+';--button:'+SITE.pageButton+'}';document.head.appendChild(st)}
})();
