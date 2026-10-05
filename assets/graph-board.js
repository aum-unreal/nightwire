/* Map (§6.7): the plotting plate, its rails and the canvas artwork. ForceGraph wiring and node actions stay in app.js. */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rgb=hex=>{const h=String(hex).replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)||0);};
export const mix=(a,b,t)=>'#'+rgb(a).map((v,i)=>Math.round(v*(1-t)+rgb(b)[i]*t).toString(16).padStart(2,'0')).join('');
const plural=(n,one,many=one+'s')=>`${n} ${n===1?one:many}`;
const isWeb=href=>/^(https?:|mailto:)/i.test(href||'');
const layers=[['headings','heading','Headings'],['tags','tag','Tags'],['links','link','Links']];
const sectionsOf=a=>{const h=a?.headings||[];const two=h.filter(x=>x.level===2).length;return two||h.filter(x=>x.level===3).length;};

export function boardMarkup({doc,docs,scope,filters,colors,glyph}){
 const none=!docs.length,off=none?' disabled':'';
 const name=doc?doc.analysis?.title||doc.name:'No file open';
 const toggles=layers.map(([filter,type,label])=>`<button class="key graph-toggle" data-action="graph-filter" data-filter="${filter}" aria-label="${label} graph layer" aria-pressed="${!!filters[filter]}" style="--layer-color:${colors[type]}"${off}><span class="layer-stub" aria-hidden="true"></span><span class="key-label">${label}</span><i data-graph-tally="${type}">0</i></button>`).join('');
 return `<div class="map-top"><button class="map-file" data-action="graph-files" aria-haspopup="dialog"${off}><span class="map-file-name">${esc(name)}</span>${glyph('down')}</button><div class="slide map-scope" role="group" aria-label="Graph scope"><button class="slide-pos" data-action="graph-scope" data-scope="document" aria-pressed="${scope==='document'}"${off}>This file</button><button class="slide-pos" data-action="graph-scope" data-scope="all" aria-pressed="${scope==='all'}"${off}>All files</button><span class="slide-thumb" aria-hidden="true"></span></div></div>
 <div class="graph-frame"><div id="graph-canvas" class="graph-canvas"></div><div class="plate-band"><h1 class="plate-stencil">Map</h1><span id="graph-count"></span></div><ul class="sr-only map-outline" role="tree" aria-label="Map outline"></ul>${none?'<div class="graph-empty"><h2 class="map-empty-title">Make a connection.</h2><p>Open a Markdown file. Its structure draws the map.</p></div>':''}<div id="graph-selected" class="map-tag paper paper--lit" role="region" aria-label="Selected on the map" hidden></div></div>
 <div class="map-zoom" role="group" aria-label="Zoom"><button class="key key--icon" data-action="graph-in" aria-label="Zoom graph in"${off}>${glyph('plus')}</button><button class="key key--icon" data-action="graph-fit" aria-label="Fit graph to screen"${off}>${glyph('fit')}</button><button class="key key--icon" data-action="graph-out" aria-label="Zoom graph out"${off}>${glyph('minus')}</button></div>
 <div class="map-layers" role="group" aria-label="Graph layers">${toggles}</div>`;
}

/* Heading nodes learn their level and h2 ordinal from the document analysis (core.graphData stays generic). */
export function decorate(data,docs){
 const byId=new Map(docs.map(d=>[d.id,d.analysis]));
 for(const n of data.nodes){if(n.type!=='heading')continue;const a=byId.get(n.doc),hs=(a?.headings||[]).filter(h=>!(h.level===1&&h.text===a.title)),h=hs.find(x=>x.id===n.anchor);n.level=h?.level||2;if(n.level<=2){const i=hs.filter(x=>x.level<=2).indexOf(h);n.num=String(i+1).padStart(2,'0');}}
 return data;
}

