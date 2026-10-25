/* Progressive mobile controls for the existing Publii case-file markup. */
(function () {
 'use strict';
 if(document.querySelector('[data-cf-mobile]'))return;
 var compact=matchMedia('(max-width:820px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 var root=document.documentElement,entry=document.querySelector('.file .paper'),header=document.querySelector('.site-header');
 if(!header)return;
 var icons={files:'M3 7h7l2 2h9v11H3zM3 7V4h7l2 3',search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6',sections:'M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1',read:'M3 19 9 5l6 14M5 15h8m3-3h5m-2-2v9',share:'M12 16V3m-5 5 5-5 5 5M4 12v9h16v-9',top:'m5 13 7-7 7 7M12 6v15'};
 function node(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
 function safeURL(raw){try{var u=new URL(raw,location.href);return /^https?:$/.test(u.protocol)?u.href:null;}catch{return null;}}
 function read(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
 function save(key,value){try{localStorage.setItem(key,value);}catch{}}
 function control(label,icon,handler){
  var b=node('button');b.type='button';
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+icons[icon]+'"/></svg>';
  b.append(node('span','',label));b.addEventListener('click',function(){b.focus({preventScroll:true});handler();});return b;
 }
 var sheet=node('dialog','cf-sheet');sheet.dataset.cfMobile='';sheet.setAttribute('aria-labelledby','cf-sheet-title');
 var sheetHeader=node('div','cf-sheet-header'),title=node('h2','','');title.id='cf-sheet-title';
 var close=node('button','cf-sheet-close','×');close.type='button';close.setAttribute('aria-label','Close panel');
 sheetHeader.append(title,close);var sheetBody=node('div','cf-sheet-body');sheet.append(sheetHeader,sheetBody);document.body.append(sheet);
 var opener=null;
 close.addEventListener('click',function(){sheet.close();});
 sheet.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();sheet.close();}});
 sheet.addEventListener('close',function(){if(!sheet.open&&opener?.isConnected)opener.focus({preventScroll:true});});
 sheet.addEventListener('click',function(e){if(e.target!==sheet)return;var r=sheet.getBoundingClientRect();if(e.clientY<r.top||e.clientX<r.left||e.clientX>r.right)sheet.close();});
 function show(label,trigger){
  if(!sheet.open)opener=trigger||document.activeElement;title.textContent=label;sheetBody.replaceChildren();if(!sheet.open)sheet.showModal();return sheetBody;
 }
 function syncViewport(){
  var vv=visualViewport,zoomed=(vv?.scale||1)>1.05,height=zoomed?innerHeight:(vv?.height||innerHeight);
  root.style.setProperty('--cf-visible-height',Math.round(height)+'px');
  root.style.setProperty('--cf-keyboard-inset',(zoomed?0:Math.max(0,Math.round(innerHeight-height-(vv?.offsetTop||0))))+'px');
 }
 visualViewport?.addEventListener('resize',syncViewport,{passive:true});visualViewport?.addEventListener('scroll',syncViewport,{passive:true});window.addEventListener('resize',syncViewport,{passive:true});syncViewport();

 // The full bulletin is available once to assistive technology; its loop is decorative.
 var band=document.querySelector('.classband');
 if(band){
  var bulletin=band.textContent.trim(),windowEl=node('div','cf-bulletin-window'),track=node('div','cf-bulletin-track');
  var first=node('span','',bulletin+' '),duplicate=node('span','',bulletin+' ');duplicate.setAttribute('aria-hidden','true');track.append(first,duplicate);windowEl.append(track);
  var pause=node('button','cf-bulletin-toggle');pause.type='button';
  var userPaused=read('cf.bulletin.paused','false')==='true';
  function updateBulletin(){
   band.dataset.paused=String(userPaused||document.hidden||!compact.matches||reduced.matches);
   pause.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true">'+(userPaused?'<path d="m6 4 10 6-10 6z"/>':'<path d="M6 4v12m8-12v12"/>')+'</svg>';pause.setAttribute('aria-label',userPaused?'Play bulletin':'Pause bulletin');pause.setAttribute('aria-pressed',String(userPaused));
  }
  pause.addEventListener('click',function(){userPaused=!userPaused;save('cf.bulletin.paused',String(userPaused));updateBulletin();});
  band.replaceChildren(windowEl,pause);band.style.setProperty('--cf-bulletin-duration',Math.max(20,bulletin.length*.34)+'s');
  document.addEventListener('visibilitychange',updateBulletin);reduced.addEventListener('change',updateBulletin);compact.addEventListener('change',updateBulletin);updateBulletin();
 }

 // Move, rather than duplicate, the generated category navigation for a sticky thumb strip.
 var nav=header.querySelector('nav'),navMarker=node('span');navMarker.hidden=true;
 if(nav){
  nav.before(navMarker);
  function placeNav(){
   if(compact.matches){header.after(nav);nav.classList.add('cf-folder-nav');}
   else{navMarker.after(nav);nav.classList.remove('cf-folder-nav');}
  }
  nav.querySelectorAll('a').forEach(function(a){if(new URL(a.href).pathname===location.pathname)a.setAttribute('aria-current','page');});
  compact.addEventListener('change',placeNav);placeNav();
 }

 function share(){
  var canonical=document.querySelector('link[rel=canonical]')?.href||location.href;
  var data={title:document.title,url:canonical};
  function fallback(){
   var body=show('Share this file');body.append(node('p','','Copy the permanent link to this case file.'));
   var label=node('label','cf-field','File link');label.htmlFor='cf-share-url';
   var input=node('input','cf-share-url');input.id='cf-share-url';input.readOnly=true;input.value=canonical;
   var copy=node('button','cf-copy','Copy link');copy.type='button';var status=node('p','cf-search-status');status.setAttribute('role','status');
   copy.addEventListener('click',async function(){
    try{if(!navigator.clipboard?.writeText)throw Error('Unavailable');await navigator.clipboard.writeText(canonical);status.textContent='Link copied.';}
    catch{input.focus();input.select();status.textContent='Link selected. Touch and hold to copy.';}
   });body.append(label,input,copy,status);
  }
  if(navigator.share)navigator.share(data).catch(function(e){if(e.name!=='AbortError')fallback();});else fallback();
 }

 var feedPromise=null;
 function search(){
  var body=show('Find a case file'),label=node('label','cf-field','Search the records');label.htmlFor='cf-search';
  var input=node('input','cf-search');input.id='cf-search';input.type='search';input.placeholder='A name, topic, or investigation';input.autocomplete='off';
  var status=node('p','cf-search-status','Loading the index…');status.setAttribute('role','status');var results=node('div');
  body.append(label,input,status,results);input.focus();
  if(!feedPromise)feedPromise=fetch('/feed.json').then(function(r){if(!r.ok)throw Error('No feed');return r.json();}).then(function(f){if(!Array.isArray(f.items))throw Error('No records');return f.items;}).catch(function(e){feedPromise=null;throw e;});
  feedPromise.then(function(items){
   if(!input.isConnected)return;
   function render(){
    var q=input.value.trim().toLocaleLowerCase();
    var matches=items.filter(function(i){return [i.title,i.summary,(i.tags||[]).join(' ')].join(' ').toLocaleLowerCase().includes(q);});
    results.replaceChildren();status.textContent=matches.length+' '+(matches.length===1?'file':'files')+(q?' found':' in the index');
    matches.forEach(function(item){
     var href=safeURL(item.url);if(!href)return;var a=node('a','cf-result',item.title||'Untitled case file');a.href=href;
     var date=new Date(item.date_published);var metadata=Number.isFinite(date.getTime())?date.toLocaleDateString('en',{year:'numeric',month:'short'}):'';
     if(metadata)a.append(node('small','',metadata));results.append(a);
    });
   }
   input.addEventListener('input',render);render();
  }).catch(function(){if(input.isConnected)status.textContent='The index is unavailable. Your category tabs and case files still work.';});
 }

 var bar=node('nav','cf-mobile-bar');bar.setAttribute('aria-label',entry?'Reading controls':'Records room controls');
 var files=node('a');files.href='/';files.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+icons.files+'"/></svg>';files.append(node('span','','Files'));bar.append(files);
 if(entry){
  var headings=[...entry.querySelectorAll('.entry h2,.entry h3')].filter(function(h){return h.textContent.trim();});
  headings.forEach(function(h,i){if(!h.id){var id='file-section-'+(i+1);while(document.getElementById(id))id+='-';h.id=id;}});
  var sections=control('Sections','sections',function(){
   var body=show('Inside this file');headings.forEach(function(h){
    var a=node('a','',h.textContent.trim());a.href='#'+encodeURIComponent(h.id);a.dataset.level=h.tagName.slice(1);
    a.addEventListener('click',function(e){e.preventDefault();opener=h;sheet.close();h.tabIndex=-1;h.focus({preventScroll:true});h.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});history.replaceState(history.state,'','#'+encodeURIComponent(h.id));});body.append(a);
   });
  });sections.disabled=!headings.length;bar.append(sections);
  function setType(size){root.style.setProperty('--cf-type',size);save('cf.reader.size',String(size));}
  var stored=read('cf.reader.size','1');setType(['1','1.12','1.24'].includes(stored)?stored:'1');
  bar.append(control('Read','read',function(){
   var body=show('Reading room');body.append(node('p','','Set a comfortable text size. Your choice stays on this browser.'));
   var group=node('div','cf-size-options');group.setAttribute('role','group');group.setAttribute('aria-label','Article text size');
   [['1','Standard'],['1.12','Larger'],['1.24','Largest']].forEach(function(pair){
    var b=node('button','',pair[1]);b.type='button';b.setAttribute('aria-pressed',String(root.style.getPropertyValue('--cf-type')===pair[0]));
    b.addEventListener('click',function(){setType(pair[0]);group.querySelectorAll('button').forEach(function(c){c.setAttribute('aria-pressed',String(c===b));});});group.append(b);
   });body.append(group,control('Search all files','search',search));
  }));
  var progress=node('div','cf-reading-progress');progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','Reading progress');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');progress.setAttribute('aria-valuenow','0');progress.append(node('span'));document.body.append(progress);
  var frame=0;
  function updateProgress(){frame=0;var r=entry.getBoundingClientRect(),available=innerHeight-160;var value=Math.max(0,Math.min(1,(120-r.top)/Math.max(1,r.height-available)));progress.style.setProperty('--cf-progress',value.toFixed(3));progress.setAttribute('aria-valuenow',String(Math.round(value*100)));}
  function schedule(){if(!frame)frame=requestAnimationFrame(updateProgress);}
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});new ResizeObserver(schedule).observe(entry);schedule();
  entry.querySelectorAll('.table-wrap').forEach(function(w){w.tabIndex=0;w.setAttribute('role','region');w.setAttribute('aria-label','Scrollable evidence table');});
 }else{
  bar.append(control('Search','search',search),control('Top','top',function(){window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});}));
 }
 bar.append(control('Share','share',share));document.body.append(bar);
 compact.addEventListener('change',function(){if(!compact.matches&&sheet.open)sheet.close();});

 if(entry){
  var viewer=node('dialog','cf-image-dialog');viewer.setAttribute('aria-label','Evidence image');
  var vh=node('div','cf-sheet-header'),vt=node('h2','','Evidence image'),tools=node('div','cf-image-tools'),zoom=node('button','','Original size'),vc=node('button','cf-sheet-close','×');
  zoom.type=vc.type='button';vc.setAttribute('aria-label','Close evidence image');tools.append(zoom,vc);vh.append(vt,tools);
  var scroll=node('div','cf-image-scroll'),picture=node('img');scroll.append(picture);viewer.append(vh,scroll);document.body.append(viewer);var imageOpener=null;
  vc.addEventListener('click',function(){viewer.close();});viewer.addEventListener('close',function(){imageOpener?.focus({preventScroll:true});});
  zoom.addEventListener('click',function(){var full=scroll.classList.toggle('cf-full-image');zoom.textContent=full?'Fit image':'Original size';zoom.setAttribute('aria-pressed',String(full));});
  entry.querySelectorAll('.entry img').forEach(function(img){
   if(img.closest('a,button'))return;
   var b=node('button','cf-exhibit');b.type='button';b.setAttribute('aria-label','View exhibit: '+(img.alt||'evidence image'));img.before(b);b.append(img);
   b.addEventListener('click',function(){
    var src=safeURL(img.src||img.currentSrc);if(!src)return;
    imageOpener=b;picture.src=src;picture.alt=img.alt||'Evidence image';scroll.classList.remove('cf-full-image');zoom.textContent='Original size';zoom.setAttribute('aria-pressed','false');viewer.showModal();scroll.scrollTo(0,0);
   });
  });
 }
})();
