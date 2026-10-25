const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const origin=process.env.BASE_URL||'http://127.0.0.1:8793';
const report={engine:'Chromium emulation',checks:[],limits:['Physical Firefox/WebKit, native share sheets and hardware keyboards require device checks.']};
const root=path.resolve(__dirname,'..');
function pages(dir=root){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>['.git','output','amp'].includes(d.name)?[]:d.isDirectory()?pages(path.join(dir,d.name)):d.name.endsWith('.html')&&fs.readFileSync(path.join(dir,d.name),'utf8').includes('class="classband"')?[path.join(dir,d.name)]:[]);}
async function run(name,fn){if(process.env.BLOG_TEST_FILTER&&!name.toLowerCase().includes(process.env.BLOG_TEST_FILTER.toLowerCase()))return;await fn();report.checks.push({name,status:'passed'});console.log('PASS '+name);}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 await run('All generated case-file pages fit phone and tablet widths',async()=>{
  let count=0;
  for(const [width,height] of [[320,640],[393,851],[430,932],[768,1024]]){
   const c=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),p=await c.newPage();let errors=[];p.on('pageerror',e=>errors.push(e.message));
   for(const page of pages()){
    let pathname='/'+path.relative(root,page).replaceAll(path.sep,'/').replace(/index.html$/,'');
    await p.goto(origin+pathname);await p.locator('[data-cf-mobile]').waitFor({state:'attached'});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${pathname} overflow at ${width}`);
    assert.equal(await p.locator('.cf-mobile-bar').count(),1);count++;
   }
   assert.deepEqual(errors,[]);await c.close();
  }
  report.page_viewport_combinations=count;
 });
 await run('Bulletin loops, pauses persistently, and reduced motion shows its full text',async()=>{
  const c=await browser.newContext({viewport:{width:393,height:851},isMobile:true,hasTouch:true}),p=await c.newPage();await p.goto(origin);
  assert.equal(await p.locator('.cf-bulletin-track').evaluate(n=>getComputedStyle(n).animationName),'cf-bulletin');
  assert.equal(await p.locator('.cf-bulletin-track [aria-hidden=true]').count(),1);
  await p.getByRole('button',{name:'Pause bulletin',exact:true}).tap();assert.equal(await p.locator('.classband').getAttribute('data-paused'),'true');
  await p.reload();assert.equal(await p.locator('.classband').getAttribute('data-paused'),'true');
  await p.getByRole('button',{name:'Play bulletin',exact:true}).tap();
  const tabs=p.locator('.cf-folder-nav');assert(await tabs.evaluate(n=>n.scrollWidth>n.clientWidth));
  await tabs.evaluate(n=>n.scrollLeft=n.scrollWidth);assert(await tabs.evaluate(n=>n.scrollLeft>0));
  await p.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await p.locator('.cf-bulletin-track').evaluate(n=>getComputedStyle(n).animationName),'none');
  assert(await p.locator('.cf-bulletin-track>span').first().evaluate(n=>n.scrollWidth<=n.clientWidth+1));
  assert.equal(await p.locator('.cf-bulletin-track [aria-hidden=true]').isVisible(),false);await c.close();
 });
 await run('Reading controls derive all sections, retain type size and track progress',async()=>{
  const c=await browser.newContext({viewport:{width:393,height:851},isMobile:true,hasTouch:true}),p=await c.newPage();await p.goto(origin+'/mission-bianca-costa-closing-the-file/');
  const count=await p.locator('.file .entry h2,.file .entry h3').count();assert(count>0);
  await p.getByRole('button',{name:'Sections',exact:true}).tap();assert.equal(await p.locator('.cf-sheet-body a').count(),count);
  const last=p.locator('.cf-sheet-body a').last(),text=await last.textContent();await last.tap();assert.equal(await p.locator('.cf-sheet').isVisible(),false);
  assert.equal(await p.evaluate(()=>document.activeElement.textContent),text);assert.match(new URL(p.url()).hash,/file-section-/);
  await p.getByRole('button',{name:'Read',exact:true}).tap();await p.getByRole('button',{name:'Largest',exact:true}).tap();
  await p.getByRole('button',{name:'Close panel',exact:true}).tap();await p.reload();
  assert.equal(await p.locator('html').evaluate(n=>n.style.getPropertyValue('--cf-type')),'1.24');
  assert(await p.locator('.entry').last().evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>20));
  await p.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));await p.waitForFunction(()=>document.querySelector('[role=progressbar]').getAttribute('aria-valuenow')==='100');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await c.close();
 });
 await run('Evidence images open in a full screen viewer and restore focus',async()=>{
  const c=await browser.newContext({viewport:{width:393,height:851},isMobile:true,hasTouch:true}),p=await c.newPage();await p.goto(origin+'/mission-bianca-costa-closing-the-file/');
  const trigger=p.locator('.cf-exhibit').first();await trigger.tap();await p.locator('.cf-image-dialog[open]').waitFor();
  assert(await p.locator('.cf-image-dialog img').evaluate(n=>n.complete&&n.naturalWidth>0));
  await p.getByRole('button',{name:'Original size',exact:true}).tap();assert.equal(await p.getByRole('button',{name:'Fit image',exact:true}).getAttribute('aria-pressed'),'true');
  await p.getByRole('button',{name:'Close evidence image',exact:true}).tap();assert(await trigger.evaluate(n=>n===document.activeElement));await c.close();
 });
 await run('Search uses the feed safely and handles unavailable indexing',async()=>{
  const c=await browser.newContext({viewport:{width:393,height:851},isMobile:true,hasTouch:true}),p=await c.newPage();
  await p.route('**/feed.json',r=>r.fulfill({json:{items:[{title:'<img src=x onerror=alert(1)> New file',url:'https://blog.syncpundit.io/new-case/',tags:['Phishing'],summary:'A new post'},{title:'Other research',url:'javascript:alert(1)',tags:[]}]}}));
  await p.goto(origin);await p.getByRole('button',{name:'Search',exact:true}).tap();await p.locator('.cf-search').fill('phishing');await p.locator('.cf-result').waitFor();
  assert.equal(await p.locator('.cf-result').count(),1);assert.equal(await p.locator('.cf-result img').count(),0);assert.match(await p.locator('.cf-result').textContent(),/<img/);
  assert.equal(await p.locator('.cf-result').getAttribute('href'),'https://blog.syncpundit.io/new-case/');
  await p.keyboard.press('Escape');assert(await p.getByRole('button',{name:'Search',exact:true}).evaluate(n=>n===document.activeElement));await c.close();
  const c2=await browser.newContext({viewport:{width:393,height:851}}),p2=await c2.newPage();await p2.route('**/feed.json',r=>r.abort());await p2.goto(origin);await p2.getByRole('button',{name:'Search',exact:true}).click();await p2.getByText('The index is unavailable.',{exact:false}).waitFor();await c2.close();
 });
 await run('Sharing falls back to selectable links when clipboard is unavailable',async()=>{
  const c=await browser.newContext({viewport:{width:393,height:851},hasTouch:true,isMobile:true});
  await c.addInitScript(()=>{Object.defineProperty(navigator,'share',{value:undefined});Object.defineProperty(navigator,'clipboard',{value:undefined});});
  const p=await c.newPage();await p.goto(origin+'/are-we-safe-from-tiktok/');await p.getByRole('button',{name:'Share',exact:true}).tap();await p.getByRole('button',{name:'Copy link',exact:true}).tap();
  assert.match(await p.locator('.cf-search-status').textContent(),/selected/);assert.match(await p.locator('.cf-share-url').inputValue(),/are-we-safe-from-tiktok/);
  assert(await p.locator('.cf-share-url').evaluate(n=>n.selectionEnd>n.selectionStart));await c.close();
 });
 await run('A newly generated post inherits section controls and contains wide evidence',async()=>{
  const c=await browser.newContext({viewport:{width:320,height:640},hasTouch:true,isMobile:true}),p=await c.newPage();
  await p.route('**/future-case/',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/css/main.css"><script src="/assets/js/main.js" defer></script></head><body class="post-template"><div class="classband">// A newly published file //</div><header class="site-header compact"><a class="brand" href="/">Case files</a></header><main><article class="file"><div class="paper"><div class="entry"><h2>New evidence</h2><p>'+('A long investigation. '.repeat(80))+'</p><pre><code>'+('0123456789'.repeat(30))+'</code></pre><h3>Fresh conclusion</h3><table><tr><th>'+('Long heading '.repeat(20))+'</th><th>Second column</th></tr><tr><td>Evidence</td><td>More evidence</td></tr></table></div></div></article></main></body></html>'}));
  await p.goto(origin+'/future-case/');await p.getByRole('button',{name:'Sections',exact:true}).tap();assert.equal(await p.locator('.cf-sheet-body a').count(),2);await p.keyboard.press('Escape');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert(await p.locator('pre').evaluate(n=>n.scrollWidth>n.clientWidth));assert(await p.locator('.table-wrap').evaluate(n=>n.scrollWidth>n.clientWidth));
  assert.equal(await p.locator('.table-wrap').getAttribute('tabindex'),'0');await c.close();
 });
 await run('Desktop retains its layout and the core site works without JavaScript',async()=>{
  const c=await browser.newContext({viewport:{width:1440,height:1000}}),p=await c.newPage();await p.goto(origin);
  assert.equal(await p.locator('.cf-mobile-bar').isVisible(),false);assert.equal(await p.locator('.cf-bulletin-track [aria-hidden=true]').isVisible(),false);
  assert.equal(await p.locator('.cf-folder-nav').count(),0);assert(await p.locator('.grid').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length>=3));
  await p.setViewportSize({width:393,height:851});await p.locator('.cf-folder-nav').waitFor({state:'attached'});await p.setViewportSize({width:1440,height:1000});await p.locator('.cf-folder-nav').waitFor({state:'detached'});await c.close();
  const c2=await browser.newContext({viewport:{width:320,height:640},javaScriptEnabled:false}),p2=await c2.newPage();await p2.goto(origin);
  assert((await p2.locator('.case a').count())>0);assert(await p2.locator('.tabs a').first().isVisible());assert(await p2.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await c2.close();
 });
 }finally{await browser.close();}
 fs.writeFileSync(path.join(__dirname,process.env.BLOG_TEST_FILTER?'mobile-focused-results.json':'mobile-results.json'),JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