export function updateGraphBoard(data,{truncated=false,doc=null,docs=[]}={}){
 const count=document.querySelector('#graph-count');
 if(count)count.textContent=!data.nodes.length?'':`${plural(data.nodes.length,'node')} · ${plural(data.links.length,'link')}${truncated?' · first 450 shown':''}`;
 const counts={heading:0,tag:0,link:0};
 for(const node of data.nodes)if(node.type==='heading'||node.type==='tag')counts[node.type]++;
 counts.link=data.links.filter(l=>l.type==='reference').length;
 document.querySelectorAll('[data-graph-tally]').forEach(el=>el.textContent=counts[el.dataset.graphTally]||0);
 const name=document.querySelector('.map-file-name');if(name&&doc)name.textContent=doc.analysis?.title||doc.name;
 const tree=document.querySelector('.map-outline');if(tree)tree.innerHTML=outlineMarkup(data);
}

/* The offscreen outline: file → sections → tags. Enter on an item acts like a tap (app.js). */
function outlineMarkup(data){
 const id=l=>typeof l==='object'?l.id:l,items=[];
 for(const d of data.nodes.filter(n=>n.type==='document')){
  items.push([1,d,`File: ${d.label}`]);
  for(const h of data.nodes.filter(n=>n.type==='heading'&&n.doc===d.id))items.push([Math.min(3,(h.level||2)),h,`Section: ${h.label}`]);
  for(const l of data.links.filter(l=>id(l.source)===d.id&&l.type==='tag')){const t=data.nodes.find(n=>n.id===id(l.target));if(t)items.push([2,t,`Tag: ${t.label}`]);}
 }
 return items.map(([level,n,label],i)=>`<li role="treeitem" aria-level="${level}" tabindex="${i?-1:0}" data-action="graph-node" data-node="${esc(n.id)}">${esc(label)}</li>`).join('');
}

/* Kept for callers that only need a symmetric margin. */
export function graphFitPadding(){
 const el=document.querySelector('#graph-canvas');
 return el?Math.max(16,Math.min(48,Math.min(el.clientWidth,el.clientHeight)*.12)):48;
}
/* The free plate: the canvas minus the stencil band (28px) and the open tag. */
function freeRect(graph){
 const canvas=document.querySelector('#graph-canvas'),w=graph.width(),h=graph.height(),pad=Math.max(14,Math.min(36,Math.min(w,h)*.08));
 const r={l:pad+8,r:pad+8,t:28+pad*.6,b:pad};
 const tag=document.querySelector('#graph-selected:not([hidden])');
 if(tag&&canvas){const c=canvas.getBoundingClientRect(),t=tag.getBoundingClientRect();if(t.height&&t.width>c.width*.6)r.b=Math.max(r.b,c.bottom-t.top+10);else if(t.height)r.b=Math.max(r.b,(c.bottom-t.top)*.5);}
 return {w,h,...r};
}
/* Frame a set of nodes inside the free plate; maxK keeps the current zoom from growing when only revealing. */
function frameNodes(graph,nodes,ms,maxK=4){
 nodes=nodes.filter(n=>Number.isFinite(n.x)&&Number.isFinite(n.y));if(!nodes.length)return;
 const f=freeRect(graph),xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 const aw=Math.max(40,f.w-f.l-f.r-90),ah=Math.max(40,f.h-f.t-f.b-24);
 const k=Math.max(.2,Math.min(maxK,aw/Math.max(1,x1-x0),ah/Math.max(1,y1-y0)));
 const dx=(f.l-f.r)/2,dy=(f.t-f.b)/2;
 graph.zoom(k,ms);graph.centerAt((x0+x1)/2-dx/k,(y0+y1)/2-dy/k,ms);
}
export function fitGraph(graph,ms=0){if(graph)frameNodes(graph,graph.graphData().nodes,ms);}
/* Keep a newly selected node and its neighbourhood clear of the tag that describes it; zoom and focus survive when they already are. */
export function reveal(graph,node,ms=0){
 if(!graph||!node||!Number.isFinite(node.x))return;const f=freeRect(graph),near=neighbourhood(graph.graphData(),node),group=graph.graphData().nodes.filter(n=>near.has(n.id)&&Number.isFinite(n.x)&&Number.isFinite(n.y));
 const inside=n=>{const p=graph.graph2ScreenCoords(n.x,n.y);return p.x>=f.l&&p.x<=f.w-f.r&&p.y>=f.t+8&&p.y<=f.h-f.b-16;};
 if(!group.every(inside))frameNodes(graph,group,ms,graph.zoom());
}

