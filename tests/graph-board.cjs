// Map (§6.7): the plate at eleven sizes, the file tab and its chooser, the scope slide, layer toggles with real tallies, zoom/fit,
// the paper tag (phone full width, wide ≤360px), heading taps, the outline tree, the empty plate and zero external requests.
if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');
const root=path.resolve(__dirname,'../assets');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);});});
// First canvas pixel of an exact colour, in CSS pixels (nodes keep solid fills for this).
const pixel=(page,[r,g,b])=>page.locator('#graph-canvas canvas').first().evaluate((canvas,[r,g,b])=>{const p=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(p.data[i]===r&&p.data[i+1]===g&&p.data[i+2]===b)return {x:x/(canvas.width/canvas.clientWidth),y:y/(canvas.height/canvas.clientHeight)};}return null;},[r,g,b]);
// The layout settles, then fits with a short animation: sample until two reads 400ms apart agree.
const settled=async(page,rgb)=>{let a=await pixel(page,rgb);for(let i=0;i<12;i++){await page.waitForTimeout(400);const b=await pixel(page,rgb);if(a&&b&&Math.abs(a.x-b.x)<.5&&Math.abs(a.y-b.y)<.5)return b;a=b;}return a;};
const mapThisFile=async page=>{await page.getByRole('button',{name:'More document tools'}).click();await page.getByRole('button',{name:'Map this file'}).click();await page.locator('#graph-canvas canvas').waitFor();await page.waitForTimeout(1400);};
(async()=>{
 await new Promise(r=>server.listen(8799,'127.0.0.1',r));const browser=await chromium.launch({...launch(),headless:true}),page=await browser.newPage({viewport:{width:412,height:915},hasTouch:true});const errors=[],external=[],failures=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8799/'))external.push(r.url());});
 try{
 await page.goto('http://127.0.0.1:8799/');await page.waitForFunction(()=>!!window.Nightwire);await page.getByRole('button',{name:'Map',exact:true}).click();await page.getByText('Make a connection.',{exact:true}).waitFor();
 // Empty plate: no fake status, every control disabled, nothing selected.
 assert.equal(await page.locator('#graph-count').textContent(),'');assert(await page.getByRole('button',{name:'Zoom graph in'}).isDisabled());assert(await page.locator('#graph-selected').isHidden());
 await page.screenshot({path:path.join(__dirname,'map-empty-412.png')});
 await page.locator('#file-input').setInputFiles({name:'The-field-notes-source-cartridge-with-a-very-long-filename.md',mimeType:'text/markdown',buffer:Buffer.from('# Field notes\n\n#reading #tools\n\n## First section\n\nSmall observations and [an external reference](https://example.com).\n\n## Second section\n\n### A detail\n\nUseful lines.')});await page.locator('#markdown h1').waitFor();
 await mapThisFile(page);
 // §6.7 deletions and the new copy.
 const board=await page.evaluate(()=>({legend:!!document.querySelector('.graph-legend'),select:!!document.querySelector('.graph-main select'),text:document.querySelector('.graph-main').innerText,count:document.querySelector('#graph-count').textContent,stencil:document.querySelector('h1.plate-stencil')?.textContent,file:document.querySelector('.map-file')?.textContent.trim(),stubs:[...document.querySelectorAll('.graph-toggle')].map(b=>b.style.getPropertyValue('--layer-color')),tree:document.querySelectorAll('ul.map-outline[role=tree] [role=treeitem]').length}));
 assert(!board.legend,'no legend');assert(!board.select,'no native select');assert(!/STRUCTURE PLATE|SOURCE CARTRIDGE|PAN \/ PINCH|Trace\.|Add files|⌁/i.test(board.text),'no trace-era copy');
 assert.match(board.count,/^\d+ nodes? · \d+ links?$/);assert.equal(board.stencil,'Map');assert.equal(board.file,'Field notes');assert(board.stubs.every(Boolean),'layer colours on the cable stubs');assert(board.tree>=4,'outline tree lists file, sections and tags');
 for(const [width,height]of [[320,568],[348,790],[360,640],[393,760],[412,820],[412,915],[768,915],[1280,720],[1280,915],[780,360],[915,412]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(180);const g=await page.evaluate(()=>{const root=document.querySelector('.graph-main'),frame=document.querySelector('.graph-frame'),nav=document.querySelector('.mobile-nav'),rect=frame.getBoundingClientRect();return {scrollX:document.documentElement.scrollWidth>innerWidth,rootBottom:root.getBoundingClientRect().bottom,navTop:getComputedStyle(nav).display==='none'?innerHeight:nav.getBoundingClientRect().top,frameWidth:rect.width,frameHeight:rect.height,controls:[...root.querySelectorAll('button,select')].filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {name:el.getAttribute('aria-label')||el.textContent.trim(),width:r.width,height:r.height,hit:hit===el||el.contains(hit)};})};});if(g.scrollX||g.frameWidth<120||g.frameHeight<90||g.controls.some(c=>c.height<(height>500?44:27)||c.width<32||(!c.hit&&height>500))||height>500&&g.rootBottom>g.navTop+1)failures.push({width,height,g});await page.screenshot({path:path.join(__dirname,`map-board-${width}x${height}.png`)});
 }
 await page.setViewportSize({width:412,height:915});
 // Layers update in place; the tally counts what is drawn.
 await page.getByRole('button',{name:'Tags graph layer'}).click();assert.equal(await page.getByRole('button',{name:'Tags graph layer'}).getAttribute('aria-pressed'),'false');assert.equal(await page.locator('[data-graph-tally=tag]').textContent(),'0');assert.equal(await page.locator('[data-graph-tally=heading]').textContent(),'3');
 await page.getByRole('button',{name:'Tags graph layer'}).click();assert.equal(await page.locator('[data-graph-tally=tag]').textContent(),'2');
 await page.getByRole('button',{name:'All files',exact:true}).click();assert.equal(await page.getByRole('button',{name:'All files',exact:true}).getAttribute('aria-pressed'),'true');
 // The file tab opens "Choose a file"; picking in All files selects that file on the plate.
 await page.locator('.map-file').click();await page.getByRole('heading',{name:'Choose a file'}).waitFor();assert.equal(await page.locator('#panel-content [data-action=graph-pick]').count(),1);await page.locator('#panel-content [data-action=graph-pick]').click();
 await page.getByRole('button',{name:'Read file',exact:true}).waitFor();assert.match(await page.locator('#graph-selected').innerText(),/File · 2 sections/);await page.getByRole('button',{name:'Clear map selection'}).click();assert(await page.locator('#graph-selected').isHidden());
 await page.getByRole('button',{name:'Zoom graph in'}).click();await page.getByRole('button',{name:'Fit graph to screen'}).click();await page.waitForTimeout(1500);
 // A file is selected (not opened): the paper tag rises full width on phone and sits at the plate's bottom left, ≤360px, on wide.
 const dot=await settled(page,[200,250,114]);assert(dot,'visible document node');await page.locator('#graph-canvas canvas').first().click({position:dot});await page.getByRole('button',{name:'Read file',exact:true}).waitFor();await page.waitForTimeout(300);
 const tagRect=()=>page.evaluate(()=>{const t=document.querySelector('#graph-selected').getBoundingClientRect(),f=document.querySelector('.graph-frame').getBoundingClientRect();return {w:t.width,left:t.left-f.left,bottom:f.bottom-t.bottom,fw:f.width};});
 let tr=await tagRect();assert(tr.w>=tr.fw-1,'phone tag spans the plate');await page.screenshot({path:path.join(__dirname,'map-tag-412.png')});
 await page.setViewportSize({width:1280,height:915});await page.waitForTimeout(250);tr=await tagRect();assert(tr.w<=361&&tr.left<=13&&tr.bottom<=13,'wide tag anchored bottom left, ≤360px');await page.screenshot({path:path.join(__dirname,'map-tag-1280.png')});await page.setViewportSize({width:412,height:915});await page.waitForTimeout(250);
 await page.getByRole('button',{name:'Read file',exact:true}).click();await page.locator('#markdown h1').waitFor();
 // A heading opens its section at once (kept from 0.2.1).
 await mapThisFile(page);await page.screenshot({path:path.join(__dirname,'map-heading-check.png')});const heading=await settled(page,[117,223,235]);assert(heading,'visible heading node');await page.locator('#graph-canvas canvas').first().tap({position:heading});await page.locator('#markdown h2').first().waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(failures,[]);console.log('MAP board: eleven sizes, file tab and chooser, scope slide, layer toggles with real tallies, zoom/fit, the paper tag on phone and wide, document open, heading touch navigation, outline tree, empty plate and zero external requests passed.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
