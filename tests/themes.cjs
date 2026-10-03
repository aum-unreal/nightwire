if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');
const root=path.resolve(__dirname,'../assets');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(8791,'127.0.0.1',r));
 const browser=await chromium.launch({...launch(),headless:true}),context=await browser.newContext({viewport:{width:412,height:915},hasTouch:true});
 await context.addInitScript(()=>{if(!localStorage.getItem('settings'))localStorage.setItem('settings',JSON.stringify({fontSize:18,font:'serif',leading:'1.85',accent:'amber',intensity:'balanced',motion:true,haptics:true}));});
 const page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8791/'))external.push(r.url());});
 const prefs=()=>page.getByRole('button',{name:'Reading preferences',exact:true});
 const close=()=>page.getByRole('button',{name:'Close panel'});
 try{
  await page.goto('http://127.0.0.1:8791/');await page.waitForFunction(()=>!!window.Nightwire);
  assert.equal(await page.locator('h1').textContent(),'Reading desk');assert.equal(await page.locator('.hero,.stats-row,.signal-card').count(),0);
  await page.waitForTimeout(550);await page.screenshot({path:path.join(__dirname,'desk-empty.png')});
  const migrated=await page.evaluate(()=>JSON.parse(localStorage.getItem('settings')));assert.equal(migrated.readerTheme,'nightwire');assert.equal(migrated.readerBlack,true);assert.equal(migrated.fontSize,18);assert.equal(migrated.font,'serif');
  const text='# Field notes\n\nKeep **useful details** and *small observations*. Follow [references](#section-index), with `inline code`.\n\n## Section index\n\n> [!NOTE]\n> A note worth keeping.\n\n```js\nconst colour = "violet";\n// A small example\nconst count = 42;\n```\n\n| File | Topic |\n| --- | --- |\n| Notes.md | Reading |\n\n### Further reading\n\n- [x] Open a file\n- [ ] Follow a section\n\n#reading\n\n'+('A paragraph to verify section navigation.\n\n'.repeat(20));
  await page.locator('#file-input').setInputFiles({name:'Z-field-notes.md',mimeType:'text/markdown',buffer:Buffer.from(text)});await page.locator('#markdown h1').waitFor();
  const input=await page.evaluate(()=>Nightwire.classifierInput());
  const themes=[['nightwire','Nightwire'],['minimal','Minimal'],['catppuccin','Catppuccin Mocha'],['tokyo','Tokyo Night'],['nord','Nord'],['gruvbox','Gruvbox']];
  for(const [id,name]of themes){
   await prefs().click();await page.getByRole('button',{name:name+' reading theme',exact:true}).click();
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.readerTheme),id);
   assert.equal(await page.locator('button[data-reader-theme][aria-pressed="true"]').count(),1);
   assert.equal(await page.locator('#reader-theme-name').textContent(),name);
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent')),'#ffd279');
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--font-size')),'18px');
   await close().click();
   assert.equal(await page.locator('.reader-main').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)');
   await prefs().click();await page.getByRole('switch',{name:'Pure black page',exact:true}).click();await close().click();
   const measured=await page.evaluate(async()=>{const {readerThemes}=await import('/reader-themes.js'),t=readerThemes[document.documentElement.dataset.readerTheme];const css=el=>getComputedStyle(document.querySelector(el));const rgbHex=hex=>'rgb('+hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)).join(', ')+')';const contrast=(rgb,bg)=>{const luminance=colour=>colour.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);const a=luminance(rgb),b=luminance(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};const bg=css('.reader-main').backgroundColor;return {bg,expectedBg:rgbHex(t.bg),h1:css('#markdown h1').color,expectedH1:rgbHex(t.headings[0]),link:css('#markdown a').color,expectedLink:rgbHex(t.link),textContrast:contrast(css('#markdown').color,bg),linkContrast:contrast(css('#markdown a').color,bg),keyword:css('.hljs-keyword').color,expectedKeyword:rgbHex(t.keyword),body:css('body').backgroundColor,serif:css('#markdown').fontFamily};});
   assert.equal(measured.bg,measured.expectedBg);assert.equal(measured.h1,measured.expectedH1);assert.equal(measured.link,measured.expectedLink);assert.equal(measured.keyword,measured.expectedKeyword);assert(measured.textContrast>=4.5,name+' text contrast');assert(measured.linkContrast>=4.5,name+' link contrast');assert.equal(measured.body,'rgb(0, 0, 0)');assert(measured.serif.includes('Georgia'));
   assert.equal((await page.evaluate(()=>Nightwire.classifierInput())).contentRevision,input.contentRevision);
   await page.screenshot({path:path.join(__dirname,`reader-theme-${id}.png`)});
   if(id!=='gruvbox'){await prefs().click();await page.getByRole('switch',{name:'Pure black page',exact:true}).click();await close().click();}
  }
  await page.reload();await page.waitForFunction(()=>window.Nightwire&&document.querySelector('.resume-sheet h2')?.textContent==='Field notes');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.readerTheme),'gruvbox');assert.equal(await page.evaluate(()=>document.documentElement.dataset.readerBlack),'false');
  await page.getByRole('button',{name:'Continue reading'}).click();await page.locator('#markdown h1').waitFor();assert.equal(await page.locator('.reader-main').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(40, 40, 40)');
  await page.locator('#file-input').setInputFiles({name:'A-reference.md',mimeType:'text/markdown',buffer:Buffer.from('# Reference\n\n## Entry\n\nA second file.\n\n#reference')});await page.locator('#markdown h1').waitFor();
  // Library sorting must not replace the desk's last-opened document.
  await page.getByRole('button',{name:'Files',exact:true}).click();await page.getByRole('combobox',{name:'Sort files'}).selectOption('name');await page.getByRole('button',{name:'Home',exact:true}).click();
  assert.equal(await page.locator('.resume-sheet h2').textContent(),'Reference');assert.equal(await page.locator('.desk-register .file-card').count(),1);assert.equal(await page.locator('.desk-register .file-card strong').textContent(),'Field notes');
  await page.getByRole('button',{name:'Bookmark A-reference.md',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Remove bookmark from A-reference.md',exact:true}).getAttribute('aria-pressed'),'true');
  await page.locator('.desk-register .file-card').click();await page.locator('#markdown h1').waitFor();await page.getByRole('button',{name:'Home',exact:true}).click();
  await page.locator('.desk-section[data-anchor="section-index"]').click();await page.waitForFunction(()=>{const h=document.querySelector('#section-index'),toolbar=document.querySelector('.reader-toolbar');return h&&scrollY>100&&h.getBoundingClientRect().top>=toolbar.getBoundingClientRect().bottom-1&&h.getBoundingClientRect().bottom<innerHeight-70;});
  await page.getByRole('button',{name:'Home',exact:true}).evaluate(el=>el.click());
  assert.notEqual(await page.locator('.resume-sheet').evaluate(el=>el.style.opacity),'','Anime.js should enter the desk on navigation');
  await page.waitForTimeout(650);assert.equal(await page.locator('.resume-sheet').evaluate(el=>el.style.opacity),'');assert.equal(await page.locator('.resume-sheet').evaluate(el=>el.style.transform),'');
  await page.screenshot({path:path.join(__dirname,'desk-populated.png'),fullPage:true});
  for(const width of [320,412,800,1280]){
   await page.setViewportSize({width,height:915});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Desk overflow at ${width}px`);
   await page.locator('.top-actions [data-action="settings"]').click();assert(await page.locator('.reader-theme-grid').evaluate(el=>el.scrollWidth<=el.clientWidth),`Theme grid overflow at ${width}px`);
   assert(await page.locator('#panel-content').evaluate(el=>el.scrollWidth<=el.clientWidth),`Theme settings overflow at ${width}px`);if(width===320)await page.screenshot({path:path.join(__dirname,'themes-picker-320.png')});await close().click();
  }
  await page.setViewportSize({width:412,height:915});await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Continue reading'}).click();await page.locator('#markdown h1').waitFor();await page.getByRole('button',{name:'Home',exact:true}).evaluate(el=>el.click());
  assert.equal(await page.locator('.resume-sheet').evaluate(el=>el.style.opacity),'');assert.equal(await page.locator('.resume-sheet').evaluate(el=>el.style.transform),'');
  await page.emulateMedia({reducedMotion:'no-preference'});await prefs().click();await page.getByRole('switch',{name:'Motion',exact:true}).click();await close().click();await page.getByRole('button',{name:'Continue reading'}).click();await page.locator('#markdown h1').waitFor();await page.getByRole('button',{name:'Home',exact:true}).evaluate(el=>el.click());assert.equal(await page.locator('.resume-sheet').evaluate(el=>el.style.opacity),'');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('PASS: six full reader styles, OLED/theme backgrounds, actual heading/link/syntax colours and contrast, independent interface/type preferences, migration and persistence, stable classifier revision, functional desk index/bookmarks/last-opened sorting, responsive layouts, Anime.js cleanup, OS/app reduced motion, zero external requests.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