export function syncGraphBoardPalette(colors){
 const types={headings:'heading',tags:'tag',links:'link'};
 document.querySelectorAll('.graph-toggle[data-filter]').forEach(el=>el.style.setProperty('--layer-color',colors[types[el.dataset.filter]]));
}

/* Inks are read once per frame so a palette change repaints without a rebuild. */
export function inks(){
 const s=getComputedStyle(document.documentElement),v=(k,f)=>s.getPropertyValue(k).trim()||f;
 return {rule:v('--rule','#262523'),rule2:v('--rule-2','#3a3936'),lamp:v('--accent','#c8fa72'),lampDim:v('--lamp-dim','#5a7033'),ink1:v('--ink-1','#070707'),text:v('--text','#e7e4de'),muted:v('--muted','#aaa69e'),subtle:v('--subtle','#8a867f')};
}
export function neighbourhood(data,node){
 if(!node)return null;const id=l=>typeof l==='object'?l.id:l,near=new Set([node.id]);
 for(const l of data.links){const s=id(l.source),t=id(l.target);if(s===node.id)near.add(t);if(t===node.id)near.add(s);}
 if(node.type==='document')for(const n of data.nodes)if(n.type==='heading'&&n.doc===node.id)near.add(n.id);
 return near;
}

/* After an in-place update (a layer toggle): true when most of the map has drifted out of the free plate, so it is framed again. */
export function adrift(graph){
 if(!graph)return false;const f=freeRect(graph),nodes=graph.graphData().nodes.filter(n=>Number.isFinite(n.x)&&Number.isFinite(n.y));if(!nodes.length)return false;
 const inside=nodes.filter(n=>{const p=graph.graph2ScreenCoords(n.x,n.y);return p.x>=f.l&&p.x<=f.w-f.r&&p.y>=f.t&&p.y<=f.h-f.b;}).length;return inside<nodes.length*.6;
}

/* The plate is rarely square (a weak pull to the centre keeps unlinked files together): squeeze the layout along its short axis so a tall phone plate fills with a tall map. */
export function aspectForce(el){
 let nodes=[];const force=alpha=>{const w=el.clientWidth||1,h=el.clientHeight||1,r=Math.min(2.4,Math.max(1/2.4,h/w)),kx=r>1?.2*(r-1):0,ky=r<1?.2*(1/r-1):0;for(const n of nodes){n.vx-=n.x*(kx+.03)*alpha;n.vy-=n.y*(ky+.03)*alpha;n.vx+=n.x*ky*.4*alpha;n.vy+=n.y*kx*.4*alpha;}};
 force.initialize=ns=>{nodes=ns;};return force;
}

/* Grid: --rule dots every 40 graph units, fading out below zoom .6. */
export function paintGrid(ctx,scale,graph,ink){
 const a=Math.max(0,Math.min(1,(scale-.4)/.2));if(!a)return;
 const tl=graph.screen2GraphCoords(0,0),br=graph.screen2GraphCoords(graph.width(),graph.height()),step=40,s=2/scale;
 const x0=Math.floor(tl.x/step)*step,y0=Math.floor(tl.y/step)*step;if((br.x-x0)/step*(br.y-y0)/step>6000)return;
 ctx.save();ctx.globalAlpha=a;ctx.fillStyle=ink.rule;
 for(let x=x0;x<=br.x;x+=step)for(let y=y0;y<=br.y;y+=step)ctx.fillRect(x-s/2,y-s/2,s,s);
 ctx.restore();
}

