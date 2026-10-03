if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');const root=path.resolve(__dirname,'../assets');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(8803,'127.0.0.1',r));const browser=await chromium.launch({...launch(),headless:true}),page=await browser.newPage({viewport:{width:412,height:915},hasTouch:true}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8803/'))external.push(r.url());});
 const prefs=()=>page.locator('#content [data-action=settings]').click(),close=()=>page.getByRole('button',{name:'Close panel'}).click();let scenes=0;
 try{
  await page.addInitScript(()=>{if(!localStorage.getItem('settings'))localStorage.setItem('settings',JSON.stringify({motion:false,font:'opendyslexic',terminalWpm:450}));});await page.goto('http://127.0.0.1:8803/');await page.waitForFunction(()=>!!window.Nightwire);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('settings')).terminalAlignment),'fixed');
  await page.locator('#file-input').setInputFiles({name:'Alignment.md',mimeType:'text/markdown',buffer:Buffer.from('# Reading\n\ni coordination tiny electroencephalographically clear W end\n\n'+('Keep a steady reading rhythm. '.repeat(70)))});await page.locator('#markdown h1').waitFor();const revision=(await page.evaluate(()=>Nightwire.classifierInput())).contentRevision;
  await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();await page.evaluate(()=>document.fonts.ready);
  for(const style of ['classic','cyberdeck','phosphor','mixtape','orbital','nocturne']){
   await page.setViewportSize({width:412,height:915});await prefs();const previous=await page.evaluate(()=>JSON.parse(localStorage.getItem('settings')).terminalAlignment);await page.getByRole('combobox',{name:'Read tab style'}).selectOption(style);assert.equal(await page.locator('#content').getAttribute('data-terminal-alignment'),previous);await close();
   for(const alignment of ['fixed','center']){
    await prefs();const position=await page.locator('#terminal-seek').inputValue();await page.locator('[data-word-alignment="'+alignment+'"]').click();assert.equal(await page.locator('[data-word-alignment][aria-pressed=true]').count(),1);assert.equal(await page.locator('#content').getAttribute('data-terminal-alignment'),alignment);assert.equal(await page.locator('#terminal-seek').inputValue(),position);assert.equal(await page.locator('#terminal-wpm').textContent(),'450');
    await page.setViewportSize({width:320,height:568});assert(await page.locator('.word-alignment-setting').evaluate(el=>el.scrollWidth<=el.clientWidth),'Toggle fits narrow settings');if(style==='cyberdeck')await page.locator('.word-alignment-setting').screenshot({path:path.join(__dirname,'alignment-toggle-'+alignment+'.png')});await close();
    for(const [width,height]of [[320,568],[412,915],[780,360],[1280,915]]){
     await page.setViewportSize({width,height});await page.waitForTimeout(25);
     for(const blackout of [false,true]){
      if(blackout)await page.locator('#terminal-blackout').click();
      const cases=await page.evaluate(()=>{
       const result=[];for(const group of [1,2])for(const bionic of [true,false]){
        document.querySelector('[data-group="'+group+'"]').click();const toggle=document.querySelector('#terminal-bionic');if(toggle.getAttribute('aria-pressed')!==String(bionic))toggle.click();
        const frames=[];for(const index of [1,2,3,4]){
         const seek=document.querySelector('#terminal-seek');seek.value=index;seek.dispatchEvent(new Event('input',{bubbles:true}));const stage=document.querySelector('.terminal-stage').getBoundingClientRect(),line=document.querySelector('#terminal-words').getBoundingClientRect();
         const words=[...document.querySelectorAll('.terminal-word')].map(word=>{const marker=document.createElement('span');Object.assign(marker.style,{display:'inline-block',width:'0px',height:'0px'});word.append(marker);const box=word.getBoundingClientRect(),baseline=marker.getBoundingClientRect().top;marker.remove();return {x:box.left,right:box.right,top:box.top,bottom:box.bottom,baseline};});
         frames.push({words,line:{x:line.left,right:line.right,top:line.top,bottom:line.bottom},stage:{x:stage.left,right:stage.right,top:stage.top,bottom:stage.bottom}});
        }result.push({group,bionic,frames});
       }return result;
      });
      for(const {group,bionic,frames}of cases){
       for(const frame of frames){const context=JSON.stringify({style,alignment,width,height,blackout,group,bionic,frame});
        if(alignment==='center'){assert(Math.abs((frame.line.x+frame.line.right-frame.stage.x-frame.stage.right)/2)<.6,'Frame is centred: '+context);assert(Math.abs((frame.line.top+frame.line.bottom-frame.stage.top-frame.stage.bottom)/2)<.6,'Frame vertically centred: '+context);}
        else for(let i=0;i<frame.words.length;i++){assert(Math.abs(frame.words[i].x-frames[0].words[i].x)<.6,'Fixed start: '+context);assert(Math.abs(frame.words[i].baseline-frames[0].words[i].baseline)<.6,'Fixed baseline: '+context);}
        for(const word of frame.words)assert(word.x>=frame.stage.x-1&&word.right<=frame.stage.right+1&&word.top>=frame.stage.top-1&&word.bottom<=frame.stage.bottom+1,'Fitted words remain inside stage: '+context);
       }
       if(alignment==='center'&&group===1)assert(Math.abs(frames[0].words[0].x-frames[1].words[0].x)>1,'Centred mode recentres varying word lengths');scenes++;
      }
      if(blackout){
       const png=await page.screenshot();const outside=await page.evaluate(async bytes=>{const bitmap=await createImageBitmap(new Blob([Uint8Array.from(bytes)],{type:'image/png'})),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();const data=ctx.getImageData(0,0,canvas.width,canvas.height).data,box=document.querySelector('#terminal-words').getBoundingClientRect();let outside=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const n=(y*canvas.width+x)*4;if((data[n]||data[n+1]||data[n+2])&&(x<box.left-3||x>box.right+3||y<box.top-3||y>box.bottom+3))outside++;}return outside;},[...png]);assert.equal(outside,0,'Both alignments keep blackout words-only');await page.keyboard.press('Escape');
      }
     }
    }
   }
  }
  await page.setViewportSize({width:412,height:915});const saved=await page.locator('#terminal-seek').inputValue();await page.reload();await page.waitForFunction(()=>!!window.Nightwire&&!!document.querySelector('.resume-sheet'));await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();assert.equal(await page.locator('#content').getAttribute('data-terminal-alignment'),'center');assert.equal(await page.locator('#terminal-seek').inputValue(),saved);assert.equal(await page.locator('#terminal-wpm').textContent(),'450');
  await prefs();assert.equal(await page.locator('[data-word-alignment=center]').getAttribute('aria-pressed'),'true');await close();await page.locator('#terminal-document').click();await page.locator('#markdown h1').waitFor();await page.locator('.top-actions [data-action=settings]').click();await page.locator('[data-word-alignment=fixed]').click();await close();await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();assert.equal(await page.locator('#content').getAttribute('data-terminal-alignment'),'fixed');
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('settings'));s.terminalAlignment='invalid';localStorage.setItem('settings',JSON.stringify(s));});await page.reload();await page.waitForFunction(()=>!!window.Nightwire);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('settings')).terminalAlignment),'fixed');await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();assert.equal(await page.locator('#content').getAttribute('data-terminal-alignment'),'fixed');assert.equal((await page.evaluate(()=>Nightwire.classifierInput())).contentRevision,revision);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('Alignment toggle:',scenes,'cases, fixed origins/baselines and previous centred frames, 48 pure-black screenshots, all themes, narrow settings, word fitting, WPM/position, theme/route/reload persistence and invalid-value recovery passed.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
