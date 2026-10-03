if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');const root=path.resolve(__dirname,'../assets');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(8801,'127.0.0.1',r));
 const browser=await chromium.launch({...launch(),headless:true}),page=await browser.newPage({viewport:{width:412,height:915},hasTouch:true}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8801/'))external.push(r.url());});
 const close=()=>page.getByRole('button',{name:'Close panel'}).click();
 const pick=async id=>{await page.getByRole('button',{name:'Choose reading typeface',exact:true}).click();await page.locator('.font-option[data-font="'+id+'"]').click();await page.evaluate(()=>document.fonts.ready);await close();};
 const check=async(selector,id)=>{
  const expected=await page.evaluate(async id=>(await import('/reader-fonts.js')).readingFonts[id],id);
  const families=await page.locator(selector).evaluateAll(els=>els.map(el=>getComputedStyle(el).fontFamily));
  assert(families.length,'Reading text exists');
  const firstFamily=expected.family.split(',')[0].replaceAll('"','');
  for(const family of families)assert(family.includes(firstFamily),id+' should reach every reading element: '+family);
  assert.equal(await page.locator('.type-trigger-name').textContent(),expected.short||expected.name);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('settings')).font),id);
 };
 try{
  await page.addInitScript(()=>{if(!localStorage.getItem('settings'))localStorage.setItem('settings',JSON.stringify({motion:false}));});
  await page.goto('http://127.0.0.1:8801/');await page.waitForFunction(()=>!!window.Nightwire);
  const text='# Shared reading type\n\nKeep **useful details** and *clear notes*.\n\n## Second heading\n\n### Third heading\n\n#### Fourth heading\n\n##### Fifth heading\n\n###### Sixth heading\n\n- A readable list\n\n> A quoted passage\n\n| Reading | Font |\n| --- | --- |\n| Both readers | Shared |\n\n```js\nconst code = true;\n```\n\n'+('One shared typeface follows the reading page and word stream. '.repeat(40));
  await page.locator('#file-input').setInputFiles({name:'Shared-type.md',mimeType:'text/markdown',buffer:Buffer.from(text)});await page.locator('#markdown h1').waitFor();
  const revision=(await page.evaluate(()=>Nightwire.classifierInput())).contentRevision,codeFamily=await page.locator('#markdown code').first().evaluate(el=>getComputedStyle(el).fontFamily);
  const pageText='#markdown h1,#markdown h2,#markdown h3,#markdown h4,#markdown h5,#markdown h6,#markdown p,#markdown li,#markdown th,#markdown td';
  for(const [style,theme,fromPage,fromRead]of [
   ['classic','nightwire','opendyslexic','lexend'],['cyberdeck','minimal','fraunces','atkinson'],
   ['phosphor','catppuccin','lora','jetbrains'],['mixtape','tokyo','newsreader','inter'],
   ['orbital','nord','crimson','nunito'],['nocturne','gruvbox','literata','opendyslexic']
  ]){
   await page.locator('.top-actions [data-action=settings]').click();await page.locator('button[data-reader-theme="'+theme+'"]').click();await page.getByRole('combobox',{name:'Read tab style'}).selectOption(style);await close();
   await pick(fromPage);await check(pageText,fromPage);
   await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();await check('#terminal-words,#terminal-words b',fromPage);
   await page.locator('#terminal-seek').evaluate(el=>{el.value=20;el.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('[data-group="2"]').click();
   await pick(fromRead);await check('#terminal-words,#terminal-words b',fromRead);
   assert.equal(await page.locator('#terminal-seek').inputValue(),'20');
   await page.locator('#terminal-bionic').click();await check('#terminal-words .terminal-word',fromRead);await page.locator('#terminal-bionic').click();
   await page.locator('#terminal-document').click();await page.locator('#markdown h1').waitFor();await check(pageText,fromRead);
   assert.equal(await page.locator('#markdown code').first().evaluate(el=>getComputedStyle(el).fontFamily),codeFamily);
   await page.locator('.top-actions [data-action=settings]').click();assert.equal(await page.getByRole('combobox',{name:'Reading typeface'}).inputValue(),fromRead);await close();
   await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();assert.equal(await page.locator('#terminal-seek').inputValue(),'20');await check('#terminal-words',fromRead);
   await page.locator('#terminal-document').click();await page.locator('#markdown h1').waitFor();
  }
  await page.reload();await page.waitForFunction(()=>!!window.Nightwire&&!!document.querySelector('.resume-sheet'));await page.getByRole('button',{name:'Continue reading',exact:true}).click();await page.locator('#markdown h1').waitFor();await check(pageText,'opendyslexic');
  await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();await check('#terminal-words','opendyslexic');assert.equal(await page.locator('#terminal-seek').inputValue(),'20');
  await page.locator('#content [data-action=settings]').click();await page.getByRole('combobox',{name:'Reading typeface'}).selectOption('lexend');await page.evaluate(()=>document.fonts.ready);await close();await check('#terminal-words','lexend');
  await page.locator('#terminal-document').click();await page.locator('#markdown h1').waitFor();await check(pageText,'lexend');assert.equal((await page.evaluate(()=>Nightwire.classifierInput())).contentRevision,revision);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('Font sync: both directions across six Page/Read themes, all six heading levels and prose, accessibility fonts, bionic/plain text, settings selector, reload, word position, source separation and classifier revision passed.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
