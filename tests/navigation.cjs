if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright');
const launch=require('../../folio/tests/gpu-launch.cjs');
const root=path.resolve(__dirname,'../assets');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(8790,'127.0.0.1',r));
 const browser=await chromium.launch({...launch(),headless:true});
 const context=await browser.newContext({viewport:{width:412,height:915},hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8790/');await page.waitForFunction(()=>!!window.Nightwire);
  const paragraph='A paragraph to leave enough room to verify section navigation.\n\n';
  const markdown='# Project Avelor — One-Shot Design Bible\n\n'+paragraph.repeat(14)+'## Content\n\n'+paragraph.repeat(22)+'```text\n'+('wide-code-'.repeat(40))+'\n```\n\n| '+Array(8).fill('Column').join(' | ')+' |\n| '+Array(8).fill('---').join(' | ')+' |\n| '+Array(8).fill('Cell').join(' | ')+' |\n';
  await page.locator('#file-input').setInputFiles({name:'Design doc-1.md',mimeType:'text/markdown',buffer:Buffer.from(markdown)});
  await page.locator('#markdown h2').waitFor();
  await page.getByRole('button',{name:'Home',exact:true}).click();
  for(const width of [320,372,412,800,1280]){
   await page.setViewportSize({width,height:915});
   const geometry=await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth,cards:[...document.querySelectorAll('.file-card,.resume-sheet')].map(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}))}));
   assert(geometry.page<=width,`Long title causes page overflow at ${width}px: ${JSON.stringify(geometry)}`);
   assert(geometry.cards.every(c=>c.left>=0&&c.right<=width),`File card extends past the viewport at ${width}px`);
  }
  await page.setViewportSize({width:372,height:915});await page.screenshot({path:path.join(__dirname,'long-title-phone.png'),fullPage:true});
  await page.getByRole('button',{name:'Continue reading'}).click();await page.locator('#markdown h2').waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Wide code or table must not widen the rendered page');
  for(const selector of ['#markdown pre','#markdown .table-wrap']){
   const scrolling=await page.locator(selector).evaluate(el=>{el.scrollLeft=80;return {scrollable:el.scrollWidth>el.clientWidth,position:el.scrollLeft,bar:getComputedStyle(el,'::-webkit-scrollbar').display};});
   assert(scrolling.scrollable&&scrolling.position>0,selector+' must still scroll horizontally');
   assert.equal(scrolling.bar,'none',selector+' must hide its scrollbar indicator');
  }
  await page.getByRole('button',{name:'Graph of this file'}).click();await page.locator('#graph-canvas canvas').first().waitFor();await page.waitForTimeout(2000);
  const point=await page.locator('#graph-canvas canvas').first().evaluate(canvas=>{const p=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);let xTotal=0,yTotal=0,count=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(p.data[i]===117&&p.data[i+1]===223&&p.data[i+2]===235){xTotal+=x;yTotal+=y;count++;}}return count?{x:xTotal/count/(canvas.width/canvas.clientWidth),y:yTotal/count/(canvas.height/canvas.clientHeight)}:null;});
  assert(point,'Graph must contain the Content heading node');
  await page.locator('#graph-canvas canvas').first().tap({position:point});
  await page.locator('#markdown h2').waitFor({timeout:4000});
  await page.waitForFunction(()=>{const heading=document.querySelector('#markdown h2'),toolbar=document.querySelector('.reader-toolbar');return heading&&toolbar&&heading.getBoundingClientRect().top>=toolbar.getBoundingClientRect().bottom-1&&heading.getBoundingClientRect().bottom<innerHeight-70;});
  assert((await page.evaluate(()=>scrollY))>300,'Heading tap must scroll to the section, including anchors that collide with app IDs');
  await page.screenshot({path:path.join(__dirname,'graph-heading-open.png')});
  // The caption is also a touch target; the tiny heading dot is not the only way to navigate.
  await page.getByRole('button',{name:'Graph of this file'}).click();await page.locator('#graph-canvas canvas').first().waitFor();await page.waitForTimeout(2000);
  await page.screenshot({path:path.join(__dirname,'heading-graph-phone.png')});
  const caption=await page.locator('#graph-canvas canvas').first().evaluate(canvas=>{const p=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);let xTotal=0,yTotal=0,count=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(p.data[i]>95&&p.data[i]<180&&Math.abs(p.data[i+1]-p.data[i+2])<=2&&Math.abs(p.data[i]/p.data[i+1]-155/211)<.025){if(x>xTotal){xTotal=x;yTotal=y;}count++;}}return count?{x:xTotal/(canvas.width/canvas.clientWidth),y:yTotal/(canvas.height/canvas.clientHeight)}:null;});
  assert(caption,'The heading caption must be visible');await page.locator('#graph-canvas canvas').first().tap({position:caption});await page.locator('#markdown h2').waitFor({timeout:4000});
  await page.waitForFunction(()=>{const h=document.querySelector('#markdown h2');return h&&h.getBoundingClientRect().top>=122&&h.getBoundingClientRect().bottom<innerHeight-70;});
  // DOMPurify can remove IDs that shadow DOM properties; source-line metadata identifies these headings.
  await page.locator('#file-input').setInputFiles({name:'Long-filename-'.repeat(12)+'.md',mimeType:'text/markdown',buffer:Buffer.from('# The Seven Day Stones — Battle Map Feature\n\n'+paragraph.repeat(12)+'## Location\n\n'+paragraph.repeat(15)+'## Location\n\n'+paragraph.repeat(15))});
  await page.locator('#markdown h2').nth(1).waitFor();
  for(const [index,anchor] of ['location','location-1'].entries()){
   await page.getByRole('button',{name:'Document outline'}).click();
   await page.locator(`#panel-dialog [data-action="heading"][data-anchor="${anchor}"]`).click();
   await page.waitForFunction(index=>{const heading=document.querySelectorAll('#markdown h2')[index],toolbar=document.querySelector('.reader-toolbar');return heading&&heading.getBoundingClientRect().top>=toolbar.getBoundingClientRect().bottom-1&&heading.getBoundingClientRect().bottom<innerHeight-70;},index);
  }
  await page.getByRole('button',{name:'Home',exact:true}).click();
  for(const width of [320,412,800,1280]){await page.setViewportSize({width,height:915});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Long filename widens home at ${width}px`);await page.locator('[data-action="library"]').first().evaluate(el=>el.click());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Long filename widens library at ${width}px: ${JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll("main *")].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,10).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right,text:el.textContent.slice(0,60)}))))}`);await page.locator('[data-action="home"]').first().evaluate(el=>el.click());}
  assert.deepEqual(errors,[]);
  console.log('PASS: long titles/filenames fit mobile and desktop, wide Markdown stays inside the reader, hidden indicators preserve code/table scrolling, actual touch on a graph heading opens and scrolls to it, colliding/sanitized/duplicate anchors resolve.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
