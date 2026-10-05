if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');
const root=path.resolve(__dirname,'../assets');
const server=http.createServer((req,res)=>{
 const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);});
});
const luminance=colour=>colour.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
(async()=>{
 await new Promise(resolve=>server.listen(8797,'127.0.0.1',resolve));const browser=await chromium.launch({...launch(),headless:true});
 const page=await browser.newPage({viewport:{width:412,height:915},hasTouch:true}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8797/'))external.push(r.url());});
 const tab=name=>page.getByRole('tab',{name,exact:true}).click(),open=async()=>{await page.locator('#content [data-action=settings]').click();await tab('Page');},close=()=>page.getByRole('button',{name:'Close panel'}).click();
 const palette=()=>page.evaluate(()=>{
  const css=selector=>getComputedStyle(document.querySelector(selector)),read=getComputedStyle(document.documentElement);
  const rgb=value=>{const el=document.createElement('span');el.style.color=value;document.body.append(el);const c=getComputedStyle(el).color;el.remove();return c;};
  return {accent:css('.terminal-main').getPropertyValue('--accent').trim(),nav:css('.mobile-nav').getPropertyValue('--key-face').trim(),panel:read.getPropertyValue('--index-panel').trim(),
   words:css('#terminal-words').color,bionic:css('.terminal-word b').color,text:rgb(read.getPropertyValue('--read-text')),bold:rgb(read.getPropertyValue('--read-bold')),
   background:css('.terminal-main').backgroundColor,card:css('.terminal-monitor').backgroundColor,key:css('#terminal-play').backgroundColor,keyText:css('#terminal-play').color,
   border:css('.terminal-monitor').borderLeftColor,preview:css('.classic-preview').backgroundColor,shelf:css('.speed-step').backgroundColor};
 });
 try{
  await page.addInitScript(()=>{if(!localStorage.getItem('settings'))localStorage.setItem('settings',JSON.stringify({terminalStyle:'classic',motion:false,accent:'amber',font:'literata',terminalWpm:450,terminalGroup:2}));});
  await page.goto('http://127.0.0.1:8797/');await page.waitForFunction(()=>!!window.Nightwire);
  await page.locator('#file-input').setInputFiles({name:'Index-palettes.md',mimeType:'text/markdown',buffer:Buffer.from('# Filed notes\n\n## In the margin\n\n'+('Keep a record of the useful things. '.repeat(25)))});
  await page.locator('#markdown h1').waitFor();const original=await page.evaluate(()=>Nightwire.classifierInput());
  await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-seek').evaluate(el=>{el.value=16;el.dispatchEvent(new Event('input',{bubbles:true}));});
  const font=await page.locator('#terminal-words').evaluate(el=>getComputedStyle(el).fontFamily);await open();
  const colours=new Set(),materials=new Set();
  for(const theme of ['nightwire','minimal','catppuccin','tokyo','nord','gruvbox']){
   await page.locator('button[data-reader-theme="'+theme+'"]').click();
   for(const black of [true,false]){
    if(await page.getByRole('switch',{name:'Pure black page',exact:true}).getAttribute('aria-checked')!==String(black))await page.getByRole('switch',{name:'Pure black page',exact:true}).click();
    const p=await palette();assert.equal(p.words,p.text,theme+' prose uses the page palette');assert.equal(p.bionic,p.bold,theme+' emphasis uses the page palette');assert.equal(p.nav,p.panel,theme+' navigation takes the Index paper');assert.equal(p.preview,p.background,'Miniature follows the same paper');assert.equal(p.card,p.background,'Card and desk share paper');
    assert(contrast(p.words,p.card)>=4.5,theme+' readable prose');assert(contrast(p.bionic,p.card)>=4.5,theme+' readable emphasis');assert(contrast(p.keyText,p.key)>=4.5,theme+' readable paper key');
    if(black)assert.equal(p.background,'rgb(0, 0, 0)');else if(theme!=='nightwire')assert.notEqual(p.background,'rgb(0, 0, 0)');
    assert.equal(await page.locator('#terminal-seek').inputValue(),'16');assert.equal(await page.locator('#terminal-wpm').textContent(),'450');assert.equal(await page.locator('[data-group="2"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#terminal-words').evaluate(el=>getComputedStyle(el).fontFamily),font);
    colours.add(p.border);materials.add(p.key);
    await close();await page.screenshot({path:path.join(__dirname,`index-theme-${theme}-${black?'black':'paper'}.png`)});await open();
   }
  }
  assert.equal(colours.size,6,'Every page palette reaches the card rules');assert.equal(materials.size,6,'Paper keys are derived for every palette');
  await page.locator('button[data-reader-theme=nightwire]').click();await tab('Light');
  for(const [id,accent]of [['neon','#c8fa72'],['glacier','#76e5ff'],['violet','#bc9cff'],['pink','#ff9bcf'],['amber','#ffd279'],['ember','#ffad8b'],['mint','#81efc2'],['muted','#b5c7c0']]){
   await page.locator('button[data-palette="'+id+'"]').click();assert.equal((await palette()).accent,accent,'Nightwire inherits '+id);
  }
  await page.locator('#custom-hex').fill('#91b7ff');await page.locator('#custom-hex').press('Enter');assert.equal((await palette()).accent,'#91b7ff','Custom accent reaches Index');
  const shelves=[];for(const intensity of ['quiet','balanced','vivid']){await page.locator('button[data-intensity="'+intensity+'"]').click();shelves.push((await palette()).shelf);}assert.equal(new Set(shelves).size,3,'Colour intensity reaches archival materials');
  await tab('Touch');await page.locator('button[data-action=contrast]').click();assert.equal((await palette()).words,'rgb(243, 244, 245)');
  await tab('Page');await page.locator('button[data-reader-theme=catppuccin]').click();await close();
  const saved=await palette();await page.reload();await page.waitForFunction(()=>!!window.Nightwire&&!!document.querySelector('.resume-sheet'));await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();
  const reloaded=await page.locator('.terminal-main').evaluate(el=>getComputedStyle(el).getPropertyValue('--accent').trim());assert.equal(reloaded,saved.accent,'Palette survives relaunch');assert.equal(await page.locator('#terminal-seek').inputValue(),'16');
  await page.locator('#terminal-blackout').click();assert.equal(await page.locator('.terminal-main').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)','Blackout overrides themed paper');await page.keyboard.press('Escape');
  await page.locator('#terminal-document').click();await page.locator('#markdown h1').waitFor();assert.equal(await page.evaluate(()=>document.body.style.getPropertyValue('--terminal-accent')),'');assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.mobile-nav')).getPropertyValue('--accent').trim()),'#91b7ff','Leaving Index restores interface colour');
  assert.equal((await page.evaluate(()=>Nightwire.classifierInput())).contentRevision,original.contentRevision);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('Index: six page palettes × OLED/original backgrounds, matching live miniature/navigation, text/emphasis/key contrast, eight/custom accents, intensity, higher contrast, font/position/WPM/group persistence, relaunch, blackout and restored interface palette passed.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
