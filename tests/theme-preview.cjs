// Review one agent's leaf theme against the real app and shared playback controller.
if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');
const root=path.resolve(__dirname,'../assets'),theme=process.argv[2],port=Number(process.env.THEME_PREVIEW_PORT||8796);
assert(['classic','cyberdeck','phosphor','mixtape','orbital','nocturne'].includes(theme));
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]).replace(/^\//,''),file=path.join(root,name||'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 let data;try{data=fs.readFileSync(file);}catch{res.writeHead(404).end();return;}
 res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.ttf')?'font/ttf':file.endsWith('.woff2')?'font/woff2':'text/plain');res.end(data);
});
(async()=>{await new Promise(r=>server.listen(port,'127.0.0.1',r));const browser=await chromium.launch({...launch(),headless:true});const page=await browser.newPage({viewport:{width:412,height:915},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));const reports=[];
 try{
  await page.addInitScript(theme=>localStorage.setItem('settings',JSON.stringify({terminalStyle:theme,motion:false,terminalWpm:450,terminalGroup:2})),theme);
  await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>!!window.Nightwire);
  await page.locator('#file-input').setInputFiles({name:'Night-city-field-notes-and-a-long-cartridge-title.md',mimeType:'text/markdown',buffer:Buffer.from('# Field notes\n\n## After midnight\n\n'+('We read between the lines. Stay curious and keep a small trace of the useful things. '.repeat(35)))});await page.locator('#markdown h1').waitFor();await page.locator('.mobile-nav [data-action=terminal]').click();await page.locator('#terminal-words').waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.locator('#terminal-seek').evaluate(el=>{el.value=18;el.dispatchEvent(new Event('input',{bubbles:true}));});
  for(const [width,height]of [[348,790],[320,568],[360,640],[393,760],[412,820],[412,915],[768,915],[1280,720],[1280,915],[780,360],[915,412]]){
   await page.setViewportSize({width,height});await page.waitForFunction(()=>{const nav=document.querySelector('.mobile-nav'),dock=getComputedStyle(nav).display==='none'?0:nav.getBoundingClientRect().height;return Math.abs(parseFloat(document.querySelector('.terminal-main').style.getPropertyValue('--terminal-height'))-(innerHeight-dock))<2;});await page.waitForTimeout(100);
   const report=await page.evaluate(()=>{
    const nav=document.querySelector('.mobile-nav'),bottom=getComputedStyle(nav).display==='none'?innerHeight:nav.getBoundingClientRect().top,words=document.querySelector('#terminal-words'),deck=document.querySelector('.terminal-deck');
    const controls=['#terminal-blackout','#terminal-document','#terminal-file','#terminal-play','#terminal-prev','#terminal-next','#terminal-restart','#terminal-seek','#terminal-speed-input','#terminal-slower','#terminal-faster','#terminal-bionic','[data-group="1"]','[data-group="2"]',...[150,300,450,600].map(v=>'[data-speed="'+v+'"]')];
    return {size:[innerWidth,innerHeight],overflow:document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth,font:parseFloat(getComputedStyle(words).fontSize),deckBottom:deck.getBoundingClientRect().bottom,bottom,misses:controls.flatMap(selector=>{const el=document.querySelector(selector);if(!el)return [{selector,missing:true}];const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top<0||r.bottom>bottom+1||r.left<0||r.right>innerWidth||r.width<=0||r.height<20||!(hit===el||el.contains(hit))?[{selector,rect:{x:r.x,y:r.y,w:r.width,h:r.height},hit:hit?.className}]:[];})};
   });reports.push(report);await page.screenshot({path:path.join(__dirname,`facelift-${theme}-${width}x${height}.png`)});
  }
  const textReports=reports.filter(r=>r.overflow||r.font<24||r.deckBottom>r.bottom+1||r.misses.length);console.log(JSON.stringify({theme,errors,failures:textReports},null,2));if(errors.length||textReports.length)process.exitCode=1;
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
