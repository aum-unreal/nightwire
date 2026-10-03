if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');
const root=path.resolve(__dirname,'../assets');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(8798,'127.0.0.1',r));const browser=await chromium.launch({...launch(),headless:true}),page=await browser.newPage({viewport:{width:412,height:915},hasTouch:true});const errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8798/'))external.push(r.url());});
 const dock=page.getByRole('navigation',{name:'Main navigation'});
 const check=async()=>{
  await page.waitForFunction(()=>{const active=document.querySelector('.nav-key.active'),other=document.querySelector('.nav-key:not(.active)');return active&&other&&Number(getComputedStyle(active).flexGrow)>1.6&&active.getBoundingClientRect().width>other.getBoundingClientRect().width+3;});
  const geometry=await dock.evaluate(nav=>[...nav.querySelectorAll('button')].map(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {name:el.getAttribute('aria-label'),width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,hit:hit===el||el.contains(hit)};}));
  const viewport=page.viewportSize();for(const g of geometry)assert(g.width>=44&&g.height>=44&&g.left>=0&&g.right<=viewport.width&&g.top>=0&&g.bottom<=viewport.height&&g.hit,JSON.stringify(g));
  assert.equal(await dock.locator('[aria-current=page]').count(),1);assert.equal(await dock.locator('.active').count(),1);
  const active=await dock.locator('.nav-key.active').boundingBox(),other=await dock.locator('.nav-key:not(.active)').first().boundingBox();if(active.width<=other.width)await page.screenshot({path:path.join(__dirname,'nav-dock-debug.png')});assert(active.width>other.width,JSON.stringify({viewport,active,other,route:await dock.locator('[aria-current=page]').getAttribute('aria-label'),css:await dock.locator('.nav-key').evaluateAll(els=>els.map(el=>({class:el.className,flex:getComputedStyle(el).flex,width:getComputedStyle(el).width,transition:getComputedStyle(el).transitionDuration})))}));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page overflow');
 };
 try{
  await page.goto('http://127.0.0.1:8798/');await page.waitForFunction(()=>!!window.Nightwire);assert.equal(await page.locator('#dock-context').textContent(),'No file open');
  const name='Field-notes-with-a-long-source-cartridge-name.md';
  await page.locator('#file-input').setInputFiles({name,mimeType:'text/markdown',buffer:Buffer.from('# Filed notes\n\n## Keep looking\n\n'+('Follow the small useful things. '.repeat(90)))});await page.locator('#markdown h1').waitFor();
  assert.equal(await dock.locator('[aria-current=page]').getAttribute('aria-label'),'Files','Page belongs to Files');assert.equal(await page.locator('#dock-context').textContent(),name);assert.equal(await page.locator('#dock-count').getAttribute('aria-label'),'1 file');
  for(const width of [320,348,360,412,600,768,800]){
   await page.setViewportSize({width,height:915});
   for(const [label,view]of [['Home','home'],['Files','library'],['Graph','graph'],['Read','terminal']]){
    await dock.getByRole('button',{name:label,exact:true}).click();await page.waitForFunction(view=>document.body.dataset.view===view,view);if(view==='terminal')await page.locator('#terminal-words').waitFor();
    await check();assert.equal(await dock.locator('[aria-current=page]').getAttribute('aria-label'),label);
   }
  }
  await page.setViewportSize({width:412,height:915});await dock.getByRole('button',{name:'Home',exact:true}).click();await check();await page.screenshot({path:path.join(__dirname,'nav-dock-home-412.png')});
  await dock.getByRole('button',{name:'Search',exact:true}).click();assert.equal(await dock.locator('.nav-search').getAttribute('aria-expanded'),'true');await page.getByRole('textbox',{name:'Search all files'}).fill('useful');await page.locator('.search-result').first().waitFor();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('.nav-search').getAttribute('aria-expanded')==='false');
  const chooser=page.waitForEvent('filechooser');await dock.getByRole('button',{name:'Open Markdown files',exact:true}).click();await(await chooser).setFiles({name:'Other.md',mimeType:'text/markdown',buffer:Buffer.from('# Another source\n\nOne two three.')});await page.waitForFunction(()=>document.querySelector('#dock-count').getAttribute('aria-label')==='2 files');assert.equal(await page.locator('#dock-context').textContent(),'Other.md');
  for(const theme of ['classic','cyberdeck','phosphor','mixtape','orbital','nocturne']){
   await dock.getByRole('button',{name:'Read',exact:true}).click();await page.locator('#terminal-words').waitFor();await page.locator('#content [data-action=settings]').click();await page.getByRole('combobox',{name:'Read tab style'}).selectOption(theme);await page.waitForFunction(theme=>document.body.dataset.terminalPresentation===theme,theme);await page.getByRole('button',{name:'Close panel'}).click();await check();
   assert(await dock.evaluate(nav=>getComputedStyle(nav).getPropertyValue('--accent').trim()===getComputedStyle(document.querySelector('.terminal-main')).getPropertyValue('--accent').trim()),'Theme palette reaches switchboard');
   await dock.screenshot({path:path.join(__dirname,'nav-dock-'+theme+'.png')});await page.screenshot({path:path.join(__dirname,'nav-dock-screen-'+theme+'.png')});
  }
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await dock.locator('.nav-key').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  await page.setViewportSize({width:1280,height:915});assert.equal(await dock.isVisible(),false);assert.equal(await page.locator('.sidebar').isVisible(),true);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('Switchboard: 28 route/width layouts with 44px targets and expanded active keys, page/current-file/count semantics, working search/import, six themed materials, reduced motion, desktop fallback and zero external requests passed.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
