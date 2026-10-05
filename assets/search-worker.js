importScripts('vendor/markdown-it.js','vendor/minisearch.js','core.js');
// Search index. Each document keeps its raw text so a result can say which line and section the first hit sits in.
let generation=0, index=null, documents=[], texts=new Map(), runs=new Map();
const reEscape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const termPattern=terms=>{const list=[...new Set(terms.filter(Boolean).map(t=>t.toLowerCase()))].sort((a,b)=>b.length-a.length);return list.length?new RegExp(`(?<![\\p{L}\\p{N}_])(?:${list.map(reEscape).join('|')})(?![\\p{L}\\p{N}_])`,'giu'):null;};
// Readable running text: one segment per block, inline text joined as written. A heading is followed by " · ",
// and preceded by one unless the sentence before it already ended. The document's own title is left out.
function runningText(a,tokens){const segs=[];let head=false;for(const t of tokens){if(t.type==='heading_open')head=true;else if(t.type==='heading_close')head=false;
 else if(t.type==='inline'){const seg=(t.children||[]).map(c=>c.type==='text'||c.type==='code_inline'?c.content:c.type==='softbreak'||c.type==='hardbreak'?' ':'').join('').replace(/^\s*\[![\w-]+\][+-]?/,'').replace(/\s+/g,' ').trim();if(seg&&!(head&&!segs.length&&seg===a.title))segs.push({seg,head});}
 else if((t.type==='fence'||t.type==='code_block')&&t.content.trim())segs.push({seg:t.content.replace(/\s+/g,' ').trim(),head:false});}
 let out='',prevHead=false;for(const {seg,head} of segs){if(out)out+=prevHead||(head&&!/[.!?…:;]$/.test(out))?' · ':' ';out+=seg;prevHead=head;}return out;}
// A ~190-character window around the first hit, cut at word boundaries, split into hit and non-hit parts.
// It starts at the sentence or section holding the hit when that begins within 110 characters, otherwise at a word ~60 before it.
function snippet(text,re){let at=-1;if(re){re.lastIndex=0;const m=re.exec(text);if(m)at=m.index;}
 let start=0,clean=false;if(at>0){const from=Math.max(0,at-110),back=text.slice(from,at),b=Math.max(...[[' · ',3],['. ',2],['? ',2],['! ',2]].map(([k,n])=>{const i=back.lastIndexOf(k);return i<0?-1:i+n;}));if(b>=0){start=from+b;clean=true;}else if(from===0)clean=true;else start=at-60;}
 let end=Math.min(text.length,start+190);if(end-start<190&&!clean){start=Math.max(0,end-190);}
 if(start>0&&!clean){const sp=text.indexOf(' ',start);if(sp>=0&&(at<0||sp<at))start=sp+1;}if(end<text.length){const sp=text.lastIndexOf(' ',end);if(sp>start&&(at<0||sp>at))end=sp;}
 const win=text.slice(start,end).replace(/^[\s·]+|[\s·]+$/g,''),parts=[];let last=0;if(start>0&&!clean)parts.push({t:'…',hit:false});
 if(re){re.lastIndex=0;for(const m of win.matchAll(re)){if(m.index>last)parts.push({t:win.slice(last,m.index),hit:false});parts.push({t:m[0],hit:true});last=m.index+m[0].length;}}
 if(last<win.length)parts.push({t:win.slice(last),hit:false});if(end<text.length&&!/[.!?…]$/.test(win))parts.push({t:'…',hit:false});return parts;}
// Line of the first hit in the source (1-based, counting frontmatter), and the last heading at or before it.
// A tag that lives only in the frontmatter (tags: [ideas]) points at that property line instead; its section reads "Properties".
function locate(doc,re,bare){const raw=texts.get(doc.id)||'',a=doc.analysis,fm=NightwireCore.frontmatter(raw);let line=null;
 if(re){re.lastIndex=0;const m=re.exec(fm.body);if(m)line=fm.offset+1+(fm.body.slice(0,m.index).match(/\n/g)||[]).length;}
 if(!line&&bare&&fm.offset){const head=raw.split('\n').slice(0,fm.offset).join('\n');bare.lastIndex=0;const m=bare.exec(head);if(m)return {line:1+(head.slice(0,m.index).match(/\n/g)||[]).length,section:'Properties'};}
 let section=null;if(line)for(const h of a.headings){if(h.line>line)break;if(!(h.level===1&&h.text===a.title))section=h.text;}return {line,section};}
function result(doc,terms){const a=doc.analysis,re=termPattern(terms),bare=terms.some(t=>t.startsWith('#'))?termPattern(terms.map(t=>t.replace(/^#/,''))):null;return {id:doc.id,title:a.title,name:doc.name,...locate(doc,re,bare),parts:snippet(runs.get(doc.id)||'',re)};}
self.onmessage=async ({data})=>{
 if(data.type==='index') {
  const current=++generation; index=null;documents=[];texts=new Map();runs=new Map();
  const next=new MiniSearch({fields:['name','title','body','tags'],storeFields:['name','title','tags'],searchOptions:{boost:{title:3,name:2,tags:2},prefix:true,fuzzy:0.15,combineWith:'AND'}});
  const md=NightwireCore.parser();
  for(let i=0;i<data.docs.length;i++) {
   if(current!==generation)return;
   const doc=data.docs[i];
   try {
    const text=doc.text !== undefined ? doc.text : await fetch(doc.url).then(r=>{if(!r.ok)throw Error('Read failed');return r.text();});
    if(current!==generation)return;
    const a=NightwireCore.analyze(text,doc.name,md);const summary={...doc,text:undefined,analysis:{...a,tokens:undefined,body:undefined}};
    documents.push({...summary,analysis:{...summary.analysis,body:a.body}});texts.set(doc.id,text);runs.set(doc.id,runningText(a,a.tokens));next.add({id:doc.id,name:doc.name,title:a.title,body:a.body,tags:a.tags.join(' ')});
    self.postMessage({type:'progress',done:i+1,total:data.docs.length,doc:summary});
   }catch(e){self.postMessage({type:'error',id:doc.id,message:e.message});}
  }
  if(current===generation){index=next;self.postMessage({type:'ready',docs:documents.map(d=>({...d,analysis:{...d.analysis,body:undefined}}))});}
 }
 if(data.type==='query') {
  if(!index){self.postMessage({type:'results',query:data.query,results:[],pending:true});return;}
  const query=data.query.trim(),byId=new Map(documents.map(d=>[d.id,d]));let results=[];
  if(query.startsWith('#')) {const term=query.slice(1).toLowerCase();results=documents.filter(d=>d.analysis.tags.some(t=>t.toLowerCase().includes(term))).map(d=>result(d,d.analysis.tags.filter(t=>t.toLowerCase().includes(term)).map(t=>'#'+t)));}
  else results=index.search(query).slice(0,60).filter(r=>byId.has(r.id)).map(r=>result(byId.get(r.id),r.terms||[query]));
  self.postMessage({type:'results',query:data.query,results,tag:query.startsWith('#')?query:null});
 }
};
