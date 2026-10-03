// Screenshot every main view at phone and unfolded/tablet sizes for visual review.
// node tests/shots.cjs <port> <outdir> [label]   → <outdir>/<label>-<view>-<size>.png
if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');
const port=+process.argv[2]||8850,out=path.resolve(process.argv[3]||'tests/shots'),label=process.argv[4]||'shot';
const only=(process.env.VIEWS||'').split(',').filter(Boolean);
const root=path.resolve(__dirname,'../assets');fs.mkdirSync(out,{recursive:true});
const types={js:'application/javascript',css:'text/css',html:'text/html',ttf:'font/ttf',woff2:'font/woff2',svg:'image/svg+xml',json:'application/json'};
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[file.split('.').pop()]||'text/plain');res.end(data);});});
const sizes={phone:{width:412,height:915},wide:{width:830,height:714}};
const views=[
 ['empty',async p=>{}],
 ['home',async p=>{await p.evaluate(()=>Nightwire.debug.loadSamples());await p.waitForTimeout(900);await p.evaluate(()=>Nightwire.debug.navigate('home'));}],
 ['library',async p=>p.evaluate(()=>Nightwire.debug.navigate('library'))],
 ['reader',async p=>p.evaluate(()=>Nightwire.debug.openDocument(Nightwire.debug.state().docs[0].id))],
 ['reader-scrolled',async p=>p.evaluate(()=>window.scrollTo(0,1400))],
 ['more',async p=>p.evaluate(()=>Nightwire.debug.more())],
 ['search',async p=>{await p.evaluate(()=>Nightwire.debug.openSearch('read'));}],
 ['preferences',async p=>p.evaluate(()=>Nightwire.debug.preferences())],
 ['typefaces',async p=>p.evaluate(()=>Nightwire.debug.typefaces())],
 ['graph',async p=>p.evaluate(()=>Nightwire.debug.navigate('graph'))],
 ['read',async p=>p.evaluate(()=>Nightwire.debug.navigate('terminal'))],
];
(async()=>{
 await new Promise(r=>server.listen(port,'127.0.0.1',r));
 const browser=await chromium.launch({...launch(),headless:true});const errors=[];
 try{for(const [size,vp] of Object.entries(sizes)){
  const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:2,hasTouch:true,isMobile:size==='phone'});const p=await ctx.newPage();
  p.on('pageerror',e=>errors.push(`${size}: ${e.message}`));
  await p.goto(`http://127.0.0.1:${port}/`);await p.waitForFunction(()=>!!window.Nightwire?.debug);await p.waitForTimeout(700);
  for(const [name,act] of views){
   try{await p.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();});await act(p);await p.waitForTimeout(name==='graph'?2200:800);
    if(!only.length||only.includes(name))await p.screenshot({path:path.join(out,`${label}-${name}-${size}.png`)});}
   catch(e){errors.push(`${size}/${name}: ${e.message.split('\n')[0]}`);}
  }
  await ctx.close();}}
 finally{await browser.close();server.close();}
 console.log(errors.length?'ERRORS:\n'+errors.join('\n'):'ok');console.log('wrote',out);
})();
