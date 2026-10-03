importScripts('vendor/markdown-it.js','vendor/minisearch.js','core.js');
let generation=0, index=null, documents=[];
self.onmessage=async ({data})=>{
 if(data.type==='index') {
  const current=++generation; index=null;documents=[];
  const next=new MiniSearch({fields:['name','title','body','tags'],storeFields:['name','title','body','tags'],searchOptions:{boost:{title:3,name:2,tags:2},prefix:true,fuzzy:0.15,combineWith:'AND'}});
  const md=NightwireCore.parser();
  for(let i=0;i<data.docs.length;i++) {
   if(current!==generation)return;
   const doc=data.docs[i];
   try {
    const text=doc.text !== undefined ? doc.text : await fetch(doc.url).then(r=>{if(!r.ok)throw Error('Read failed');return r.text();});
    const a=NightwireCore.analyze(text,doc.name,md);const summary={...doc,text:undefined,analysis:{...a,tokens:undefined,body:undefined}};
    documents.push(summary);next.add({id:doc.id,name:doc.name,title:a.title,body:a.body,tags:a.tags.join(' ')});
    if(current!==generation)return;
    self.postMessage({type:'progress',done:i+1,total:data.docs.length,doc:summary});
   }catch(e){self.postMessage({type:'error',id:doc.id,message:e.message});}
  }
  if(current===generation){index=next;self.postMessage({type:'ready',docs:documents});}
 }
 if(data.type==='query') {
  if(!index){self.postMessage({type:'results',query:data.query,results:[],pending:true});return;}
  const query=data.query.trim();let results=[];
  if(query.startsWith('#')) {const term=query.slice(1).toLowerCase();results=documents.filter(d=>d.analysis.tags.some(t=>t.toLowerCase().includes(term))).map(d=>({id:d.id,title:d.analysis.title,name:d.name,snippet:d.analysis.tags.map(t=>'#'+t).join(' ')}));}
  else results=index.search(query).slice(0,60).map(r=>{const body=r.body;const term=(r.terms || [query])[0];const at=body.toLowerCase().indexOf(term.toLowerCase());const start=Math.max(0,at-55);return {id:r.id,title:r.title,name:r.name,snippet:(start?'…':'')+body.slice(start,start+190)};});
  self.postMessage({type:'results',query:data.query,results});
 }
};
