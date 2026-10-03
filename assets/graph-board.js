/* The graph's physical board. ForceGraph and node actions stay in app.js. */
const kinds={document:'Files',heading:'Headings',tag:'Tags',link:'References'};
export function boardMarkup({doc,docs,scope,filters,colors,icon,esc}){
 const source=scope==='all'?`${docs.length} opened ${docs.length===1?'file':'files'}`:doc?.analysis?.title||doc?.name||'No file open';
 return `<header class="trace-heading"><div class="trace-title"><span class="trace-logotype" aria-hidden="true">⌁</span><div><span class="trace-kicker">STRUCTURE PLATE</span><h1>Trace<span aria-hidden="true">.</span></h1></div></div><button class="trace-load" data-action="import" aria-label="Add files to graph">${icon('arrow-up-to-line')}<span>Add files</span></button></header>
 <section class="graph-head trace-rack" aria-label="Graph controls"><div class="trace-cartridge"><span class="trace-cartridge-mark" aria-hidden="true">.md</span><div><label for="graph-file">SOURCE CARTRIDGE</label>${doc?`<select id="graph-file" aria-label="Choose graph document">${docs.map(v=>`<option value="${esc(v.id)}" ${v.id===doc.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select>`:'<span class="trace-no-source">Load any Markdown file</span>'}</div></div><div class="segmented trace-scope" aria-label="Graph scope"><button class="${scope==='document'?'active':''}" data-action="graph-scope" data-scope="document" aria-pressed="${scope==='document'}">This file</button><button class="${scope==='all'?'active':''}" data-action="graph-scope" data-scope="all" aria-pressed="${scope==='all'}">All files</button></div><div class="trace-filter-bank" aria-label="Graph layers">${[['headings','heading','H','Headings'],['tags','tag','#','Tags'],['links','link','↗','References']].map(([filter,type,glyph,label])=>`<button class="graph-toggle ${filters[filter]?'active':''}" data-action="graph-filter" data-filter="${filter}" aria-label="${label} graph layer" aria-pressed="${!!filters[filter]}" style="--layer-color:${colors[type]}"><span class="trace-filter-glyph" aria-hidden="true">${glyph}</span><span>${label}</span><b aria-hidden="true"></b></button>`).join('')}</div></section>
 <div class="graph-frame trace-plot"><div class="trace-edge trace-edge-top" aria-hidden="true"></div><div class="trace-edge trace-edge-left" aria-hidden="true"></div><div id="graph-canvas" class="graph-canvas"></div><div class="graph-info"><span class="accent" id="graph-count">MAPPING SIGNALS…</span><span class="trace-source">${esc(source)}</span></div><div class="graph-tools"><button class="icon-btn" data-action="graph-out" aria-label="Zoom graph out">${icon('minus')}</button><button class="icon-btn trace-fit" data-action="graph-fit" aria-label="Fit graph to screen">${icon('scan')}</button><button class="icon-btn" data-action="graph-in" aria-label="Zoom graph in">${icon('plus')}</button></div>${!docs.length?'<div class="graph-empty"><div class="trace-empty-mark" aria-hidden="true">⊹</div><h2>Make a connection.</h2><p>Open a Markdown file.<br>Its structure draws the map.</p></div>':''}</div>
 <div class="trace-caption"><div class="graph-legend" aria-label="Graph node types">${Object.entries(colors).map(([type,c])=>`<span><b style="background:${c}"></b><span>${kinds[type]}</span><i data-graph-tally="${type}">0</i></span>`).join('')}</div><span class="trace-gesture">PAN / PINCH</span></div>
 <div id="graph-selected" class="graph-selected"><div class="trace-inspect-idle"><span class="trace-inspect-mark" aria-hidden="true">↳</span><span>Tap a heading to read its section.<small>Select a file, tag or reference to inspect.</small></span></div>${icon('mouse-pointer-2')}</div>`;
}
export function updateGraphBoard(data,{truncated=false}={}){
 const count=document.querySelector('#graph-count');
 if(count)count.textContent=`${data.nodes.length} NODES / ${data.links.length} CONNECTIONS${truncated?' · FIRST 450 SHOWN':''}`;
 const counts={document:0,heading:0,tag:0,link:0};
 for(const node of data.nodes)if(node.type in counts)counts[node.type]++;
 document.querySelectorAll('[data-graph-tally]').forEach(el=>el.textContent=counts[el.dataset.graphTally]||0);
}
/* Keep fitting usable when the plotting plate is shorter than 170px. */
export function graphFitPadding(){
 const el=document.querySelector('#graph-canvas');
 return el?Math.max(16,Math.min(60,Math.min(el.clientWidth,el.clientHeight)*.16)):60;
}
export function syncGraphBoardPalette(colors){
 const types={headings:'heading',tags:'tag',links:'link'};
 document.querySelectorAll('.trace-filter-bank [data-filter]').forEach(el=>el.style.setProperty('--layer-color',colors[types[el.dataset.filter]]));
}
