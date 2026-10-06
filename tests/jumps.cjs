// Read ↔ Page ↔ Map jumps: the skipped-block key opens code/diagrams on the Page and Back returns to the same word;
// Read's Map key selects the current section; the Map tag and the Page tools start Read at a section.
if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');
const root=path.resolve(__dirname,'../assets'),port=8805;
const types={js:'application/javascript',css:'text/css',html:'text/html',ttf:'font/ttf',woff2:'font/woff2',svg:'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[file.split('.').pop()]||'text/plain');res.end(data);});});
const filler=n=>Array.from({length:n},(_,i)=>`Line ${i} keeps the prose going so the page scrolls.`).join('\n\n');
const doc=`# Jump test\n\n${filler(6)}\n\n## Build\n\nRun this first:\n\n\`\`\`js\nconst answer=42;\n\`\`\`\n\nThen read on.\n\n${filler(12)}\n\n## Shape\n\n\`\`\`mermaid\ngraph TD;A-->B\n\`\`\`\n\nAfter the diagram.\n\n${filler(12)}\n`;
(async()=>{
 await new Promise(r=>server.listen(port,'127.0.0.1',r));
 const browser=await chromium.launch({...launch(),headless:true});const errors=[];
 try{for(const vp of [{width:412,height:915},{width:830,height:714}]){
  const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:1,hasTouch:true});const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  const view=()=>page.evaluate(()=>Nightwire.debug.state().view);
  await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>!!window.Nightwire?.debug);
  await page.evaluate(t=>Nightwire.debug.addText('jump-test.md',t),doc);await page.waitForFunction(()=>Nightwire.debug.state().docs.length===1);
  await page.evaluate(()=>{const s=Nightwire.debug.state();s.active=s.docs[0].id;Nightwire.debug.navigate('terminal');});await page.locator('#terminal-words').waitFor();
  // Before the code block: no key. Just after it: the key names the language.
  const seek=async i=>{await page.locator('#terminal-seek').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},i);};
  const words=await page.evaluate(()=>[...document.querySelectorAll('#terminal-words')].length);assert.ok(words);
  const then=await page.evaluate(async()=>{const m=await import('./terminal-core.js');const s=Nightwire.debug.state();return m.readingWords(s.doc.analysis).findIndex(w=>w.text==='Then');});
  await seek(then-3);assert.equal(await page.locator('#terminal-aside').isVisible(),false,'no key before the block');
  await seek(then);const key=page.locator('#terminal-aside');await key.waitFor();assert.match(await key.innerText(),/js code/);
  const box=await key.boundingBox();assert.ok(box.height>=44&&box.width>=44,'44px target');
  assert.equal(await page.locator('.terminal-monitor-top #terminal-mode').isVisible(),false,'key replaces the mode readout');
  await key.click();await page.waitForFunction(()=>Nightwire.debug.state().view==='reader');
  const target=page.locator('#markdown .is-aside-target');await target.waitFor();
  assert.match(await target.innerText(),/answer=42/);const tb=await target.boundingBox();assert.ok(tb.y>=0&&tb.y+tb.height<=vp.height,'block is on screen');
  // Back returns to Read at the same word.
  await page.locator('[data-action=back]').first().click();await page.waitForFunction(()=>Nightwire.debug.state().view==='terminal');await page.locator('#terminal-words').waitFor();
  assert.equal(await page.locator('#terminal-seek').inputValue(),String(then),'same word after Back');
  // Diagram key.
  const after=await page.evaluate(async()=>{const m=await import('./terminal-core.js');return m.readingWords(Nightwire.debug.state().doc.analysis).findIndex(w=>w.text==='After');});
  await seek(after);assert.match(await key.innerText(),/mermaid diagram/);
  // Read → Map selects the section being read, without opening it.
  await page.locator('#terminal-map').click();await page.waitForFunction(()=>Nightwire.debug.state().view==='graph');
  const tag=page.locator('#graph-selected');await tag.waitFor({state:'visible',timeout:8000});assert.match(await tag.innerText(),/Shape/);assert.match(await tag.innerText(),/Section/);
  assert.equal(await view(),'graph');
  // Map → Read from that section.
  await page.getByRole('button',{name:'Read from here',exact:true}).click();await page.waitForFunction(()=>Nightwire.debug.state().view==='terminal');await page.locator('#terminal-words').waitFor();
  const shapeStart=await page.evaluate(async()=>{const m=await import('./terminal-core.js');return m.sectionStart(m.readingWords(Nightwire.debug.state().doc.analysis),'shape');});
  assert.ok(shapeStart<after);assert.equal(await page.locator('#terminal-seek').inputValue(),String(after),'a saved word already inside the section is kept');
  // Page → Open in Read starts at the section on screen.
  await page.evaluate(()=>Nightwire.debug.openDocument(Nightwire.debug.state().docs[0].id,'build'));await page.locator('#markdown h2#build').waitFor();await page.waitForFunction(()=>{const t=document.querySelector('#markdown h2#build').getBoundingClientRect().top;return t>=0&&t<innerHeight*.3;});
  await page.evaluate(()=>Nightwire.debug.more());await page.getByRole('button',{name:'Open in Read',exact:true}).last().click();await page.locator('#terminal-words').waitFor();
  const buildStart=await page.evaluate(async()=>{const m=await import('./terminal-core.js');return m.sectionStart(m.readingWords(Nightwire.debug.state().doc.analysis),'build');});
  assert.equal(await page.locator('#terminal-seek').inputValue(),String(buildStart),'Open in Read starts at the section on screen');
  await page.screenshot({path:path.join(__dirname,`jumps-${vp.width}.png`)});
  await ctx.close();
 }
 assert.deepEqual(errors,[]);console.log('jumps: ok');}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
