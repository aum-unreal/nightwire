if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');
const root=path.resolve(__dirname,'../assets');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(8795,'127.0.0.1',r));const browser=await chromium.launch({...launch(),headless:true});const page=await browser.newPage({viewport:{width:412,height:915},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Keep IndexedDB preview imports while observing the native fullscreen bridge.
 await page.addInitScript(()=>{window.blackoutCalls=[];});
 const range=async(id,value)=>page.locator(id).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},String(value));
 const enter=async()=>{await page.locator('#terminal-blackout').click();await page.getByRole('button',{name:'Exit blackout reading'}).waitFor();};
 const exited=async()=>{assert.equal(await page.locator('.terminal-blackout-surface').count(),0);assert.equal(await page.evaluate(()=>document.body.classList.contains('reading-blackout')),false);assert.equal(await page.locator('.terminal-deck').evaluate(el=>el.inert),false);assert(await page.locator('#terminal-play').isVisible());assert.equal(await page.locator('#terminal-status').textContent(),'PAUSED');};
 async function onlyWords(){
  assert.equal(await page.locator('.terminal-deck').isVisible(),false);assert.equal(await page.locator('.mobile-nav').isVisible(),false);assert.equal(await page.locator('.sidebar').isVisible(),false);
  assert.equal(await page.locator('#terminal-words').count(),1);
  const png=await page.screenshot();
  const pixels=await page.evaluate(async bytes=>{
   const bitmap=await createImageBitmap(new Blob([Uint8Array.from(bytes)],{type:'image/png'})),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();const data=ctx.getImageData(0,0,canvas.width,canvas.height).data,rect=document.querySelector('#terminal-words').getBoundingClientRect();let outside=0,text=0;
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const n=(y*canvas.width+x)*4;if(data[n]||data[n+1]||data[n+2]){text++;if(x<rect.left-3||x>rect.right+3||y<rect.top-3||y>rect.bottom+3)outside++;}}
   return {outside,text,centred:Math.abs((rect.left+rect.right)/2-innerWidth/2)<2&&Math.abs((rect.top+rect.bottom)/2-innerHeight/2)<2,scroll:document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth};
  },[...png]);assert.equal(pixels.outside,0,'Every pixel outside the words is pure black');assert(pixels.text>40);assert(pixels.centred,'The fixed reading line sits in the middle of the screen');assert(pixels.scroll,'No blackout overflow');return png;
 }
 try{
  await page.goto('http://127.0.0.1:8795/');await page.waitForFunction(()=>!!window.Nightwire);
  await page.evaluate(()=>{window.Native={readingBlackout:value=>window.blackoutCalls.push(value)};});
  await page.locator('#file-input').setInputFiles({name:'Blackout.md',mimeType:'text/markdown',buffer:Buffer.from('# Quiet words\n\n'+('Keep your attention on these words. '.repeat(200)))});await page.locator('#markdown h1').waitFor();const input=await page.evaluate(()=>Nightwire.classifierInput());await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();await range('#terminal-speed-input',300);await page.locator('[data-group="2"]').click();
  for(const style of ['classic','cyberdeck','phosphor','mixtape','orbital','nocturne']){
   await page.setViewportSize({width:412,height:915});await page.locator('#content [data-action=settings]').click();await page.getByRole('combobox',{name:'Read tab style'}).selectOption(style);await page.waitForFunction(style=>document.body.dataset.terminalPresentation===style,style);await page.getByRole('button',{name:'Close panel'}).click();await range('#terminal-seek',20);
   for(const bionic of [true,false]){
    if((await page.locator('#terminal-bionic').getAttribute('aria-pressed'))!==String(bionic))await page.locator('#terminal-bionic').click();
    for(const [width,height]of [[320,568],[412,915],[780,360],[1280,915]]){
     await page.setViewportSize({width,height});await enter();assert.equal(await page.locator('#terminal-words b').count(),bionic?2:0);const png=await onlyWords();if(width===412)fs.writeFileSync(path.join(__dirname,`blackout-${style}-${bionic?'bionic':'plain'}.png`),png);
     assert.equal(await page.locator('#terminal-wpm').textContent(),'300');assert.equal(await page.locator('#terminal-seek').inputValue(),'20');
     await page.touchscreen.tap(10,10);await exited();assert.equal(await page.locator('#terminal-seek').inputValue(),'20');
    }
   }
   await page.setViewportSize({width:412,height:915});await page.locator('#terminal-play').click();await enter();await page.waitForFunction(()=>Number(document.querySelector('#terminal-seek').value)>20);await page.keyboard.press('Escape');await exited();const paused=await page.locator('#terminal-seek').inputValue();await page.waitForTimeout(100);assert.equal(await page.locator('#terminal-seek').inputValue(),paused);
   await enter();assert.equal(await page.evaluate(()=>Nightwire.back()),true);await exited();assert.equal(await page.evaluate(()=>document.body.dataset.view),'terminal');
   await page.locator('#content [data-action=settings]').click();await page.locator('[data-action=terminal-blackout]').click();await onlyWords();await page.keyboard.press('Enter');await exited();
   await enter();await page.keyboard.press('Space');await page.waitForFunction(value=>Number(document.querySelector('#terminal-seek').value)>Number(value),paused);await page.evaluate(()=>Nightwire.pauseReading());await exited();
   await enter();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;});await exited();
   await enter();await page.evaluate(()=>document.querySelector('.mobile-nav [data-action=home]').click());await page.locator('.resume-sheet').waitFor();assert.equal(await page.locator('.terminal-blackout-surface').count(),0);assert.equal(await page.evaluate(()=>document.body.classList.contains('reading-blackout')),false);await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();
  }
  assert.equal((await page.evaluate(()=>Nightwire.classifierInput())).contentRevision,input.contentRevision);
  const calls=await page.evaluate(()=>window.blackoutCalls);assert(calls.length>90);for(let i=0;i<calls.length;i++)assert.equal(calls[i],i%2===0,'Native fullscreen calls pair on every entry/exit');
  await enter();await page.reload();await page.waitForFunction(()=>!!window.Nightwire&&!!document.querySelector('.resume-sheet'));assert.equal(await page.evaluate(()=>document.body.classList.contains('reading-blackout')),false);await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();assert.equal(await page.locator('.terminal-blackout-surface').count(),0);
  await page.locator('#file-input').setInputFiles({name:'Code-only.md',mimeType:'text/markdown',buffer:Buffer.from('```js\nconst n=1;\n```')});await page.locator('#markdown pre').waitFor();await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('.terminal-no-prose').waitFor();assert(await page.locator('#terminal-blackout').isDisabled());
  assert.deepEqual(errors,[]);console.log('Blackout: 48 pixel-verified pure-black scenes, all six themes with bionic/plain words, real playback, tap/Enter/Escape/Back exits, native fullscreen pairing, pause/background/route cleanup, reload recovery, unchanged classifier input and code-only guard passed');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
