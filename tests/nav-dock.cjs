if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');
const root=path.resolve(__dirname,'../assets');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);});});
// Prefs › Read: pick an instrument from the style cards.
async function chooseStyle(page,theme){const tab=page.getByRole('tab',{name:'Read',exact:true});if(await tab.count())await tab.click();await page.locator(`#panel-dialog [data-read-style="${theme}"]`).click();}
(async()=>{
 await new Promise(r=>server.listen(8798,'127.0.0.1',r));const browser=await chromium.launch({...launch(),headless:true}),page=await browser.newPage({viewport:{width:412,height:915},hasTouch:true});const errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8798/'))external.push(r.url());});
 const dock=page.locator('nav.mobile-nav'),tray=page.locator('aside.sidebar');
 const check=async()=>{
  await page.waitForFunction(()=>{const active=document.querySelector('.mobile-nav .nav-key.active'),other=document.querySelector('.mobile-nav .nav-key:not(.active)');return active&&other&&Number(getComputedStyle(active).flexGrow)>1.6&&active.getBoundingClientRect().width>other.getBoundingClientRect().width+3;});
  // Geometry skips buttons with no client rects (the folded spine's expand key, keys hidden in Read).
  const geometry=await dock.evaluate(nav=>[...nav.querySelectorAll('button')].filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {name:el.getAttribute('aria-label'),width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,hit:hit===el||el.contains(hit)};}));
  const viewport=page.viewportSize();for(const g of geometry)assert(g.width>=44&&g.height>=44&&g.left>=0&&g.right<=viewport.width&&g.top>=0&&g.bottom<=viewport.height&&g.hit,JSON.stringify(g));
  assert.equal(await dock.locator('[aria-current=page]').count(),1);assert.equal(await dock.locator('.active').count(),1);
  const active=await dock.locator('.nav-key.active').boundingBox(),other=await dock.locator('.nav-key:not(.active)').first().boundingBox();if(active.width<=other.width)await page.screenshot({path:path.join(__dirname,'nav-dock-debug.png')});assert(active.width>other.width,JSON.stringify({viewport,active,other}));
  assert.equal(await dock.locator('.nav-key.active .pip').evaluate(el=>getComputedStyle(el).backgroundImage.includes('gradient')),true,'The seated key lights its pip');
  assert(await dock.locator('.nav-key.active .nav-key-name').evaluate(el=>el.scrollWidth<=el.clientWidth+.5&&el.getBoundingClientRect().right<=el.closest('.nav-key').getBoundingClientRect().right+.5),'The seated caption is whole, never clipped');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page overflow');
 };
 const receipt=page.locator('#toast'),settled=()=>page.waitForFunction(()=>{const r=document.querySelector('#toast');return !r.hidden&&r.classList.contains('is-in')&&getComputedStyle(r).transform==='none'&&getComputedStyle(r).opacity==='1';});
 const say=message=>page.evaluate(m=>window.dispatchEvent(new CustomEvent('native-message',{detail:m})),message);
 try{
  await page.goto('http://127.0.0.1:8798/');await page.waitForFunction(()=>!!window.Nightwire);assert.equal(await page.locator('#dock-context').textContent(),'No file open');assert.equal(await page.locator('#dock-count').isVisible(),false);
  // Banned chrome is gone: no top bar, no file-count badge, no decorative key numbers.
  assert.equal(await page.locator('.topbar,#nav-count,.nav-key-number,.badge').count(),0);
  const name='Field-notes-with-a-long-source-cartridge-name.md';
  await page.locator('#file-input').setInputFiles({name,mimeType:'text/markdown',buffer:Buffer.from('# Filed notes\n\n## Keep looking\n\n'+('Follow the small useful things. '.repeat(90)))});await page.locator('#markdown h1').waitFor();
  assert.equal(await dock.locator('[aria-current=page]').count(),0,'The reader marks no route');assert.equal(await page.locator('#dock-context').textContent(),'Filed notes');assert.equal(await page.locator('#dock-count').getAttribute('aria-label'),'0% read');
  for(const width of [320,348,360,412,600,768,800]){
   await page.setViewportSize({width,height:915});
   for(const [label,view]of [['Desk','home'],['Shelf','library'],['Map','graph'],['Read','terminal']]){
    await dock.getByRole('button',{name:label,exact:true}).click();await page.waitForFunction(view=>document.body.dataset.view===view,view);if(view==='terminal')await page.locator('#terminal-words').waitFor();
    await check();assert.equal(await dock.locator('[aria-current=page]').getAttribute('aria-label'),label);
    assert.equal(await page.locator('#dock-section').isVisible(),width>=360&&!!(await page.locator('#dock-section').textContent()),'Section readout hides below 360px');
   }
  }
  // Reading progress reaches the register: "% read" after scroll idle, and the section it is in.
  await page.setViewportSize({width:412,height:915});await dock.getByRole('button',{name:'Shelf',exact:true}).click();await page.evaluate(()=>Nightwire.debug.openDocument(Nightwire.debug.state().docs[0].id));await page.locator('#markdown h2').waitFor();
  // The reader restores its saved position a frame after opening, so keep asking for the bottom until the register settles.
  await page.waitForFunction(()=>{window.scrollTo(0,document.documentElement.scrollHeight);return document.querySelector('#dock-count').getAttribute('aria-label')==='100% read';},null,{polling:300});assert.equal(await page.locator('#dock-section').textContent(),'§1 Keep looking');
  assert.equal(await page.evaluate(()=>document.querySelectorAll('#dock-count .odo-d').length),3,'Odometer wheels per digit');
  // Back from the reader returns to the place it was opened from.
  assert.equal(await page.evaluate(()=>Nightwire.back()),true);await page.waitForFunction(()=>document.body.dataset.view==='library');
  // Spine: only while reading, and only when the reader folds it (E3 scroll / E7 playback); a tap brings the keys back.
  await page.evaluate(()=>Nightwire.debug.openDocument(Nightwire.debug.state().docs[0].id));await page.locator('#markdown h2').waitFor();await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(100);
  for(let y=60;y<=600;y+=60){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(30);}await page.waitForTimeout(150);
  assert(await page.evaluate(()=>document.body.classList.contains('dock-collapsed')),'Scrolling down the reader folds the dock to its spine');{
   const box=await dock.boundingBox();assert(Math.abs(box.height-52)<1,'Spine is 52px');assert.equal(await dock.locator('.nav-routes').isVisible(),false);
   await dock.getByRole('button',{name:'Show navigation'}).click();await page.waitForFunction(()=>!document.body.classList.contains('dock-collapsed'));assert(await dock.locator('.nav-routes').isVisible());
  }
  await dock.getByRole('button',{name:'Desk',exact:true}).click();await check();assert.equal(await page.evaluate(()=>document.body.classList.contains('dock-collapsed')),false,'Never folded on the Desk');assert.equal(await page.locator('.prefs-key:visible').count(),1,'One Preferences entry per layout');await page.screenshot({path:path.join(__dirname,'nav-dock-home-412.png')});
  // Receipt in the dock lane: covers the register, retracts on tap and ends hidden.
  await say('Copied');await receipt.waitFor();await settled();assert.equal(await receipt.getAttribute('data-lane'),'dock');
  const lane=await page.evaluate(()=>{const r=document.querySelector('#toast').getBoundingClientRect(),g=document.querySelector('.nav-register').getBoundingClientRect();const d=document.querySelector('.mobile-nav').getBoundingClientRect(),slot=document.querySelector('.nav-load').getBoundingClientRect();return {inDock:r.top>=d.top-.5,clearOfSlot:r.right<=slot.left+.5,bottom:Math.abs(r.bottom-g.bottom),register:getComputedStyle(document.querySelector('.nav-register')).visibility};});assert(lane.bottom<2,'Receipt sits on the register');assert(lane.inDock,'The register opens a lane: the slip never hangs over the page');assert(lane.clearOfSlot,'The slot stays uncovered');assert.equal(lane.register,'hidden');
  await receipt.locator('.receipt-text').click();await page.waitForFunction(()=>document.querySelector('#toast').hidden);assert.equal(await receipt.isVisible(),false);assert.equal(await page.locator('.nav-register').evaluate(el=>getComputedStyle(el).visibility),'visible');
  for(const b of await receipt.locator('button').all())if(await b.isVisible())assert((await b.boundingBox()).height>=44);
  await dock.getByRole('button',{name:'Search',exact:true}).click();assert.equal(await dock.locator('.nav-search').getAttribute('aria-expanded'),'true');await page.getByRole('textbox',{name:'Search all files'}).fill('useful');await page.locator('.search-result').first().waitFor();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('.nav-search').getAttribute('aria-expanded')==='false');
  const chooser=page.waitForEvent('filechooser');await dock.getByRole('button',{name:'Open Markdown files',exact:true}).click();await(await chooser).setFiles({name:'Other.md',mimeType:'text/markdown',buffer:Buffer.from('# Another source\n\nOne two three.')});await page.waitForFunction(()=>document.querySelector('#dock-context').textContent==='Another source');assert.equal(await page.evaluate(()=>Nightwire.debug.state().docs.length),2);
  const faces=new Set();
  for(const theme of ['classic','cyberdeck','phosphor','mixtape','orbital','nocturne']){
   await dock.getByRole('button',{name:'Read',exact:true}).click();await page.locator('#terminal-words').waitFor();assert.equal(await dock.locator('.nav-search').isVisible(),false,'Read has its own search');assert.equal(await dock.locator('.nav-load').isVisible(),false,'Read opens files from its chooser');
   await page.locator('#content [data-action=settings]').click();await chooseStyle(page,theme);await page.waitForFunction(theme=>document.body.dataset.terminalPresentation===theme,theme);await page.getByRole('button',{name:'Close panel'}).click();await check();
   // §6.8.6: the dock takes the instrument's materials (key face) but never its light (the pip stays the user's accent).
   const material=await dock.evaluate(nav=>{const key=nav.querySelector('.nav-key:not([aria-current="page"])'),probe=document.createElement('i');probe.style.color=getComputedStyle(nav).getPropertyValue('--key-face');nav.append(probe);const face=getComputedStyle(probe).color;probe.remove();return {face,bg:getComputedStyle(key).backgroundColor,lamp:getComputedStyle(nav).getPropertyValue('--lamp').trim(),accent:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()};});
   assert.equal(material.bg,material.face,theme+' dock keys wear the instrument key face');assert.equal(material.lamp,material.accent,theme+' dock light stays the user accent');faces.add(material.face);
   await dock.screenshot({path:path.join(__dirname,'nav-dock-'+theme+'.png')});await page.screenshot({path:path.join(__dirname,'nav-dock-screen-'+theme+'.png')});
  }
  assert.equal(faces.size,6,'Each Read instrument gives the dock its own key face');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await dock.locator('.nav-key').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');await page.emulateMedia({reducedMotion:'no-preference'});
  // Landscape phone: wide but short is dock mode; a focused text field never flips it.
  await page.setViewportSize({width:915,height:412});await page.waitForFunction(()=>document.documentElement.classList.contains('is-short'));assert(await dock.isVisible());assert.equal(await tray.isVisible(),false);
  await page.setViewportSize({width:1280,height:915});await page.waitForFunction(()=>!document.documentElement.classList.contains('is-short'));assert.equal(await dock.isVisible(),false);assert(await tray.isVisible());
  // The keyboard shrinks the WebView: with a field focused on a foldable-width screen the tray stays; once the field lets go, the layout re-measures.
  await page.setViewportSize({width:830,height:714});await page.evaluate(()=>Nightwire.debug.openSearch());await page.getByRole('textbox',{name:'Search all files'}).focus();await page.setViewportSize({width:830,height:400});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('is-short')),false,'A focused field never flips the layout');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>document.documentElement.classList.contains('is-short'));await page.setViewportSize({width:1280,height:915});await page.waitForFunction(()=>!document.documentElement.classList.contains('is-short'));
  // Tray: Read gets the 76px rail without search or prefs; Desk gets the full tray with the seated route.
  assert.equal(Math.round((await tray.boundingBox()).width),76);assert.equal(await tray.locator('.tray-search').isVisible(),false);assert.equal(await tray.locator('.prefs-key').isVisible(),false);
  await tray.getByRole('button',{name:'Desk',exact:true}).click();await page.waitForFunction(()=>document.body.dataset.view==='home');await page.waitForFunction(()=>Math.round(document.querySelector('.sidebar').getBoundingClientRect().width)===248);
  assert.equal(await tray.locator('nav [aria-current=page]').getAttribute('aria-label'),'Desk');assert.equal(await tray.locator('.tray-card').count(),2);assert.equal(await page.locator('.prefs-key:visible').count(),1,'One Preferences entry per layout');
  await say('Copied');await receipt.waitFor();await settled();assert.equal(await receipt.getAttribute('data-lane'),'tray');const r=await receipt.boundingBox(),t=await tray.boundingBox();assert(r.x>=t.x&&r.x+r.width<=t.x+t.width,'Tray receipt stays inside the tray, never over main');
  await page.waitForFunction(()=>document.querySelector('#toast').hidden,null,{timeout:7000});
  // The user's screenshot size: cards are whole 56px rows; overflow ends in the lip row that leads to the shelf.
  await page.setViewportSize({width:830,height:714});await page.locator('#file-input').setInputFiles(Array.from({length:7},(_,i)=>({name:`Extra-${i}.md`,mimeType:'text/markdown',buffer:Buffer.from(`# Extra ${i}\n\nWords.`)})));await page.waitForFunction(()=>Nightwire.debug.state().docs.length===9);
  await tray.getByRole('button',{name:'Desk',exact:true}).click();await page.waitForFunction(()=>document.body.dataset.view==='home'&&!!document.querySelector('.tray-more'));
  const cards=await page.evaluate(()=>{const l=document.querySelector('.tray-cards'),r=l.getBoundingClientRect();return {h:Math.round(r.height),whole:[...l.children].every(li=>{const b=li.getBoundingClientRect();return b.top>=r.top-.5&&b.bottom<=r.bottom+.5&&Math.round(b.height)===56;}),n:l.children.length,more:document.querySelector('.tray-more button').textContent};});
  assert(cards.h>=112&&cards.h%56===0,JSON.stringify(cards));assert(cards.whole,'No card is cut mid-glyph');assert.equal(cards.more,`+${9-(cards.n-1)} more on the shelf`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('Switchboard: 28 route/width layouts with 44px targets and seated active keys, reader marks no route, register title/section/% odometer, Back to origin, spine fold and tap-to-expand, receipt lanes (dock, tray) with tap retract and hidden end state, working search/import, Read hides search and slot, six themed materials, reduced motion, landscape is-short dock, keyboard-safe re-measure, rail and full tray, whole-row tray cards with overflow lip, zero external requests passed.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
