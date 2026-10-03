if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');
const root=path.resolve(__dirname,'../assets');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(8794,'127.0.0.1',r));const browser=await chromium.launch({...launch(),headless:true});const page=await browser.newPage({viewport:{width:412,height:915},hasTouch:true});const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8794/'))external.push(r.url());});
 const tab=()=>page.locator('.mobile-nav [data-action=terminal]'),range=async(id,value)=>page.locator(id).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},String(value));
 const settings=()=>page.locator('#content [data-action=settings]').click();const close=()=>page.getByRole('button',{name:'Close panel'}).click();
 const style=async value=>{await page.getByRole('combobox',{name:'Read tab style'}).selectOption(value);await page.waitForFunction(value=>document.body.dataset.terminalPresentation===value,value);};
 try{
  await page.goto('http://127.0.0.1:8794/');await page.waitForFunction(()=>!!window.Nightwire);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('settings')).terminalStyle),'cyberdeck');
  const prose='The city hums beyond the window. Between the neon and the rain, a small idea finds its signal. Keep your attention here.'.split(' ');
  await page.locator('#file-input').setInputFiles({name:'Night-city-field-notes-and-a-long-cartridge-title.md',mimeType:'text/markdown',buffer:Buffer.from('# Signal notes\n\n## After midnight\n\n'+Array.from({length:240},(_,i)=>prose[i%prose.length]).join(' ')+'\n\n## Dawn\n\nThe signal stays.')});await page.locator('#markdown h1').waitFor();const input=await page.evaluate(()=>Nightwire.classifierInput());await tab().click();await page.locator('.deck-hardware').waitFor();
  assert.equal(await page.locator('.topbar').isVisible(),false);await range('#terminal-seek',16);await range('#terminal-speed-input',450);await page.locator('[data-group="2"]').click();await page.locator('#terminal-bionic').click();
  await page.locator('#terminal-play').click();await page.waitForFunction(()=>Number(document.querySelector('#terminal-seek').value)>16);await settings();assert.equal(await page.locator('#terminal-status').textContent(),'PAUSED');const position=await page.locator('#terminal-seek').inputValue();
  await style('classic');assert.equal(await page.locator('#terminal-seek').inputValue(),position);assert.equal(await page.locator('#terminal-wpm').textContent(),'450');assert.equal(await page.locator('[data-group="2"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#terminal-bionic').getAttribute('aria-pressed'),'false');await close();assert.equal(await page.locator('.topbar').isVisible(),false);assert.equal(await page.locator('.terminal-header-tools').isVisible(),true);assert.equal(await page.locator('.deck-hardware').count(),0);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(__dirname,'read-classic-preserved.png'),fullPage:true});
  await page.reload();await page.waitForFunction(()=>!!window.Nightwire&&!!document.querySelector('.resume-sheet'));await tab().click();await page.locator('#terminal-words').waitFor();assert.equal(await page.evaluate(()=>document.body.dataset.terminalPresentation),'classic');assert.equal(await page.locator('#terminal-seek').inputValue(),position);
  await settings();await style('cyberdeck');await close();await page.waitForTimeout(400);assert.equal(await page.locator('#terminal-status').textContent(),'PAUSED');assert.equal(await page.locator('#terminal-seek').inputValue(),position);await page.locator('#terminal-bionic').click();await range('#terminal-speed-input',300);await range('#terminal-seek',16);
  const ruler=await page.locator('#terminal-speed-input').boundingBox();await page.touchscreen.tap(ruler.x+ruler.width*.65,ruler.y+ruler.height/2);assert(Number(await page.locator('#terminal-wpm').textContent())>500);await range('#terminal-speed-input',300);
  for(const width of [320,360,412,768,1280]){await page.setViewportSize({width,height:915});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(400);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No chassis overflow at '+width);assert(await page.locator('#terminal-words').evaluate(el=>el.scrollWidth<=el.parentElement.clientWidth));if(width===412)assert(await page.locator('.deck-hardware').evaluate(el=>el.getBoundingClientRect().bottom<document.querySelector('.mobile-nav').getBoundingClientRect().top),'Full handheld fits above navigation');await page.screenshot({path:path.join(__dirname,`cyberdeck-${width}.png`),fullPage:true});}
  await page.setViewportSize({width:412,height:915});await page.locator('#terminal-play').click();await page.locator('#terminal-file').click();assert.equal(await page.locator('#terminal-status').textContent(),'PAUSED');await page.screenshot({path:path.join(__dirname,'cyberdeck-cartridge-picker.png')});await page.getByRole('button',{name:/Read Night-city-field-notes/}).click();await page.locator('.deck-hardware').waitFor();assert.equal(await page.locator('#terminal-status').textContent(),'PAUSED');
  await page.emulateMedia({reducedMotion:'reduce'});await range('#terminal-speed-input',1000);assert.equal(await page.locator('#terminal-wpm').evaluate(el=>getComputedStyle(el).transform),'none');assert.equal(await page.locator('.deck-hardware').evaluate(el=>el.style.opacity),'');assert.equal(await page.locator('#terminal-speed-input').inputValue(),'1000');
  await page.locator('#terminal-play').click();await page.evaluate(()=>Nightwire.pauseReading());const paused=await page.locator('#terminal-seek').inputValue();await page.waitForTimeout(180);assert.equal(await page.locator('#terminal-seek').inputValue(),paused);
  const controls=['.type-trigger','#terminal-blackout','#terminal-document','#terminal-file','#terminal-play','#terminal-prev','#terminal-next','#terminal-restart','#terminal-seek','#terminal-speed-input','#terminal-slower','#terminal-faster','#terminal-bionic','[data-group="1"]','[data-group="2"]',...[150,300,450,600].map(v=>'[data-speed="'+v+'"]')];
  for(const presentation of ['classic','cyberdeck','phosphor','mixtape','orbital','nocturne']){
   await page.setViewportSize({width:412,height:915});
   const savedIndex=await page.locator('#terminal-seek').inputValue(),savedFont=await page.locator('#terminal-words').evaluate(el=>getComputedStyle(el).fontFamily),savedAccent=await page.evaluate(()=>JSON.parse(localStorage.getItem('settings')).accent);
   await settings();
   if(presentation==='phosphor'){
    await page.setViewportSize({width:320,height:568});assert(await page.locator('#panel-content').evaluate(el=>el.scrollWidth<=el.clientWidth),'Style previews fit narrow preferences');
    await page.setViewportSize({width:412,height:915});await page.locator('.read-style-gallery').screenshot({path:path.join(__dirname,'read-style-gallery.png')});
   }
   await page.locator('[data-read-style="'+presentation+'"]').click();
   await page.waitForFunction(value=>document.body.dataset.terminalPresentation===value,presentation);
   assert.equal(await page.getByRole('combobox',{name:'Read tab style'}).inputValue(),presentation);
   assert.equal(await page.locator('[data-read-style="'+presentation+'"]').getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('[data-read-style][aria-pressed=true]').count(),1);await close();
   assert.equal(await page.locator('#terminal-seek').inputValue(),savedIndex);
   assert.equal(await page.locator('#terminal-wpm').textContent(),'1000');
   assert.equal(await page.locator('[data-group="2"]').getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#terminal-bionic').getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#terminal-status').textContent(),'PAUSED');
   assert.equal(await page.locator('#terminal-words').evaluate(el=>getComputedStyle(el).fontFamily),savedFont);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('settings')).accent),savedAccent);
   if(!['classic','cyberdeck'].includes(presentation))assert(await page.evaluate(()=>getComputedStyle(document.querySelector('.mobile-nav')).getPropertyValue('--accent').trim()===getComputedStyle(document.querySelector('.vibe-root')).getPropertyValue('--accent').trim()),'Instrument navigation uses its chrome palette');
   await page.locator('#terminal-next').click();assert(Number(await page.locator('#terminal-seek').inputValue())>Number(savedIndex));
   await page.locator('#terminal-prev').click();assert.equal(await page.locator('#terminal-seek').inputValue(),savedIndex);
   await page.locator('#terminal-play').click();await page.waitForFunction(value=>Number(document.querySelector('#terminal-seek').value)>Number(value),savedIndex);await page.evaluate(()=>Nightwire.pauseReading());
   const playedIndex=await page.locator('#terminal-seek').inputValue();
   await page.reload();await page.waitForFunction(()=>!!window.Nightwire&&!!document.querySelector('.resume-sheet'));await tab().click();await page.locator('#terminal-words').waitFor();
   assert.equal(await page.evaluate(()=>document.body.dataset.terminalPresentation),presentation);assert.equal(await page.locator('#terminal-seek').inputValue(),playedIndex);
   await range('#terminal-seek',16);

   for(const [width,height]of [[348,790],[320,568],[360,640],[393,760],[412,820],[412,915],[768,915],[1280,720],[1280,915],[780,360],[915,412]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);
    const geometry=await page.evaluate(controls=>{
     const nav=document.querySelector('.mobile-nav'),bottom=getComputedStyle(nav).display==='none'?innerHeight:nav.getBoundingClientRect().top;
     const panel=document.querySelector('.terminal-deck').getBoundingClientRect();
     return {scrollHeight:document.documentElement.scrollHeight,height:innerHeight,width:document.documentElement.scrollWidth,viewportWidth:innerWidth,panelBottom:panel.bottom,bottom,font:parseFloat(getComputedStyle(document.querySelector('#terminal-words')).fontSize),controls:controls.map(selector=>{const el=document.querySelector(selector),r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {selector,top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height,hit:hit===el||el.contains(hit)};})};
    },controls);
    assert(geometry.scrollHeight<=geometry.height+1,JSON.stringify({presentation,width,height,geometry}));assert(geometry.width<=geometry.viewportWidth);assert(geometry.panelBottom<=geometry.bottom+1,'Panel fits '+presentation+' '+width+'×'+height);assert(geometry.font>=24,'Words remain legible '+presentation+' '+width+'×'+height+' '+geometry.font);
    for(const c of geometry.controls)assert(c.top>=0&&c.bottom<=geometry.bottom+1&&c.left>=0&&c.right<=width&&c.width>0&&c.height>=20&&c.hit,JSON.stringify({presentation,width,height,control:c}));
    await page.screenshot({path:path.join(__dirname,`read-screen-${presentation}-${width}x${height}.png`)});
   }
  }
  await page.setViewportSize({width:412,height:820});
  await page.locator('#terminal-document').click();await page.locator('#markdown h1').waitFor();assert.equal(await page.locator('.topbar').isVisible(),true);assert.equal(await page.evaluate(()=>document.body.dataset.terminalPresentation),undefined);assert.equal((await page.evaluate(()=>Nightwire.classifierInput())).contentRevision,input.contentRevision);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('Cyberdeck: default/migration, Classic styling, live style switching, position/WPM/group/emphasis persistence for all six styles, preview selection, hardware controls, 66 single-screen layouts, control hit testing, readable words, reduced motion, pause lifecycle and zero external requests passed');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
