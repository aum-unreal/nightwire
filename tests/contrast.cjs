// AA contrast for the accent-derived tokens (§3.1, §8): every accent × intensity, text tokens on #000 and on --ink-2, accent ink on the accent.
// node tests/contrast.cjs
if(process.platform==='android')Object.defineProperty(process,'platform',{value:'linux'});
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../folio/node_modules/playwright'),launch=require('../../folio/tests/gpu-launch.cjs');
const root=path.resolve(__dirname,'../assets'),port=8804;
const types={js:'application/javascript',css:'text/css',html:'text/html',ttf:'font/ttf',woff2:'font/woff2',svg:'image/svg+xml',json:'application/json'};
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[file.split('.').pop()]||'text/plain');res.end(data);});});
const presets=['neon','glacier','violet','pink','amber','ember','mint','muted'],customs=['#ff00ff','#ffff00','#3030ff'],intensities=['quiet','balanced','vivid'];
const lum=hex=>hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((m,n)=>n-m);return (x+.05)/(y+.05);};
// Text tokens must reach AA (4.5:1) on both grounds; the accent is text only at ≥12px, so it is held to the same bar.
const text=['--text','--muted','--subtle','--accent','--lamp-hi','--danger','--warn'];
(async()=>{
 await new Promise(r=>server.listen(port,'127.0.0.1',r));
 const browser=await chromium.launch({...launch(),headless:true});const failures=[],errors=[];let checked=0,worst=Infinity,worstAt='';
 try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>!!window.Nightwire?.debug?.settings);
  for(const accent of [...presets,...customs])for(const intensity of intensities)for(const contrast of [false,true]){
   const patch=presets.includes(accent)?{accent,intensity,contrast}:{accent:'custom',customColor:accent,intensity,contrast};
   const t=await page.evaluate(({patch,names})=>{Nightwire.debug.settings(patch);const css=getComputedStyle(document.body),v=n=>css.getPropertyValue(n).trim();const hex=n=>{const c=document.createElement('i');c.style.color=v(n);document.body.append(c);const m=getComputedStyle(c).color.match(/\d+/g).map(Number);c.remove();return '#'+m.slice(0,3).map(x=>x.toString(16).padStart(2,'0')).join('');};const out={};for(const n of [...names,'--ink-2','--accent-ink'])out[n]=hex(n);return out;},{patch,names:text});
   const label=`${accent}/${intensity}${contrast?'/high-contrast':''}`;
   const pairs=[...text.flatMap(n=>[[n,'#000000','#000'],[n,t['--ink-2'],'--ink-2']]),['--accent-ink',t['--accent'],'--accent']];
   for(const [fg,bg,bgName] of pairs){const r=ratio(t[fg],bg);checked++;if(r<worst){worst=r;worstAt=`${fg} on ${bgName} @ ${label}`;}if(r<4.5)failures.push(`${label}: ${fg} ${t[fg]} on ${bgName} ${bg} = ${r.toFixed(2)}:1`);}
  }
  // The preset hex stays the exact --accent (other suites pin it).
  await page.evaluate(()=>Nightwire.debug.settings({accent:'neon',intensity:'balanced',contrast:false}));
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()),'#c8fa72');
  await page.evaluate(()=>{localStorage.clear();});
 }finally{await browser.close();server.close();}
 assert.deepEqual(errors,[]);
 if(failures.length){console.error('Contrast failures:\n'+failures.join('\n'));process.exitCode=1;return;}
 console.log(`PASS: ${checked} token pairs across 11 accents × 3 intensities × contrast on/off reach 4.5:1 (lowest ${worst.toFixed(2)}:1, ${worstAt}).`);
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