/* Nodes keep solid fills; tests sample exact pixels of the grommet and the heading tab. */
export function paintNode(node,ctx,scale,{colors,ink,near,selected,lod}){
 const x=node.x,y=node.y;if(!Number.isFinite(x)||!Number.isFinite(y))return;const u=1/scale,c=colors[node.type]||colors.link;
 ctx.save();if(near&&!near.has(node.id))ctx.globalAlpha=.2;
 if(lod){ctx.beginPath();ctx.arc(x,y,(node.type==='document'?3.5:2)*u,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();}
 else if(node.type==='document'){
  ctx.beginPath();ctx.arc(x,y,7*u,0,Math.PI*2);ctx.arc(x,y,3*u,0,Math.PI*2,true);ctx.fillStyle=c;ctx.fill('evenodd');
  ctx.beginPath();ctx.arc(x,y,3.4*u,0,Math.PI*2);ctx.strokeStyle=mix(c,'#000000',.55);ctx.lineWidth=.9*u;ctx.stroke();
 }else if(node.type==='heading'&&(node.level||2)<=2){
  if(scale<1){ctx.fillStyle=c;ctx.fillRect(x-2.5*u,y-2.5*u,5*u,5*u);}
  else{const w=16*u,h=11*u,l=x-w/2,t=y-h/2,n=2.5*u;ctx.beginPath();ctx.moveTo(l,t);ctx.lineTo(l+w-n,t);ctx.lineTo(l+w,t+n);ctx.lineTo(l+w,t+h);ctx.lineTo(l,t+h);ctx.closePath();ctx.fillStyle=c;ctx.fill();
   if(node.num){ctx.fillStyle='#000';ctx.font=`600 ${8.5*u}px "NW Plex Mono",monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(node.num,x-.5*u,y+.6*u);}}
 }else if(node.type==='heading'){ctx.fillStyle=c;ctx.fillRect(x-1.5*u,y-4*u,3*u,8*u);}
 else if(node.type==='tag'){
  ctx.fillStyle=c;ctx.fillRect(x-4*u,y-7*u,1.5*u,14*u);
  ctx.beginPath();ctx.moveTo(x-2.5*u,y-7*u);ctx.lineTo(x+6*u,y-4*u);ctx.lineTo(x-2.5*u,y-1*u);ctx.closePath();ctx.fill();
 }else{
  ctx.beginPath();ctx.arc(x,y,4.5*u,-Math.PI/12,-Math.PI/12-Math.PI*5/3,true);ctx.strokeStyle=c;ctx.lineWidth=1.5*u;ctx.lineCap='round';ctx.stroke();
 }
 ctx.restore();
 if(selected&&selected.id===node.id){ctx.beginPath();ctx.arc(x,y,(node.type==='document'?11:10)*u,0,Math.PI*2);ctx.strokeStyle=ink.lamp;ctx.lineWidth=1*u;ctx.stroke();}
}

/* Edges: orthogonal elbows in --rule; the selected neighbourhood in --lamp-dim. */
export function paintLink(link,ctx,scale,{ink,near,lod}){
 const s=link.source,t=link.target;if(!s||!t||!Number.isFinite(s.x)||!Number.isFinite(t.x))return;
 const lit=near&&near.has(s.id)&&near.has(t.id);
 ctx.save();if(near&&!lit)ctx.globalAlpha=.2;ctx.strokeStyle=lit?ink.lampDim:ink.rule;ctx.lineWidth=(lit?1.25:1)/scale;ctx.lineJoin='miter';
 ctx.beginPath();ctx.moveTo(s.x,s.y);
 if(lod)ctx.lineTo(t.x,t.y);else{const m=(s.x+t.x)/2;ctx.lineTo(m,s.y);ctx.lineTo(m,t.y);ctx.lineTo(t.x,t.y);}
 ctx.stroke();ctx.restore();
}

const radius=n=>n.type==='document'?7:n.type==='heading'?((n.level||2)<=2?8:4):n.type==='tag'?7:5;
/* Labels: Plex at 11px on screen, no plates; collisions include node discs, the stencil band and the tag.
   Every elbow leaves its node horizontally, so a label first takes a side no wire uses, then tries to sit clear of the wires too. */
export function paintLabels(graph,ctx,scale,{colors,ink,near,selected,lod}){
 const all=graph.graphData().nodes,occupied=[],wires=[],busy=new Map(),u=1/scale,priority={document:0,tag:1,heading:2,link:3};
 const rectOf=el=>{const c=document.querySelector('#graph-canvas')?.getBoundingClientRect(),r=el?.getBoundingClientRect();if(!c||!r||!r.width)return null;const a=graph.screen2GraphCoords(r.left-c.left,r.top-c.top),b=graph.screen2GraphCoords(r.right-c.left,r.bottom-c.top);return {x:a.x,y:a.y,w:b.x-a.x,h:b.y-a.y};};
 for(const el of [document.querySelector('.plate-band'),document.querySelector('#graph-selected:not([hidden])')]){const r=rectOf(el);if(r)occupied.push(r);}
 for(const n of all)if(Number.isFinite(n.x)&&Number.isFinite(n.y)){const r=(radius(n)+4)*u;occupied.push({x:n.x-r,y:n.y-r,w:r*2,h:r*2,node:n});}
 if(!lod){const side=(n,to)=>{const s=busy.get(n.id)||{};s[to>n.x?'right':'left']=true;busy.set(n.id,s);},t2=1*u;
  for(const l of graph.graphData().links){const s=l.source,t=l.target;if(!s||!t||!Number.isFinite(s.x)||!Number.isFinite(t.x))continue;const m=(s.x+t.x)/2;side(s,m);side(t,m);
   if(all.length<=160)wires.push({x:Math.min(s.x,m),y:s.y-t2,w:Math.abs(m-s.x),h:t2*2},{x:m-t2,y:Math.min(s.y,t.y),w:t2*2,h:Math.abs(t.y-s.y)},{x:Math.min(m,t.x),y:t.y-t2,w:Math.abs(t.x-m),h:t2*2});}}
 const nodes=[...all].sort((a,b)=>(a.id===selected?.id?-1:priority[a.type])-(b.id===selected?.id?-1:priority[b.type]));
 ctx.font=`${11*u}px "NW Plex Mono",monospace`;ctx.textBaseline='top';ctx.textAlign='left';
 const hits=(c,o)=>!(c.x+c.w+4*u<o.x||c.x>o.x+o.w+4*u||c.y+c.h+2*u<o.y||c.y>o.y+o.h+2*u);
 const clear=(c,self)=>occupied.every(o=>o.node===self||!hits(c,o)),unwired=c=>wires.every(o=>c.x+c.w<o.x||c.x>o.x+o.w||c.y+c.h<o.y||c.y>o.y+o.h);
 for(const n of nodes){
  n.hitLabel=null;if(!Number.isFinite(n.x)||!Number.isFinite(n.y))continue;
  if(lod&&n.type!=='document'&&n.id!==selected?.id)continue;if(n.type==='heading'&&scale<.85)continue;
  const label=n.label.length>27?n.label.slice(0,26)+'…':n.label,w=Math.min(ctx.measureText(label).width,145*u),h=13*u,g=(radius(n)+5)*u;
  const pos={right:{x:n.x+g,y:n.y-h/2},left:{x:n.x-g-w,y:n.y-h/2},below:{x:n.x-w/2,y:n.y+g-2*u},above:{x:n.x-w/2,y:n.y-g-h+2*u}},b=busy.get(n.id)||{};
  const free=['right','left'].filter(k=>!b[k]),taken=['right','left'].filter(k=>b[k]);
  const order=n.type==='heading'?[...free,'below','above',...taken]:['below','above',...free,...taken];let box=null;
  const fits=c=>{const a=graph.graph2ScreenCoords(c.x,c.y),z=graph.graph2ScreenCoords(c.x+w,c.y+h);return a.x>=6&&a.y>=4&&z.x<=graph.width()-6&&z.y<=graph.height()-4;};
  for(const pass of [0,1]){for(const k of order){const cand={...pos[k],w,h};if(fits(cand)&&clear(cand,n)&&(pass||unwired(cand))){box=cand;break;}}if(box)break;}
  if(!box)continue;n.hitLabel=box;occupied.push(box);
  ctx.save();if(near&&!near.has(n.id))ctx.globalAlpha=.2;
  ctx.fillStyle=n.type==='document'?ink.text:n.type==='tag'?colors.tag:n.type==='heading'?mix(colors.heading,'#bac9bf',.55):ink.muted;
  ctx.lineJoin='round';ctx.lineWidth=3*u;ctx.strokeStyle=ink.ink1;ctx.strokeText(label,box.x,box.y+1*u,145*u);ctx.fillText(label,box.x,box.y+1*u,145*u);ctx.restore();
 }
}

/* The paper tag for a selected file, tag or link. */
export function tagMarkup(n,{data,docs,glyph}){
 const id=l=>typeof l==='object'?l.id:l,byId=new Map(data.nodes.map(x=>[x.id,x]));
 const neighbours=[];for(const l of data.links){const s=id(l.source),t=id(l.target);if(s===n.id&&byId.has(t))neighbours.push(byId.get(t));else if(t===n.id&&byId.has(s))neighbours.push(byId.get(s));}
 const order={tag:0,document:1,link:2,heading:3};for(let i=neighbours.length-1;i>=0;i--)if(neighbours.findIndex(x=>x.id===neighbours[i].id)<i)neighbours.splice(i,1);neighbours.sort((a,b)=>order[a.type]-order[b.type]);
 const parent=n.type==='link'?neighbours.find(x=>x.type==='document'):null;let kind,open;
 if(n.type==='document'){const a=docs.find(d=>d.id===n.doc)?.analysis,k=sectionsOf(a);kind=k?`File · ${plural(k,'section')}`:'File';open='Read file';}
 else if(n.type==='tag'){const k=docs.filter(d=>d.analysis?.tags?.includes(n.tag)).length;kind=`Tag · ${plural(k||1,'file')}`;open='Search tag';}
 else{kind=`${isWeb(n.href)?'Web link':'Link'}${parent?' · '+parent.label:''}`;open=isWeb(n.href)?'Open link':'Open target';}
 const marks=neighbours.filter(x=>x.id!==parent?.id).slice(0,6).map(x=>x.type==='tag'?`<button class="tag-mark" data-action="tag-search" data-tag="${esc(x.tag)}">${esc(x.label)}</button>`:`<button class="tag-mark" data-action="graph-node" data-node="${esc(x.id)}">${esc(x.label)}</button>`).join('<span aria-hidden="true"> · </span>');
 return `<div class="map-tag-text"><p class="map-tag-label">${esc(n.label)}</p><p class="map-tag-kind">${esc(kind)}</p></div><button class="key key--icon map-tag-close" data-action="graph-clear" aria-label="Clear map selection">${glyph('close')}</button>${marks?`<p class="map-tag-near">${marks}</p>`:''}<button class="key key--plate map-tag-open" data-action="graph-open"><span class="key-label">${open}</span><span class="map-tag-arrow" aria-hidden="true">${isWeb(n.href)&&n.type==='link'?'↗':'→'}</span></button>`;
}

/* "Choose a file": the rows behind the paper file tab. */
export function filesMarkup(docs,active,{sameName}){
 return `<div class="map-files">${docs.map(d=>{const a=d.analysis,title=a?.title||d.name,k=sectionsOf(a),tags=a?.tags?.length||0,meta=[k?plural(k,'section'):'',tags?plural(tags,'tag'):''].filter(Boolean).join(' · ');return `<button class="row map-file-row" data-action="graph-pick" data-id="${esc(d.id)}"${d.id===active?' aria-current="true"':''}><span class="row-main"><span class="row-title">${esc(title)}</span>${sameName(title,d.name)?'':`<span class="row-meta map-file-path" data-middle="${esc(d.name)}">${esc(d.name)}</span>`}</span>${meta?`<span class="row-end">${meta}</span>`:''}</button>`;}).join('')}</div>`;
}
