if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');const root=path.resolve(__dirname,'../assets');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(8802,'127.0.0.1',r));const browser=await chromium.launch({...launch(),headless:true}),page=await browser.newPage({viewport:{width:412,height:915},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript(()=>localStorage.setItem('settings',JSON.stringify({motion:false,font:'opendyslexic'})));await page.goto('http://127.0.0.1:8802/');await page.waitForFunction(()=>!!window.Nightwire);
  await page.locator('#file-input').setInputFiles({name:'Fixed origins.md',mimeType:'text/markdown',buffer:Buffer.from('# Stable\n\ni a reading coordination extraordinarily tiny electroencephalographically clear W 中文 👀 end\n\n'+('Keep each starting point steady. '.repeat(40)))});await page.locator('#markdown h1').waitFor();await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();
  const close=()=>page.getByRole('button',{name:'Close panel'}).click();let cases=0;
  for(const style of ['classic','cyberdeck','phosphor','mixtape','orbital','nocturne']){
   await page.setViewportSize({width:412,height:915});await page.locator('#content [data-action=settings]').click();await page.getByRole('combobox',{name:'Read tab style'}).selectOption(style);await close();
   for(const font of ['opendyslexic','literata']){
    await page.locator('#content [data-action=settings]').click();await page.getByRole('combobox',{name:'Reading typeface'}).selectOption(font);await page.evaluate(()=>document.fonts.ready);await close();
    for(const [width,height]of [[320,568],[412,915],[780,360],[1280,915]]){
     await page.setViewportSize({width,height});await page.waitForTimeout(25);
     for(const group of [1,2]){
      await page.locator('[data-group="'+group+'"]').click();
      for(const bionic of [true,false]){
       if((await page.locator('#terminal-bionic').getAttribute('aria-pressed'))!==String(bionic))await page.locator('#terminal-bionic').click();
       for(const blackout of [false,true]){
        if(blackout)await page.locator('#terminal-blackout').click();
        const frames=await page.evaluate(()=>{
         const results=[];for(const index of [1,2,3,4,5,6,7,8,9,10,11,12]){
          const seek=document.querySelector('#terminal-seek');seek.value=index;seek.dispatchEvent(new Event('input',{bubbles:true}));
          const stage=document.querySelector('.terminal-stage').getBoundingClientRect();
          const items=[...document.querySelectorAll('.terminal-word')].map(word=>{
           const marker=document.createElement('span');marker.setAttribute('aria-hidden','true');Object.assign(marker.style,{display:'inline-block',width:'0px',height:'0px'});word.append(marker);
           const box=word.getBoundingClientRect(),baseline=marker.getBoundingClientRect().top,slot=word.parentElement.getBoundingClientRect();marker.remove();
           return {x:box.left,baseline,width:box.width,slotWidth:slot.width,top:box.top,bottom:box.bottom,stage:{left:stage.left,right:stage.right,top:stage.top,bottom:stage.bottom}};
          });results.push(items);
         }return results;
        });
        const origins=frames[0];for(const items of frames)for(let i=0;i<items.length;i++){
         const item=items[i],origin=origins[i],context=JSON.stringify({style,font,width,height,group,bionic,blackout,item,origin});
         assert(Math.abs(item.x-origin.x)<.6,'Stable word start: '+context);assert(Math.abs(item.baseline-origin.baseline)<.6,'Stable baseline: '+context);
         assert(item.width<=item.slotWidth+1,'Long word fits its fixed slot: '+context);assert(item.top>=item.stage.top-1&&item.bottom<=item.stage.bottom+1,'Word stays inside stage: '+context);
        }
        cases++;if(blackout)await page.keyboard.press('Escape');
       }
      }
     }
    }
   }
  }
  await page.setViewportSize({width:412,height:915});await page.screenshot({path:path.join(__dirname,'fixed-word-origin.png')});
  assert.deepEqual(errors,[]);console.log('Fixed word origins:',cases,'theme/font/viewport/group/emphasis/blackout cases; varying lengths, long-word fitting, fallback glyphs, fixed baselines and unclipped slots passed.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
