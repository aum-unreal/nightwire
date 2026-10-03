import {boardMarkup,updateGraphBoard,graphFitPadding,syncGraphBoardPalette} from './graph-board.js';
import {readStyles,readStyle,stylePicker} from './read-styles.js';
import {createTerminal} from './terminal-reader.js';
import {ClassifierRegistry} from './classifier/index.js';
import {readerThemes,applyReaderTheme} from './reader-themes.js';
import {readingFonts,applyReadingFont,typefaceTrigger,fontRackMarkup} from './reader-fonts.js';
const C = window.NightwireCore, esc=C.escape, $=s=>document.querySelector(s), native=!!window.Native;
DOMPurify.addHook('afterSanitizeAttributes', node=>{
 if(node.tagName==='IMG'){const src=node.getAttribute('src')||'';if(!/^data:image\/(png|jpeg|webp|gif);base64,/i.test(src)){node.removeAttribute('src');node.setAttribute('data-image-source',src);}}
});
const md=C.parser();
md.options.highlight=(code,lang)=>{try{return lang && hljs.getLanguage(lang)?hljs.highlight(code,{language:lang,ignoreIllegals:true}).value:esc(code);}catch{return esc(code);}};
let terminal=null;
const defaults={terminalAlignment:'fixed',terminalStyle:'cyberdeck',terminalWpm:300,terminalGroup:1,terminalBionic:true,readerTheme:'nightwire',readerBlack:true,fontSize:17,font:'sans',leading:'1.85',accent:'neon',customColor:'#91b7ff',intensity:'balanced',haptics:true,contrast:false,motion:true};
function stored(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
const state={view:'home',docs:[],active:null,doc:null,source:false,focus:false,settings:{...defaults,...stored('settings',{})},docState:stored('doc-state',{}),last:stored('last-document',null),starredOnly:false,sort:stored('sort','recent'),filter:'',graphScope:'document',graphFilters:{headings:true,tags:true,links:true},graphSelected:null};
let deskAnimation, database, graph, graphResize, graphNeedsFit=true, route=0, toastTimer, findTimer, searchTimer, findMarks=[],findAt=-1,indexReady=false,indexGeneration=0;
const bodyCache=new Map(), analysisCache=new Map(), content=$('#content'), searchWorker=new Worker('search-worker.js');
const dates=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'});
const icon=name=>`<i data-lucide="${name}"></i>`;
const byteSize=n=>n<1024?`${n} B`:n<1024*1024?`${(n/1024).toFixed(1)} KB`:`${(n/1024/1024).toFixed(1)} MB`;
const color={document:'#c8fa72',heading:'#75dfeb',tag:'#e994d3',link:'#91a5ac'};
const palettes={
 neon:{name:'Signal lime',accent:'#c8fa72',secondary:'#75dfeb',tertiary:'#e994d3'},
 glacier:{name:'Glacier',accent:'#76e5ff',secondary:'#b8bbff',tertiary:'#89ffd5'},
 violet:{name:'Ultraviolet',accent:'#bc9cff',secondary:'#80d9ff',tertiary:'#ffa5db'},
 pink:{name:'Hot pink',accent:'#ff9bcf',secondary:'#b59aff',tertiary:'#91efeb'},
 amber:{name:'Amber terminal',accent:'#ffd279',secondary:'#96e0bf',tertiary:'#ffa68c'},
 ember:{name:'Ember',accent:'#ffad8b',secondary:'#ffd579',tertiary:'#bcabff'},
 mint:{name:'Mint circuit',accent:'#81efc2',secondary:'#8ccfff',tertiary:'#f4accf'},
 muted:{name:'Quiet night',accent:'#b5c7c0',secondary:'#a8bdcb',tertiary:'#cdbbcc'}
};
const rgb=hex=>hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16));
const mix=(hex,other,amount)=>'#'+rgb(hex).map((v,i)=>Math.round(v*(1-amount)+rgb(other)[i]*amount).toString(16).padStart(2,'0')).join('');
function luminance(hex){return rgb(hex).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);}
function readableAccent(hex){let c=hex;for(let n=0;n<10&&luminance(c)<.28;n++)c=mix(c,'#ffffff',.14);return c;}
function hueColor(h){const f=n=>{const k=(n+h/30)%12;return .72-.80*Math.min(.72,1-.72)*Math.max(-1,Math.min(k-3,9-k,1));};return '#'+[f(0),f(8),f(4)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');}
function hueOf(hex){const [r,g,b]=rgb(hex).map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;if(!d)return 0;return Math.round((((max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60)%360));}
function palette(){if(state.settings.accent!=='custom'&&!palettes[state.settings.accent])state.settings.accent='neon';if(!/^#[a-f0-9]{6}$/i.test(state.settings.customColor))state.settings.customColor=defaults.customColor;return state.settings.accent==='custom'?{name:'Custom signal',accent:readableAccent(state.settings.customColor),secondary:hueColor((hueOf(state.settings.customColor)+65)%360),tertiary:hueColor((hueOf(state.settings.customColor)+190)%360)}:palettes[state.settings.accent];}
function tactile(el){if(document.body.classList.contains('reading-blackout'))return null;return el?.closest('button:not(:disabled),[role="button"],summary,select,a[data-action],#markdown a');}
let press=null,lastFeedback=0;
function feedback(kind='selection'){if(!state.settings.haptics||!native||typeof Native.haptic!=='function')return;const now=performance.now();if(now-lastFeedback<45)return;lastFeedback=now;try{Native.haptic(kind==='confirm');}catch{}}
function releasePress(){if(!press)return;press.el.classList.remove('is-pressed');press=null;}
function pressWave(el,x,y){if(!motion()||!el?.matches('button,[role="button"]'))return;const r=el.getBoundingClientRect(),wave=document.createElement('span');wave.className='press-wave';wave.setAttribute('aria-hidden','true');const size=Math.max(r.width,r.height)*2;wave.style.width=wave.style.height=size+'px';wave.style.left=(x??r.width/2)+'px';wave.style.top=(y??r.height/2)+'px';el.append(wave);wave.addEventListener('animationend',()=>wave.remove(),{once:true});setTimeout(()=>wave.remove(),650);}

function icons(){lucide.createIcons({attrs:{'aria-hidden':'true'}});document.querySelectorAll('button,[role="button"],a[data-action],summary,select').forEach(el=>el.classList.add('tactile'));}
function persist(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{toast('Could not save reading preferences');}}
function docPrefs(id){return state.docState[id] ||= {starred:false,position:0,rawPosition:0,lastRead:0};}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000);}
function applySettings(){
 const s=state.settings,p=palette(),style=document.documentElement.style;
 s.terminalStyle=readStyle(s.terminalStyle);if(!['fixed','center'].includes(s.terminalAlignment))s.terminalAlignment='fixed';
 applyReadingFont(s);applyReaderTheme(s,p.accent);if(!motion())stopDeskMotion();
 if(!['quiet','balanced','vivid'].includes(s.intensity))s.intensity='balanced';
 const strength={quiet:.055,balanced:.09,vivid:.15}[s.intensity];
 const variables={'font-size':s.fontSize+'px','reader-leading':s.leading,'accent':p.accent,'cyan':p.secondary,'pink':p.tertiary,'accent-rgb':rgb(p.accent).join(','),'cyan-rgb':rgb(p.secondary).join(','),'pink-rgb':rgb(p.tertiary).join(','),'accent-soft':mix(p.accent,'#000000',.85),'accent-border':mix(p.accent,'#000000',.70),'accent-ink':luminance(p.accent)>.179?'#101410':'#ffffff','surface':mix('#000000',p.accent,strength*.45),'raised':mix('#080a09',p.accent,strength*.75),'line':mix('#18201d',p.accent,strength*.65)};
 for(const [key,value]of Object.entries(variables))style.setProperty('--'+key,value);
 document.documentElement.dataset.palette=s.accent;document.documentElement.dataset.intensity=s.intensity;
 document.body.classList.toggle('serif',s.font==='serif');document.body.classList.remove('reading-serene');document.body.classList.toggle('high-contrast',s.contrast);document.body.classList.toggle('no-motion',!s.motion);
 Object.assign(color,{document:p.accent,heading:p.secondary,tag:p.tertiary,link:mix(p.secondary,'#b4bfbb',.65)});
 syncGraphBoardPalette(color);
 document.querySelectorAll('.graph-legend b').forEach((el,i)=>el.style.background=Object.values(color)[i]);if(graph)graph.nodeColor(n=>color[n.type]).linkColor(l=>mix(l.type==='tag'?color.tag:l.type==='reference'?color.document:color.heading,'#000000',.72));
 syncReaderControls();syncAppearanceControls();terminal?.settingsChanged();persist('settings',s);
}
function syncAppearanceControls(){const p=palette();document.querySelectorAll('button[data-palette]').forEach(b=>{const active=b.dataset.palette===state.settings.accent;b.setAttribute('aria-pressed',active);b.classList.toggle('selected',active);});document.querySelectorAll('button[data-intensity]').forEach(b=>{const active=b.dataset.intensity===state.settings.intensity;b.setAttribute('aria-pressed',active);b.classList.toggle('active',active);});if($('#palette-name'))$('#palette-name').textContent=p.name;if($('#palette-caption'))$('#palette-caption').textContent=state.settings.intensity.toUpperCase()+' / TRUE BLACK';if($('#custom-hex')&&document.activeElement!==$('#custom-hex')){$('#custom-hex').value=state.settings.customColor.toUpperCase();$('#custom-hex').removeAttribute('aria-invalid');}if($('#accent-hue')&&document.activeElement!==$('#accent-hue'))$('#accent-hue').value=hueOf(state.settings.customColor);}

function openPanel(title,html,eyebrow='DOCUMENT TOOLS'){terminal?.pause();$('#panel-title').textContent=title;$('#panel-eyebrow').textContent=eyebrow;$('#panel-content').innerHTML=html;if(!$('#panel-dialog').open)$('#panel-dialog').showModal();icons();}
function closePanels(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function resetGraph(){graphNeedsFit=true;graphResize?.disconnect();graphResize=null;if(graph){graph.pauseAnimation();graph._destructor?.();graph=null;}state.graphSelected=null;}
function savePosition(){if(state.view==='terminal'){terminal?.save();return;}if(state.view!=='reader'||!state.active||!state.doc)return;docPrefs(state.active)[state.source?'rawPosition':'position']=window.scrollY;if(!state.source){const max=document.documentElement.scrollHeight-innerHeight;docPrefs(state.active).progress=max>0?Math.min(1,Math.max(0,scrollY/max)):1;}persist('doc-state',state.docState);}
function stopTerminal(){terminal?.destroy();terminal=null;}
function navigate(view){savePosition();stopTerminal();route++;resetGraph();state.view=view;state.focus=false;document.body.classList.remove('focus-mode');content.className='';if(view!=='library'){state.starredOnly=false;state.filter='';}render();window.scrollTo(0,0);}
function nav(){document.body.dataset.view=state.view;const active=state.view==='reader'?'library':state.view;document.querySelectorAll('.desktop-nav button,.mobile-nav button').forEach(b=>{const selected=b.dataset.action===active||b.dataset.action==='starred'&&state.starredOnly;b.classList.toggle('active',selected);if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});const current=state.docs.find(d=>d.id===(state.active||state.last));$('#dock-context').textContent=current?.name||'No file open';$('#dock-context').title=current?.name||'';const dockCount=$('#dock-count');dockCount.innerHTML=String(state.docs.length).padStart(2,'0')+'<span aria-hidden="true"> FILES</span>';dockCount.setAttribute('aria-label',state.docs.length+' '+(state.docs.length===1?'file':'files'));$('#breadcrumb-label').textContent=state.view==='reader'?'READER':state.view==='library'&&state.starredOnly?'BOOKMARKED':state.view.toUpperCase();$('#nav-count').textContent=state.docs.length;$('#sidebar-recents').innerHTML=state.docs.length?sortedDocs().slice(0,8).map(d=>`<button data-action="document" data-id="${esc(d.id)}" class="${d.id===state.active?'active':''}">${icon('file-text')}<span>${esc(d.name)}</span></button>`).join(''):'<p class="sidebar-empty">Open a file to start.<br>Your recent reads appear here.</p>';icons();}
function sortedDocs(){return [...state.docs].sort((a,b)=>state.sort==='name'?a.name.localeCompare(b.name):state.sort==='size'?b.bytes-a.bytes:(docPrefs(b.id).lastRead||b.imported)-(docPrefs(a.id).lastRead||a.imported));}
function fileCard(d){const a=d.analysis;const last=docPrefs(d.id).lastRead||d.imported;return `<div class="file-card" data-action="document" data-id="${esc(d.id)}" tabindex="0" role="button" aria-label="Read ${esc(d.name)}"><div class="file-emblem">.md</div><div class="file-details"><strong>${esc(a?.title||d.name)}</strong><div class="mono">${esc(d.name)} · ${byteSize(d.bytes)} · ${dates.format(last)}</div>${a?.tags.length?`<div class="tags">${a.tags.slice(0,3).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div>`:''}</div><button class="icon-btn small star-button ${docPrefs(d.id).starred?'saved':''}" data-action="star" data-id="${esc(d.id)}" aria-label="${docPrefs(d.id).starred?'Remove bookmark from':'Bookmark'} ${esc(d.name)}" aria-pressed="${!!docPrefs(d.id).starred}">${icon('bookmark')}</button>${icon('chevron-right')}</div>`;}
function home(){
 const docs=[...state.docs].sort((a,b)=>(docPrefs(b.id).lastRead||b.imported)-(docPrefs(a.id).lastRead||a.imported)),recent=docs[0],a=recent?.analysis;
 const sections=(a?.headings||[]).filter(h=>!(h.level===1&&h.text===a.title)).slice(0,4),tags=[...new Set(docs.flatMap(d=>d.analysis?.tags||[]))].slice(0,8);
 const prefs=recent?docPrefs(recent.id):{},progress=Number.isFinite(prefs.progress)?Math.round(Math.min(1,Math.max(0,prefs.progress))*100):null;
 content.className='desk-main';content.innerHTML=`<header class="desk-heading"><div><span class="desk-label">${docs.length?`${docs.length} ${docs.length===1?'FILE':'FILES'}`:'NIGHTWIRE'}</span><h1>Reading desk</h1></div>${docs.length?`<button class="button" data-action="import">${icon('plus')}Open file</button>`:''}</header>
 ${recent?`<button class="desk-search" data-action="search">${icon('search')}<span>Search your files</span><kbd>Ctrl / ⌘ K</kbd></button>
 <div class="desk-workspace"><article class="resume-sheet"><div class="resume-caption"><span>LAST OPENED</span><button class="icon-btn star-button ${prefs.starred?'saved':''}" data-action="star" data-id="${esc(recent.id)}" aria-label="${prefs.starred?'Remove bookmark from':'Bookmark'} ${esc(recent.name)}" aria-pressed="${!!prefs.starred}">${icon('bookmark')}</button></div><p class="resume-filename">${esc(recent.name)}</p><h2>${esc(a?.title||recent.name)}</h2><div class="resume-meta">${a?`<span>${Math.max(1,Math.ceil(a.words/230))} MIN READ</span>`:''}<span>${byteSize(recent.bytes)}</span></div><div class="resume-bottom"><button class="button primary" data-action="document" data-id="${esc(recent.id)}">${icon('book-open')}Continue reading</button><div class="resume-position">${progress===null?(prefs.position?'SAVED':'START'):progress+'%'}<div class="resume-progress" aria-hidden="true"><b style="width:${progress||0}%"></b></div></div></div></article>
 ${sections.length?`<aside class="desk-index" aria-label="Sections in last opened file"><h2 class="desk-index-title"><span>SECTION INDEX</span></h2>${sections.map((h,i)=>`<button class="desk-section" data-action="desk-heading" data-id="${esc(recent.id)}" data-anchor="${esc(h.id)}"><span class="section-number">${(i+1).toString().padStart(2,'0')}</span><span class="section-title">${esc(h.text)}</span></button>`).join('')}<button class="text-button" data-action="desk-graph" data-id="${esc(recent.id)}">${icon('network')}Map this file ${icon('arrow-up-right')}</button></aside>`:''}</div>
 ${docs.length>1?`<section class="desk-register"><div class="desk-register-heading"><h2>Other files</h2><button class="text-button" data-action="library">All files ${icon('arrow-up-right')}</button></div><div class="file-list">${docs.slice(1,7).map((d,i)=>fileCard(d).replace('<div class="file-emblem">.md</div>',`<div class="file-emblem">${(i+1).toString().padStart(2,'0')}</div>`)).join('')}</div></section>`:''}
 ${tags.length?`<div class="desk-topics"><span class="topics-label">TOPICS</span>${tags.map(tag=>`<button data-action="tag-search" data-tag="${esc(tag)}">#${esc(tag)}</button>`).join('')}</div>`:''}`:
 `<section class="desk-empty"><div class="empty-file-glyph" aria-hidden="true">.md</div><h2>Open a Markdown file</h2><p>Choose a file from Downloads, drag it here, or paste Markdown.</p><button class="button primary" data-action="import">${icon('folder-open')}Open Markdown</button><div class="desk-empty-tools"><button class="text-button" data-action="paste">${icon('clipboard-paste')}Paste text</button><button class="text-button" data-action="sample">Explore a sample ${icon('arrow-up-right')}</button></div></section>`}`;
}
function stopDeskMotion(){if(deskAnimation){const animation=deskAnimation;deskAnimation=null;animation.revert();}}
function animateDesk(){
 if(!motion()||!window.anime)return;
 const targets=[...content.querySelectorAll('.desk-heading,.resume-sheet,.desk-index,.desk-register,.desk-topics,.desk-empty')];
 const animation=anime.animate(targets,{opacity:[0,1],translateY:[9,0],duration:340,delay:anime.stagger(35),ease:'out(3)',onComplete:()=>{if(deskAnimation===animation){deskAnimation=null;animation.revert();}}});deskAnimation=animation;
}
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)stopDeskMotion();});
function library(){content.innerHTML=`<div class="page-heading"><div><span class="eyebrow mono">LIBRARY</span><h1>${state.starredOnly?'Bookmarked':'Files'}<span class="accent">.</span></h1><p>${state.starredOnly?'Saved files.':'Opened Markdown files.'}</p></div><button class="button primary" data-action="import">${icon('plus')}Open files</button></div><div class="library-tools"><label class="inline-search">${icon('search')}<input id="library-filter" placeholder="Filter filenames and tags…" value="${esc(state.filter)}" aria-label="Filter recent filenames and tags"></label><select id="library-sort" aria-label="Sort files"><option value="recent">Recently read</option><option value="name">Name A–Z</option><option value="size">Largest first</option></select></div><div id="library-grid" class="library-grid"></div><button class="drop-zone" data-action="import" style="width:100%">${icon('folder-open')} Open files from Downloads, or drop Markdown here</button><p class="library-hint">PRIVATE READING COPIES · ORIGINAL FILES STAY IN PLACE<br>Use the search icon for full-text search across every file.</p>`;$('#library-sort').value=state.sort;$('#library-filter').addEventListener('input',e=>{state.filter=e.target.value;renderLibraryCards();});$('#library-sort').addEventListener('change',e=>{state.sort=e.target.value;feedback();persist('sort',state.sort);renderLibraryCards();});renderLibraryCards();}
function renderLibraryCards(){const term=state.filter.toLowerCase();const list=sortedDocs().filter(d=>(!state.starredOnly||docPrefs(d.id).starred)&&[d.name,d.analysis?.title,...(d.analysis?.tags||[])].some(v=>v?.toLowerCase().includes(term)));$('#library-grid').innerHTML=list.length?list.map(fileCard).join(''):`<div class="empty-card" style="grid-column:1/-1">${icon('files')}<strong>${term?'No matching files.':state.starredOnly?'Nothing bookmarked yet.':'The deck is clear.'}</strong>${term?'Try a filename or tag.':'Open a Markdown file to get started.'}</div>`;icons();}
function render(){const entering=content.dataset.view!==state.view;stopDeskMotion();content.dataset.view=state.view;nav();if(state.view==='home')home();else if(state.view==='library')library();else if(state.view==='graph')renderGraph();else if(state.view==='terminal')renderTerminal();icons();if(state.view==='home'&&entering)animateDesk();}
function terminalFiles(){
 openPanel('Choose a read',`<div class="terminal-file-list">${sortedDocs().map(d=>{
 const title=d.analysis?.title,active=d.id===state.active;
 return `<button class="panel-link terminal-file-choice ${active?'current':''}" data-action="terminal-open" data-id="${esc(d.id)}" aria-label="Read ${esc(d.name)}" ${active?'aria-current="true"':''}>${icon('file-text')}<span>${title&&title!==d.name?`<strong>${esc(title)}</strong>`:''}<span class="terminal-choice-name">${esc(d.name)}</span></span>${active?icon('check'):icon('chevron-right')}</button>`;
 }).join('')}</div><button class="button terminal-picker-import" data-action="import">${icon('plus')}Open another file</button>`,'RECENT FILES');
}
async function renderTerminal(id=state.active||state.last||sortedDocs()[0]?.id){
 if(terminal){nav();return;}
 const d=state.docs.find(d=>d.id===id)||sortedDocs()[0];
 content.className='terminal-main';
 if(!d){content.innerHTML=`<section class="terminal-empty"><span class="eyebrow mono">READ / WORD STREAM</span><h1>Terminal reading</h1><p>Open a Markdown file to read one or two words at a time.</p><button class="button primary" data-action="import">${icon('plus')}Open file</button><button class="button" data-action="paste">Paste text</button></section>`;icons();return;}
 const current=++route;content.innerHTML='<div class="loading">Preparing word stream…</div>';
 try{
  const text=await getText(d);if(current!==route||state.view!=='terminal')return;
  const analysis=analysisCache.get(d.id)||C.analyze(text,d.name,md);analysisCache.set(d.id,analysis);
  state.active=d.id;state.doc={...d,text,analysis};state.last=d.id;persist('last-document',d.id);docPrefs(d.id).lastRead=Date.now();
  terminal=createTerminal({root:content,doc:state.doc,index:docPrefs(d.id).terminalPosition||0,settings:state.settings,
   save:index=>{if(!state.docs.some(v=>v.id===d.id))return;docPrefs(d.id).terminalPosition=index;persist('doc-state',state.docState);},saveSettings:()=>persist('settings',state.settings),icon,escape:esc,motion,feedback,icons,onDocument:anchor=>openDocument(d.id,anchor),onFiles:terminalFiles,onStyleChange:()=>{stopTerminal();renderTerminal(d.id);}});
  nav();
 }catch(e){if(current!==route)return;content.innerHTML=`<div class="empty-card">${esc(e.message)}<button class="button" data-action="import">Open file</button></div>`;}
}
async function getText(d){if(bodyCache.has(d.id))return bodyCache.get(d.id);let text;if(native){const r=await fetch(d.url);if(!r.ok)throw Error('Stored file could not be read');text=await r.text();}else {const value=await dbGet(d.id);if(!value)throw Error('Stored file could not be read');text=value.text;}if(bodyCache.size>5)bodyCache.delete(bodyCache.keys().next().value);bodyCache.set(d.id,text);return text;}
async function openDocument(id,anchor=null,searchTerm=null){const d=state.docs.find(d=>d.id===id);if(!d){toast('Open this file first to follow its link');return;}savePosition();stopTerminal();resetGraph();const current=++route;state.view='reader';content.dataset.view='reader';stopDeskMotion();state.active=id;state.source=false;state.doc=null;state.focus=false;document.body.classList.remove('focus-mode');content.className='reader-main';content.innerHTML='<div class="loading"><span class="eyebrow mono">OPENING FILE</span>Reading your Markdown…</div>';nav();window.scrollTo(0,0);try{const text=await getText(d);if(current!==route)return;const analysis=analysisCache.get(id)||C.analyze(text,d.name,md);analysisCache.set(id,analysis);d.analysis={...analysis,tokens:undefined,body:undefined};state.doc={...d,text,analysis};state.last=id;persist('last-document',id);docPrefs(id).lastRead=Date.now();persist('doc-state',state.docState);renderReader();nav();requestAnimationFrame(()=>{if(current!==route)return;if(anchor)jumpTo(anchor);else window.scrollTo(0,docPrefs(id).position||0);if(searchTerm && !searchTerm.startsWith('#'))showFind(searchTerm);});}catch(e){if(current!==route)return;content.innerHTML=`<div class="reader-empty empty-card"><strong>Unable to open this copy.</strong>${esc(e.message)}<br><button class="button" data-action="import">Open the original again</button></div>`;toast(e.message);}}
function outlineHtml(){return state.doc?.analysis.headings.length?`<div class="outline-list">${state.doc.analysis.headings.map(h=>`<button class="level-${h.level}" data-action="heading" data-anchor="${esc(h.id)}"><span class="mono muted" style="font-size:9px;margin-right:7px">${h.line.toString().padStart(2,'0')}</span>${esc(h.text)}</button>`).join('')}</div>`:'<p class="panel-body-text">This file has no Markdown headings.</p>';}
function renderReader(){if(!state.doc)return;const d=state.doc,a=d.analysis;content.className='reader-main';content.innerHTML=`<div class="progress-line"><span id="reading-progress"></span></div><div class="reader-toolbar"><button class="reader-back" data-action="library">${icon('arrow-left')}<span>${esc(d.name)}</span></button><div class="reader-actions"><button class="icon-btn" data-action="find" aria-label="Find in this document">${icon('search')}</button><button class="icon-btn mobile-outline-button" data-action="outline" aria-label="Document outline">${icon('list-tree')}</button><button class="icon-btn ${state.source?'accent':''}" data-action="source" aria-label="${state.source?'Read formatted Markdown':'View Markdown source'}" aria-pressed="${state.source}">${icon('code-xml')}</button><button class="icon-btn" data-action="document-graph" aria-label="Graph of this file">${icon('network')}</button><button class="icon-btn" data-action="focus" aria-label="${state.focus?'Leave focus mode':'Enter focus mode'}" aria-pressed="${state.focus}">${icon(state.focus?'minimize-2':'maximize-2')}</button><button class="icon-btn" data-action="more" aria-label="More document tools">${icon('ellipsis')}</button></div></div><div id="find-slot"></div><div class="reader-layout"><div class="document-container"><div class="document-top"><div class="document-meta">${state.source?'<span class="accent">SOURCE VIEW</span>':typefaceTrigger(state.settings.font,esc)}<span>${a.words.toLocaleString()} WORDS</span><span>${Math.max(1,Math.ceil(a.words/230))} MIN READ</span><span>${byteSize(d.bytes)}</span></div>${a.tags.length?`<div class="tags">${a.tags.map(t=>`<button class="tag button-tag" data-action="tag-search" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}</div>`:''}${a.fields.length?`<details class="frontmatter"><summary>Frontmatter · ${a.fields.length} properties</summary><dl>${a.fields.map(f=>`<dt>${esc(f.key)}</dt><dd>${esc(f.value)}</dd>`).join('')}</dl></details>`:''}</div>${state.source?`<div id="markdown" class="source-view">${d.text.split('\n').map((line,n)=>`<div id="line-${n+1}" class="source-line"><span class="source-number">${n+1}</span><span class="source-text">${esc(line)||' '}</span></div>`).join('')}</div>`:'<article id="markdown" class="markdown"></article>'}<div class="document-end"><span>END OF DOCUMENT</span><button class="text-button" data-action="top">Back to top ${icon('arrow-up')}</button></div></div><aside class="reader-outline"><span class="eyebrow mono">ON THIS PAGE / ${a.headings.length}</span>${outlineHtml()}<button class="text-button" data-action="links" style="margin-top:25px">${icon('link-2')}References & backlinks</button></aside></div>`;
 if(!state.source)renderMarkdown();icons();updateProgress();}
function renderMarkdown(){const a=state.doc.analysis;const html=md.renderer.render(a.tokens,md.options,{});const clean=DOMPurify.sanitize(html,{USE_PROFILES:{html:true},FORBID_TAGS:['style','form','input','button','iframe','object','embed','video','audio'],FORBID_ATTR:['style','srcset','action','data-action','data-close','data-id','data-href'],ALLOWED_URI_REGEXP:/^(?:(?:https?|mailto|wiki):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i});$('#markdown').innerHTML=clean;
 $('#markdown').querySelectorAll('img').forEach(img=>{const src=img.getAttribute('data-image-source')||img.getAttribute('src')||'';if(/^data:image\/(png|jpeg|webp|gif);base64,/i.test(src)){img.loading='lazy';return;}const placeholder=document.createElement('span');placeholder.className='image-placeholder';placeholder.textContent=`Image: ${img.alt||src||'embedded image'} · ${/^https?:/.test(src)?'open the reference to view':'relative image needs its companion file'}`;if(/^https?:/.test(src)){const link=document.createElement('a');link.href=src;link.textContent='Open image ↗';placeholder.append(document.createElement('br'),link);}img.replaceWith(placeholder);});
 $('#markdown').querySelectorAll('table').forEach(t=>{const wrap=document.createElement('div');wrap.className='table-wrap';t.replaceWith(wrap);wrap.append(t);});
 $('#markdown').querySelectorAll('pre').forEach(pre=>{const code=pre.querySelector('code');if(!code)return;const label=document.createElement('span');label.className='code-label';label.textContent=(code.className.match(/language-([^ ]+)/)?.[1]||'CODE').toUpperCase();pre.prepend(label);const copy=document.createElement('button');copy.className='code-copy icon-btn';copy.dataset.action='copy-code';copy.setAttribute('aria-label','Copy code block');copy.innerHTML=icon('copy');pre.append(copy);});
 $('#markdown').querySelectorAll('li').forEach(li=>{const el=li.firstElementChild?.tagName==='P'?li.firstElementChild:li;const first=el.firstChild;if(first?.nodeType!==Node.TEXT_NODE)return;const match=first.textContent.match(/^\[([ xX])\]\s+/);if(!match)return;first.textContent=first.textContent.slice(match[0].length);li.classList.add('task-item');const check=document.createElement('span');check.className='task-check';check.textContent=match[1]===' '?'☐':'☑';check.setAttribute('aria-label',match[1]===' '?'Incomplete task':'Completed task');el.prepend(check);});
 $('#markdown').querySelectorAll('blockquote').forEach(b=>{const first=b.querySelector('p');const text=first?.firstChild;if(text?.nodeType!==Node.TEXT_NODE)return;const match=text.textContent.match(/^\[!([\w-]+)\][+-]?\s*/);if(!match)return;text.textContent=text.textContent.slice(match[0].length);b.classList.add('callout');const label=document.createElement('strong');label.className='callout-label';label.textContent=match[1];b.prepend(label);});
 if(!$('#markdown').textContent.trim())$('#markdown').innerHTML='<p class="empty-document">This Markdown file is empty.</p>';
}
function jumpTo(id){
 closePanels();const headings=state.doc?.analysis.headings||[],slug=C.slug(id),heading=headings.find(h=>h.id===id)||headings.find(h=>h.id===slug);let target;
 if(state.source){target=[...$('.source-view').querySelectorAll('[id]')].find(el=>el.id==='line-'+(heading?.line||id));}
 else{const root=$('#markdown');target=[...root.querySelectorAll('[id]')].find(el=>el.id===id)||[...root.querySelectorAll('[id]')].find(el=>el.id===slug);
  // Sanitization can remove a DOM-clobbering ID such as "location"; parsed line metadata survives.
  if(!target&&heading)target=[...root.querySelectorAll('h1,h2,h3,h4,h5,h6')].find(el=>Number(el.dataset.line)===heading.line);
 }
 if(target)target.scrollIntoView({behavior:motion()?'smooth':'auto',block:'start'});else toast('This heading is not present in the document');
}
function motion(){return state.settings.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;}
function showFind(value=''){if(state.view!=='reader'||!state.doc)return;$('#find-slot').innerHTML=`<div class="find-bar"><input id="find-input" placeholder="Find in ${esc(state.doc.name)}" value="${esc(value)}" aria-label="Find in document"><span class="find-count" id="find-count">0 / 0</span><button class="icon-btn" data-action="find-prev" aria-label="Previous match">${icon('chevron-up')}</button><button class="icon-btn" data-action="find-next" aria-label="Next match">${icon('chevron-down')}</button><button class="icon-btn" data-action="find-close" aria-label="Close find">${icon('x')}</button></div>`;icons();$('#find-input').addEventListener('input',e=>{clearTimeout(findTimer);findTimer=setTimeout(()=>findText(e.target.value),100);});$('#find-input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();moveFind(e.shiftKey?-1:1);}if(e.key==='Escape')closeFind();});if(value)findText(value);else $('#find-input').focus();}
function clearMarks(){for(const el of $('#markdown')?.querySelectorAll('mark.find-hit')||[])el.replaceWith(document.createTextNode(el.textContent));$('#markdown')?.normalize();findMarks=[];findAt=-1;}
function closeFind(){clearTimeout(findTimer);clearMarks();if($('#find-slot'))$('#find-slot').innerHTML='';}
function findText(value){clearMarks();const term=value.toLocaleLowerCase();if(!term){if($('#find-count'))$('#find-count').textContent='0 / 0';return;}const root=$('#markdown');const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('.code-label,.code-copy,.source-number,.task-check')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);let count=0;for(const n of nodes){const text=n.textContent,lower=text.toLocaleLowerCase();if(!lower.includes(term))continue;const fragment=document.createDocumentFragment();let start=0,at;while((at=lower.indexOf(term,start))>=0&&count<2000){fragment.append(text.slice(start,at));const mark=document.createElement('mark');mark.className='find-hit';mark.textContent=text.slice(at,at+value.length);fragment.append(mark);findMarks.push(mark);start=at+value.length;count++;}fragment.append(text.slice(start));n.replaceWith(fragment);if(count>=2000)break;}if($('#find-count'))$('#find-count').textContent=findMarks.length?`0 / ${findMarks.length}${count>=2000?'+':''}`:'No matches';if(findMarks.length)moveFind(1);}
function moveFind(delta){if(!findMarks.length)return;findMarks[findAt]?.classList.remove('current');findAt=(findAt+delta+findMarks.length)%findMarks.length;const m=findMarks[findAt];m.classList.add('current');m.scrollIntoView({behavior:motion()?'smooth':'auto',block:'center'});$('#find-count').textContent=`${findAt+1} / ${findMarks.length}${findMarks.length===2000?'+':''}`;}
function updateProgress(){const bar=$('#reading-progress');if(!bar)return;const max=document.documentElement.scrollHeight-innerHeight;bar.style.width=(max>0?Math.min(100,Math.max(0,window.scrollY/max*100)):100)+'%';}
let scrollTick=false;window.addEventListener('scroll',()=>{if(scrollTick)return;scrollTick=true;requestAnimationFrame(()=>{updateProgress();scrollTick=false;});},{passive:true});window.addEventListener('pagehide',savePosition);document.addEventListener('visibilitychange',()=>{if(document.hidden){terminal?.pause();savePosition();graph?.pauseAnimation();}else graph?.resumeAnimation();});setInterval(()=>{if(state.view==='reader'||state.view==='terminal')savePosition();},5000);
async function ensureGraphAnalysis(){const current=route;await Promise.all(state.docs.map(async d=>{if(d.analysis)return;try{const text=await getText(d);const a=C.analyze(text,d.name,md);d.analysis={...a,tokens:undefined,body:undefined};analysisCache.set(d.id,a);}catch{}}));if(current===route&&state.view==='graph')drawGraph();}
function renderGraph(){if(!state.active&&state.docs.length)state.active=state.last&&state.docs.some(d=>d.id===state.last)?state.last:sortedDocs()[0].id;const d=state.docs.find(d=>d.id===state.active);content.className='graph-main';content.innerHTML=boardMarkup({doc:d,docs:sortedDocs(),scope:state.graphScope,filters:state.graphFilters,colors:color,icon,esc});$('#graph-file')?.addEventListener('change',e=>{state.active=e.target.value;resetGraph();renderGraph();nav();icons();});drawGraph();ensureGraphAnalysis();}
function drawGraph(){if(!$('#graph-canvas'))return;const data=C.graphData(state.docs,state.active,state.graphScope,state.graphFilters);let truncated=false; if(data.nodes.length>450){data.nodes=data.nodes.slice(0,450);const ids=new Set(data.nodes.map(n=>n.id));data.links=data.links.filter(l=>ids.has(l.source)&&ids.has(l.target));truncated=true;}
 updateGraphBoard(data,{truncated});
 if(graph){graphNeedsFit=true;graph.graphData(data);return;}
 const container=$('#graph-canvas');graph=new ForceGraph(container).backgroundColor('#00000000').width(container.clientWidth).height(container.clientHeight).graphData(data).nodeId('id').nodeLabel(n=>esc(n.label)).nodeVal(n=>n.type==='document'?6:2).linkColor(l=>mix(l.type==='tag'?color.tag:l.type==='reference'?color.document:color.heading,'#000000',.72)).linkWidth(.7).linkDirectionalParticles(0).autoPauseRedraw(true).nodeCanvasObject((node,ctx,scale)=>{
  const x=node.x,y=node.y;if(!Number.isFinite(x)||!Number.isFinite(y))return;const r=(node.type==='document'?5:node.type==='heading'?2.5:2.6)/scale;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color[node.type];ctx.fill();if(node.type==='document'||state.graphSelected?.id===node.id){ctx.beginPath();ctx.arc(x,y,r+4/scale,0,Math.PI*2);ctx.strokeStyle=color[node.type]+'55';ctx.lineWidth=.6/scale;ctx.stroke();}

 }).onRenderFramePost(paintGraphLabels).nodePointerAreaPaint((n,c,ctx,scale)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(n.x,n.y,18/scale,0,Math.PI*2);ctx.fill();if(n.hitLabel){const b=n.hitLabel;ctx.fillRect(b.x,b.y,b.w,b.h);}}).onNodeClick((n,event)=>selectGraphNode(graphHit(event,n))).onBackgroundClick(event=>{const n=graphHit(event);if(n)selectGraphNode(n);}).onNodeDragEnd(n=>{n.fx=n.x;n.fy=n.y;}).cooldownTicks(motion()?70:30).onEngineStop(()=>{if(graphNeedsFit){graphNeedsFit=false;graph?.zoomToFit(motion()?250:0,graphFitPadding());}});
 graph.d3Force('charge').strength(-85);graph.d3Force('link').distance(50);graphResize=new ResizeObserver(()=>{if(graph&&container.isConnected){graph.width(container.clientWidth).height(container.clientHeight);if(graph.graphData().nodes.length&&graph.graphData().nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)))graph.zoomToFit(0,graphFitPadding());}});graphResize.observe(container);}
function paintGraphLabels(ctx,scale){
 if(!graph)return;const occupied=[],priority={document:0,tag:1,heading:2,link:3};const nodes=[...graph.graphData().nodes].sort((a,b)=>(a.id===state.graphSelected?.id?-1:priority[a.type])-(b.id===state.graphSelected?.id?-1:priority[b.type]));
 ctx.font=`${10/scale}px monospace`;ctx.textBaseline='top';ctx.textAlign='left';
 for(const n of nodes){n.hitLabel=null;if(!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.type==='heading'&&scale<.85)continue;const label=n.label.length>27?n.label.slice(0,26)+'…':n.label;const w=Math.min(ctx.measureText(label).width,145/scale),h=12/scale,gap=10/scale;const choices=[{x:n.x-w/2,y:n.y+gap},{x:n.x-w/2,y:n.y-gap-h},{x:n.x+gap,y:n.y-h/2},{x:n.x-gap-w,y:n.y-h/2}];let box;
 for(const c of choices){const candidate={...c,w,h};const top=graph.graph2ScreenCoords(c.x,c.y),bottom=graph.graph2ScreenCoords(c.x+w,c.y+h);if(top.x<8||top.y<12||bottom.x>graph.width()-8||bottom.y>graph.height()-12)continue;if(occupied.every(o=>candidate.x+candidate.w+4/scale<o.x||candidate.x>o.x+o.w+4/scale||candidate.y+candidate.h+3/scale<o.y||candidate.y>o.y+o.h+3/scale)){box=candidate;break;}}
 if(!box)continue;n.hitLabel=box;occupied.push(box);ctx.fillStyle='#000d';ctx.fillRect(box.x-2/scale,box.y-1/scale,box.w+4/scale,box.h+2/scale);ctx.fillStyle=n.type==='document'?'#e1e9dd':n.type==='tag'?color.tag:mix(color.heading,'#bac9bf',.55);ctx.fillText(label,box.x,box.y,145/scale);
 }
}
// Resolve overlapping touch targets by proximity, then allow taps on the painted label.
function graphHit(event,fallback=null){
 if(!graph||!Number.isFinite(event?.clientX)||!Number.isFinite(event?.clientY))return fallback;
 const rect=$('#graph-canvas').getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top,nodes=graph.graphData().nodes;let nearest=null,distance=18*18;
 for(const n of nodes){if(!Number.isFinite(n.x)||!Number.isFinite(n.y))continue;const p=graph.graph2ScreenCoords(n.x,n.y),d=(p.x-x)**2+(p.y-y)**2;if(d<=distance){nearest=n;distance=d;}}
 if(nearest)return nearest;
 const p=graph.screen2GraphCoords(x,y);return nodes.find(n=>{const b=n.hitLabel;return b&&p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h;})||fallback;
}
function selectGraphNode(n){feedback();if(n.type==='heading'&&n.doc){openDocument(n.doc,n.anchor);return;}state.graphSelected=n;const kind={document:'FILE',heading:'SECTION',tag:'TAG',link:'REFERENCE'}[n.type];$('#graph-selected').innerHTML=`<div><strong>${esc(n.label)}</strong><span class="mono">${kind}${n.type==='link'&&!/^(https?:|mailto:)/.test(n.href)?' · FILE NOT OPENED':''}</span></div><button class="button compact" data-action="graph-open">${icon(n.type==='tag'?'search':'arrow-up-right')}${n.type==='heading'?'Read section':n.type==='tag'?'Search tag':n.type==='document'?'Read file':/^(https?:|mailto:)/.test(n.href)?'Open link':'Open target'}</button>`;icons();}
function openGraphSelection(){const n=state.graphSelected;if(!n)return;if(n.type==='tag')openSearch('#'+n.tag);else if(n.doc)openDocument(n.doc,n.anchor);else if(/^(https?:|mailto:)/.test(n.href))external(n.href);else{toast('Choose the linked Markdown file to follow this reference');openFiles();}}
function openSearch(value=''){terminal?.pause();closePanels();$('#search-input').value=value;$('#search-dialog').showModal();$('.nav-search').setAttribute('aria-expanded','true');$('#search-input').focus();querySearch(value);}
function querySearch(query){if(!query.trim()){$('#search-meta').textContent=indexReady?'FULL-TEXT SEARCH · ON DEVICE':'INDEXING YOUR FILES…';$('#search-results').innerHTML=state.docs.length?sortedDocs().slice(0,6).map(d=>`<button class="search-result" data-action="search-open" data-id="${esc(d.id)}"><strong>${esc(d.analysis?.title||d.name)}</strong><small>${esc(d.name)} · RECENT READ</small></button>`).join(''):'<div class="search-empty">Open a Markdown file to start searching.<br>Try words, a filename, or #tags.</div>';return;}$('#search-meta').textContent=indexReady?'SEARCHING LOCAL INDEX…':'INDEXING YOUR FILES…';searchWorker.postMessage({type:'query',query});}
$('#search-dialog').addEventListener('close',()=>$('.nav-search').setAttribute('aria-expanded',String($('#search-dialog').open)));
$('#search-input').addEventListener('input',e=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>querySearch(e.target.value),130);});
searchWorker.onmessage=({data})=>{
 if(data.type==='progress'){const d=state.docs.find(d=>d.id===data.doc.id);if(d)d.analysis=data.doc.analysis;if($('#search-dialog').open&&!indexReady)$('#search-meta').textContent=`INDEXING ${data.done} / ${data.total} FILES…`;}
 if(data.type==='ready'){indexReady=true;for(const d of data.docs){const match=state.docs.find(v=>v.id===d.id);if(match)match.analysis=d.analysis;}if(state.view==='home'||state.view==='library')render();else if(state.view==='graph')drawGraph();if($('#search-dialog').open)querySearch($('#search-input').value);}
 if(data.type==='results'&&data.query===$('#search-input').value){$('#search-meta').textContent=data.pending?'INDEXING YOUR FILES…':`${data.results.length} MATCH${data.results.length===1?'':'ES'} · ON DEVICE`;$('#search-results').innerHTML=data.pending?'<div class="search-empty">Building your local search index…<br>Your query will run when it’s ready.</div>':data.results.length?data.results.map(r=>`<button class="search-result" data-action="search-open" data-id="${esc(r.id)}"><strong>${esc(r.title)}</strong><small>${esc(r.name)}</small><p>${esc(r.snippet)}</p></button>`).join(''):'<div class="search-empty">No signal found.<br>Try fewer words or search a #tag.</div>';}
 if(data.type==='error')toast('Could not index one file: '+data.message);
};searchWorker.onerror=()=>{toast('Search could not start. Reopen Nightwire to try again.');};
async function indexDocuments(){const generation=++indexGeneration;indexReady=false;let docs=state.docs;if(!native)docs=await Promise.all(docs.map(async d=>({...d,text:(await dbGet(d.id))?.text||''})));if(generation!==indexGeneration)return;searchWorker.postMessage({type:'index',docs});}
function star(id){const p=docPrefs(id);p.starred=!p.starred;persist('doc-state',state.docState);if(state.view==='home'||state.view==='library')render();else if($('#panel-dialog').open)more();toast(p.starred?'Bookmarked for later':'Bookmark removed');}
function readerControls(){const s=state.settings;return `<section class="reader-theme-section" aria-label="Reading themes"><div class="appearance-heading"><span class="eyebrow mono">READING PAGE</span><span class="appearance-count mono">06 STYLES</span></div><div class="reader-theme-preview" aria-label="Reading theme preview"><span class="specimen-caption" id="reader-theme-name">${esc(readerThemes[s.readerTheme].name)}</span><h3>Field notes</h3><p>Keep <strong>useful details</strong>, follow <span class="preview-link">references</span>, and make room for <code>code</code>.</p><blockquote>A note in the margin.</blockquote></div><div class="reader-theme-grid">${Object.entries(readerThemes).map(([id,t])=>`<button class="reader-theme-option" data-action="reader-theme" data-reader-theme="${id}" aria-label="${t.name} reading theme" aria-pressed="${s.readerTheme===id}"><span><strong>${t.name}</strong><span class="theme-ink" aria-hidden="true">${[t.headings[0],t.link,t.bold].map(c=>`<b style="background:${c}"></b>`).join('')}</span></span>${icon('check')}</button>`).join('')}</div><div class="setting-row"><div><strong>Pure black page</strong><small>Use black instead of the theme background.</small></div><button class="toggle ${s.readerBlack?'on':''}" role="switch" aria-checked="${s.readerBlack}" data-action="reader-black" aria-label="Pure black page"><span></span></button></div><p class="theme-note">Styles inspired by Obsidian themes. Your interface accent and type settings stay independent.</p></section>`;}
function syncReaderControls(){const s=state.settings;document.querySelectorAll('[data-word-alignment]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.wordAlignment===s.terminalAlignment));if($('#word-alignment-description'))$('#word-alignment-description').textContent=s.terminalAlignment==='center'?'Each word frame is centred as a whole.':'A steady left edge and baseline. Two words use separate fixed slots.';document.querySelectorAll('button[data-reader-theme]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.readerTheme===s.readerTheme));if($('#reader-theme-name'))$('#reader-theme-name').textContent=readerThemes[s.readerTheme].name;}
function typefaces(){
 openPanel('Typeface rack',fontRackMarkup(state.settings.font,esc,icon),'READING TYPE');
 let category='all';
 const filter=()=>{const query=$('#font-rack-search').value.trim().toLowerCase();let visible=0;document.querySelectorAll('.font-option').forEach(el=>{const font=readingFonts[el.dataset.font];el.hidden=!(category==='all'||font.group===category||category==='accessible'&&font.accessible)||!(font.name+' '+font.description).toLowerCase().includes(query);if(!el.hidden)visible++;});$('#font-rack-empty').hidden=visible>0;};
 $('#font-rack-search').addEventListener('input',filter);
 document.querySelectorAll('[data-font-group]').forEach(el=>el.addEventListener('click',()=>{category=el.dataset.fontGroup;document.querySelectorAll('[data-font-group]').forEach(button=>button.setAttribute('aria-pressed',button===el));feedback();filter();}));
 applyReadingFont(state.settings);
}
function preferences(){const s=state.settings;openPanel('Appearance',`
${readerControls()}
<div class="setting-row"><div><strong>Read tab style</strong><small>Index follows Reading page colours. Nightwire uses your interface accent.</small></div><select id="setting-terminalStyle" aria-label="Read tab style">${readStyles.map(style=>`<option value="${style.id}">${style.name}</option>`).join('')}</select></div>${stylePicker()}
<section class="word-alignment-setting" aria-label="Word alignment"><span class="field-label">WORD ALIGNMENT</span><div class="segmented word-alignment-options" role="group" aria-label="Word alignment choices"><button data-action="word-alignment" data-word-alignment="fixed" aria-label="Fixed word origin" aria-pressed="${s.terminalAlignment==='fixed'}">${icon('align-left')}Fixed</button><button data-action="word-alignment" data-word-alignment="center" aria-label="Centred word frame" aria-pressed="${s.terminalAlignment==='center'}">${icon('align-center')}Centred</button></div><p class="theme-note" id="word-alignment-description"></p></section>
${state.view==='terminal'?`<button class="panel-link" data-action="terminal-blackout">${icon('moon')}<span>Blackout reading<small style="display:block;margin-top:5px">Only words. Tap the screen to pause and return.</small></span>${icon('arrow-up-right')}</button>`:''}
<span class="eyebrow mono preferences-label">READING TYPE</span>
<div class="setting-row"><div><strong>Text size</strong><small>13–26 px.</small></div><div class="stepper"><button class="icon-btn" data-action="font-down" aria-label="Decrease text size">${icon('minus')}</button><span id="font-value">${s.fontSize}</span><button class="icon-btn" data-action="font-up" aria-label="Increase text size">${icon('plus')}</button></div></div>
<div class="setting-row"><div><strong>Reading typeface</strong><small>Shared by Page and Read, across every theme.</small></div><select id="setting-font" aria-label="Reading typeface">${Object.entries(readingFonts).map(([id,f])=>`<option value="${id}">${f.name}</option>`).join('')}</select></div><div id="font-preview" class="type-preview" aria-label="Reading font preview"><div class="type-preview-caption"><strong id="reading-font-name">${readingFonts[s.font].name}</strong><small id="reading-font-description">${readingFonts[s.font].description}</small></div><p>The quick <em>brown fox</em> jumps over the <strong>lazy dog</strong>.</p><span class="type-glyphs">Il1 · O0 · Aa Bb Gg · 0123456789</span></div><div class="setting-row"><div><strong>Line spacing</strong><small>Space between lines.</small></div><select id="setting-leading" aria-label="Line spacing"><option value="1.6">Compact</option><option value="1.85">Balanced</option><option value="2.1">Spacious</option></select></div>

<section class="appearance-section" aria-label="Colour palettes">
 <div class="appearance-heading"><span class="eyebrow mono">INTERFACE ACCENT</span><span class="appearance-count mono">08 + CUSTOM</span></div>
 <div class="palette-preview"><div class="preview-wordmark">N<span>_</span></div><div class="preview-copy"><strong id="palette-name">${esc(palette().name)}</strong><span id="palette-caption" class="mono">${s.intensity.toUpperCase()} / TRUE BLACK</span></div><div class="preview-signals" aria-hidden="true"><b></b><b></b><b></b></div></div>
 <div class="palette-grid">${Object.entries(palettes).map(([id,p])=>`<button class="palette-option" data-action="palette" data-palette="${id}" aria-label="${p.name} palette" aria-pressed="${s.accent===id}"><span class="palette-dots" aria-hidden="true"><b style="background:${p.accent}"></b><b style="background:${p.secondary}"></b><b style="background:${p.tertiary}"></b></span><span>${p.name}</span>${icon('check')}</button>`).join('')}</div>
 <div class="custom-accent"><div class="custom-heading"><button class="custom-preset" data-action="palette" data-palette="custom" aria-label="Custom accent palette" aria-pressed="${s.accent==='custom'}">${icon('pipette')}<span>Custom accent</span>${icon('check')}</button><input id="custom-hex" value="${esc(s.customColor.toUpperCase())}" aria-label="Custom accent hex colour" maxlength="7" inputmode="text" spellcheck="false" autocomplete="off"></div><label class="hue-label" for="accent-hue">Pick your hue<span class="mono">0° — 359°</span></label><input id="accent-hue" class="hue-slider" type="range" min="0" max="359" value="${hueOf(s.customColor)}" aria-label="Custom accent hue"><small>Readable colour against true black.</small></div>
 <div class="intensity-setting"><span class="field-label">COLOUR INTENSITY</span><div class="segmented intensity-options" aria-label="Colour intensity">${[['quiet','Low-key'],['balanced','Balanced'],['vivid','Vivid']].map(([id,name])=>`<button data-action="intensity" data-intensity="${id}" aria-pressed="${s.intensity===id}">${name}</button>`).join('')}</div></div>
</section>
<span class="eyebrow mono preferences-label">TOUCH & VISIBILITY</span>
<div class="setting-row"><div><strong>Touch feedback</strong><small>A soft haptic click on your phone.</small></div><button class="toggle ${s.haptics?'on':''}" role="switch" aria-checked="${s.haptics}" data-action="haptics" aria-label="Touch feedback"><span></span></button></div><div class="setting-row"><div><strong>Higher contrast</strong><small>Brighter labels and secondary text.</small></div><button class="toggle ${s.contrast?'on':''}" role="switch" aria-checked="${s.contrast}" data-action="contrast" aria-label="Higher contrast"><span></span></button></div><div class="setting-row"><div><strong>Motion</strong><small>Press effects and gentle navigation.</small></div><button class="toggle ${s.motion?'on':''}" role="switch" aria-checked="${s.motion}" data-action="motion" aria-label="Motion"><span></span></button></div><p class="settings-note">Your colours and reading preferences stay on this device.</p><button class="panel-link" data-action="licenses">${icon('heart-handshake')}<span>Open-source libraries & licenses</span>${icon('chevron-right')}</button>`,'READING PREFERENCES');
 const syncReadStyles=()=>{document.querySelectorAll('[data-read-style]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.readStyle===state.settings.terminalStyle));$('#setting-terminalStyle').value=state.settings.terminalStyle;};
 document.querySelectorAll('[data-read-style]').forEach(b=>b.addEventListener('click',()=>{state.settings.terminalStyle=b.dataset.readStyle;feedback();applySettings();syncReadStyles();}));syncReadStyles();
 $('#setting-terminalStyle').addEventListener('change',()=>queueMicrotask(syncReadStyles));
 for(const key of ['font','leading','terminalStyle']){$('#setting-'+key).value=s[key];$('#setting-'+key).addEventListener('change',e=>{state.settings[key]=e.target.value;feedback();applySettings();});}
 const commitCustom=e=>{const input=e.target.value.trim();if(!/^#?[a-f0-9]{6}$/i.test(input)){e.target.setAttribute('aria-invalid','true');toast('Use a six-digit colour, like #91B7FF');return;}e.target.removeAttribute('aria-invalid');state.settings.customColor=readableAccent(input.startsWith('#')?input:'#'+input);state.settings.accent='custom';feedback();applySettings();e.target.value=state.settings.customColor.toUpperCase();};$('#custom-hex').addEventListener('change',commitCustom);
 $('#custom-hex').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commitCustom(e);e.target.blur();}});
 $('#accent-hue').addEventListener('input',e=>{state.settings.customColor=readableAccent(hueColor(Number(e.target.value)));state.settings.accent='custom';applySettings();});$('#accent-hue').addEventListener('change',()=>feedback());syncReaderControls();syncAppearanceControls();
}

function more(){const d=state.doc;if(!d)return;openPanel('Tools for this read.',`<p class="reader-menu-caption">${esc(d.name)}</p><div class="reader-more"><button class="panel-link" data-action="document-terminal">${icon('scan-line')}<span>Terminal reading</span></button><button class="panel-link" data-action="star" data-id="${esc(d.id)}">${icon('bookmark')}<span>${docPrefs(d.id).starred?'Remove bookmark':'Bookmark this file'}</span></button><button class="panel-link" data-action="outline">${icon('list-tree')}<span>Jump to a heading</span><small>${d.analysis.headings.length}</small></button><button class="panel-link" data-action="links">${icon('link-2')}<span>References & backlinks</span><small>${d.analysis.links.length}</small></button><button class="panel-link" data-action="source">${icon('code-xml')}<span>${state.source?'Read formatted document':'Inspect Markdown source'}</span></button><button class="panel-link" data-action="export">${icon('download')}<span>Export Markdown copy</span></button><button class="panel-link" data-action="export-analysis">${icon('braces')}<span>Export analysis JSON</span></button><button class="panel-link" data-action="copy-document">${icon('copy')}<span>Copy Markdown text</span></button><button class="panel-link" data-action="remove">${icon('trash-2')}<span>Remove from recent files</span></button></div>`);}
function references(){const d=state.doc;if(!d)return;const outgoing=d.analysis.links;const incoming=state.docs.filter(v=>v.id!==d.id&&v.analysis?.links.some(l=>C.resolveLink(l.href,state.docs)?.id===d.id));openPanel('Follow a reference.',`<span class="eyebrow mono">OUTGOING / ${outgoing.length}</span>${outgoing.length?outgoing.map(l=>`<button class="panel-link" data-action="follow-link" data-href="${esc(l.href)}">${icon(l.href.startsWith('#')?'hash':'arrow-up-right')}<span>${esc(l.label)}<small style="display:block;margin-top:5px">${esc(l.href)}</small></span></button>`).join(''):'<p class="panel-body-text">No links in this document.</p>'}<span class="eyebrow mono" style="margin-top:27px">BACKLINKS / ${incoming.length}</span>${incoming.length?incoming.map(v=>`<button class="panel-link" data-action="document" data-id="${esc(v.id)}">${icon('corner-down-right')}<span>${esc(v.analysis.title)}</span></button>`).join(''):'<p class="panel-body-text">Other opened files that link here will appear in this list.</p>'}`);}
function followLink(href){closePanels();if(href.startsWith('#')||href.startsWith('wiki:#')){try{jumpTo(decodeURIComponent(href.replace(/^wiki:/,'').slice(1)));}catch{toast('Invalid heading reference');}return;}if(/^(https?:|mailto:)/i.test(href)){external(href);return;}const d=C.resolveLink(href,state.docs);if(d){const part=href.split('#')[1];let anchor;try{anchor=part?decodeURIComponent(part):null;}catch{anchor=null;}openDocument(d.id,anchor);}else{toast('Open the linked Markdown file to follow this reference');openFiles();}}
function external(href){if(native)Native.external(href);else if(/^https?:|^mailto:/i.test(href))window.open(href,'_blank','noopener,noreferrer');}
async function copy(text){try{if(native)Native.copy(text);else if(navigator.clipboard)await navigator.clipboard.writeText(text);else{const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();document.execCommand('copy');t.remove();}toast('Copied to clipboard');}catch{toast('Clipboard unavailable');}}
function pastePanel(){openPanel('Bring in a fragment.',`<label class="field-label" for="paste-name">FILENAME</label><input id="paste-name" class="paste-name" value="Untitled.md"><label class="field-label" for="paste-body">MARKDOWN OR PLAIN TEXT</label><textarea id="paste-body" class="paste-body" placeholder="# An idea worth keeping…"></textarea><div class="panel-actions"><button class="button" data-close>Cancel</button><button class="button primary" data-action="save-paste">${icon('arrow-up-right')}Open text</button></div>`,'OPEN WITHOUT A FILE');$('#paste-body').focus();}
function openFiles(){terminal?.pause();if(native)Native.openFiles();else $('#file-input').click();}
function busy(on){$('#busy-indicator')?.remove();if(on){const b=document.createElement('div');b.id='busy-indicator';b.className='busy-indicator';b.setAttribute('role','status');b.setAttribute('aria-label','Importing files');document.body.append(b);}}
async function initDB(){return await new Promise((resolve,reject)=>{const req=indexedDB.open('nightwire',1);req.onupgradeneeded=()=>req.result.createObjectStore('documents',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function dbGet(id){return new Promise((resolve,reject)=>{const req=database.transaction('documents').objectStore('documents').get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function dbAll(){return new Promise((resolve,reject)=>{const req=database.transaction('documents').objectStore('documents').getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function dbWrite(operation,value){return new Promise((resolve,reject)=>{const tx=database.transaction('documents','readwrite');const store=tx.objectStore('documents');operation==='delete'?store.delete(value):store.put(value);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
async function contentId(name,text){const bytes=new TextEncoder().encode(name+'\0'+text);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function addText(name,text){if(text.includes('\0'))throw Error('This looks like a binary file. Choose Markdown or plain text.');if(new TextEncoder().encode(text).length>8*1024*1024)throw Error('File is too large (8 MB maximum).');if(native){Native.addText(name,text);return;}const id=await contentId(name,text);const bytes=new TextEncoder().encode(text).length;if(!state.docs.some(d=>d.id===id)&&state.docs.reduce((n,d)=>n+d.bytes,0)+bytes>32*1024*1024)throw Error('Recent files reached 32 MB. Remove a stored copy to make room.');await dbWrite('put',{id,name,text,bytes,imported:Date.now()});await receiveLibrary({docs:(await dbAll()).map(({text,...d})=>d),active:id});}
async function importBrowser(files){busy(true);let last;try{for(const f of files){if(f.size>8*1024*1024){toast('File is too large (8 MB maximum): '+f.name);continue;}try{const bytes=new Uint8Array(await f.arrayBuffer());const utf16=bytes.length>1&&((bytes[0]===255&&bytes[1]===254)||(bytes[0]===254&&bytes[1]===255));const text=new TextDecoder(utf16?(bytes[0]===255?'utf-16le':'utf-16be'):'utf-8',{fatal:true}).decode(bytes);await addText(f.name,text);last=state.active;}catch(e){toast(e.message||'Could not open '+f.name);}}}finally{busy(false);}}
$('#file-input').addEventListener('change',async e=>{await importBrowser([...e.target.files]);e.target.value='';});
window.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();document.body.classList.add('dragging');}});window.addEventListener('dragleave',e=>{if(!e.relatedTarget)document.body.classList.remove('dragging');});window.addEventListener('drop',e=>{if(e.dataTransfer.files.length){e.preventDefault();document.body.classList.remove('dragging');importBrowser([...e.dataTransfer.files]);}});
async function receiveLibrary({docs,active}){const removed=state.docs.filter(d=>!docs.some(v=>v.id===d.id));for(const d of removed){bodyCache.delete(d.id);analysisCache.delete(d.id);delete state.docState[d.id];}persist('doc-state',state.docState);state.docs=docs.map(d=>({...d,analysis:state.docs.find(v=>v.id===d.id)?.analysis}));indexDocuments();if(active){closePanels();await openDocument(active);}else if(['reader','terminal'].includes(state.view)&&!state.docs.some(d=>d.id===state.active)){state.doc=null;state.active=null;navigate('library');}else if(state.view!=='reader'){resetGraph();render();}else nav();}
async function removeCurrent(){const id=state.active;closePanels();if(native)Native.remove(id);else{await dbWrite('delete',id);await receiveLibrary({docs:(await dbAll()).map(({text,...d})=>d)});}toast('Reading copy removed');}
function confirmRemove(){openPanel('Remove this reading copy?',`<p class="panel-body-text">${esc(state.doc.name)} will disappear from Nightwire’s recent files, along with its bookmark and reading position. The original file stays in its current location.</p><div class="panel-actions"><button class="button" data-close>Keep file</button><button class="button danger" data-action="confirm-remove">Remove copy</button></div>`);}
function exportCurrent(){closePanels();const d=state.doc;if(native){Native.export(d.id,d.name);return;}const url=URL.createObjectURL(new Blob([d.text],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=d.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
async function exportAnalysis(){const input=await Nightwire.classifierInput();const name=input.name.replace(/\.(md|markdown|txt)$/i,'')+'.analysis.json';const text=JSON.stringify(input,null,2);closePanels();if(native){Native.exportStructured(name,text);return;}const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
const samples=[{name:'Field notes.md',text:`---
title: Field notes
tags: [ideas, cyberdeck, reading]
status: collecting
---
# Field notes

Small observations. Long connections.

A good reading space makes it easy to **follow your curiosity**. It stays quiet around the words and gets out of the way when you want to explore.

> [!NOTE]
> This is a sample document. Open your own Markdown from Downloads whenever you’re ready.

## Find the signal

Start with a question. Skim the headings. Then follow the threads that feel useful.

- Search a phrase across every file you’ve opened.
- Use the outline to jump straight into the middle.
- Tap a node in the graph to land back on a section.

Connect this idea to [[Reading systems]] or follow the [[Signal protocol|signal protocol]].

## Keep a small trail

- [x] Open a loose Markdown file
- [x] Look at its structure in graph view
- [ ] Bookmark something worth revisiting

### A note on attention

Reading isn’t a race. Leave yourself a little room between the paragraphs.

## Tools for wandering

| Tool | Use it for |
| --- | --- |
| Search | Finding a phrase or a forgotten filename |
| Outline | Skimming the structure of a long document |
| Graph | Exploring headings, tags, and explicit references |
| Source | Inspecting the original Markdown |

## A tiny example

\`\`\`typescript
interface Signal {
  source: string;
  tags: string[];
  confidence: number;
}

const note: Signal = {
  source: "field-notes.md",
  tags: ["ideas", "reading"],
  confidence: 0.94
};
\`\`\`

## Further reading

This file shares #ideas and #reading with the other samples. Those tags become connections when you switch the graph to **All files**.

[Markdown syntax](https://commonmark.org/help/) · [Back to the signal](#find-the-signal)
`},{name:'Signal protocol.md',text:`---
tags:
  - ideas
  - cyberdeck
---
# Signal protocol

Keep the data simple. Keep the interface quiet.

## Open first

A file should open the moment you ask it to. There is no need to organize a vault before reading one downloaded note.

## Connect deliberately

Explicit links such as [[Field notes]] carry a clear relationship. Shared #ideas create another path through the same collection.

### Preserve the source

Formatting changes the reading experience. The Markdown stays intact.

## Revisit

Bookmark the useful bits and return to your last position. See [[Reading systems]] for a slower approach.
`},{name:'Reading systems.md',text:`---
tags: [ideas, reading]
---
# Reading systems

An open question is a good place to start.

## Skim

Headings give you the shape of a text before you read its details.

## Follow

Reference links connect a document to the rest of your reading. [[Field notes]] is a good example.

## Pause

True black, careful spacing, and a quiet typeface make a useful night reading setup.

### A small ritual

1. Open a note.
2. Find one useful idea.
3. Follow its references.
4. Bookmark the document.

## Return

Come back to the place you left off. Keep #reading at your own pace.
`}];
async function loadSamples(){closePanels();busy(true);try{for(const d of samples)await addText(d.name,d.text);toast('Three sample files added. Try All files in the graph.');}catch(e){toast(e.message);}finally{busy(false);}}
async function licenses(){const r=await fetch('THIRD_PARTY_LICENSES.txt');openPanel('Built on open source.',`<p class="panel-body-text">Markdown-it · DOMPurify · MiniSearch · force-graph · highlight.js · Lucide · Anime.js</p><pre class="license-text">${esc(await r.text())}</pre>`,'CREDITS & LICENSES');}
const actions={
 'reader-theme':b=>{state.settings.readerTheme=b.dataset.readerTheme;applySettings();},'reader-black':b=>{state.settings.readerBlack=!state.settings.readerBlack;applySettings();b.classList.toggle('on',state.settings.readerBlack);b.setAttribute('aria-checked',state.settings.readerBlack);},
 'desk-heading':b=>openDocument(b.dataset.id,b.dataset.anchor),'desk-graph':b=>{state.active=b.dataset.id;state.graphScope='document';navigate('graph');},
 palette:b=>{state.settings.accent=b.dataset.palette;applySettings();},intensity:b=>{state.settings.intensity=b.dataset.intensity;applySettings();},haptics:b=>{state.settings.haptics=!state.settings.haptics;applySettings();b.classList.toggle('on',state.settings.haptics);b.setAttribute('aria-checked',state.settings.haptics);if(state.settings.haptics)feedback('confirm');},
 'word-alignment':b=>{state.settings.terminalAlignment=b.dataset.wordAlignment;applySettings();},typefaces,'choose-font':b=>{state.settings.font=b.dataset.font;applySettings();},'terminal-blackout':()=>{closePanels();terminal?.enterBlackout();},'terminal-open':b=>{closePanels();stopTerminal();renderTerminal(b.dataset.id);},terminal:()=>navigate('terminal'),'document-terminal':()=>{closePanels();navigate('terminal');},home:()=>navigate('home'), library:()=>{state.filter='';navigate('library');}, starred:()=>{navigate('library');state.starredOnly=true;library();nav();icons();}, import:openFiles,paste:pastePanel,sample:loadSamples,search:()=>openSearch(),settings:preferences,
 document:b=>{closePanels();openDocument(b.dataset.id);}, 'search-open':b=>{const q=$('#search-input').value;closePanels();openDocument(b.dataset.id,null,q);},'tag-search':b=>openSearch('#'+b.dataset.tag), star:b=>star(b.dataset.id),graph:()=>navigate('graph'),'document-graph':()=>{state.graphScope='document';navigate('graph');},'graph-scope':b=>{state.graphScope=b.dataset.scope;resetGraph();renderGraph();icons();},'graph-filter':b=>{state.graphFilters[b.dataset.filter]=!state.graphFilters[b.dataset.filter];resetGraph();renderGraph();icons();},'graph-in':()=>{if(graph)graph.zoom(graph.zoom()*1.3,motion()?200:0);},'graph-out':()=>{if(graph)graph.zoom(graph.zoom()/1.3,motion()?200:0);},'graph-fit':()=>graph?.zoomToFit(motion()?300:0,graphFitPadding()),'graph-open':openGraphSelection,
 outline:()=>openPanel('Jump into the page.',outlineHtml(),'DOCUMENT OUTLINE'),heading:b=>jumpTo(b.dataset.anchor),links:references,'follow-link':b=>followLink(b.dataset.href),find:()=>showFind(), 'find-prev':()=>moveFind(-1),'find-next':()=>moveFind(1),'find-close':closeFind,
 source:()=>{closePanels();savePosition();state.source=!state.source;renderReader();window.scrollTo(0,docPrefs(state.active)[state.source?'rawPosition':'position']||0);},focus:()=>{state.focus=!state.focus;document.body.classList.toggle('focus-mode',state.focus);const b=document.querySelector('[data-action="focus"]');b.innerHTML=icon(state.focus?'minimize-2':'maximize-2');b.setAttribute('aria-label',state.focus?'Leave focus mode':'Enter focus mode');b.setAttribute('aria-pressed',state.focus);icons();updateProgress();},more,'copy-code':b=>copy(b.closest('pre').querySelector('code').textContent),'copy-document':()=>copy(state.doc.text),export:exportCurrent,'export-analysis':exportAnalysis,remove:confirmRemove,'confirm-remove':removeCurrent,top:()=>window.scrollTo({top:0,behavior:motion()?'smooth':'auto'}),licenses,
 'font-up':()=>{state.settings.fontSize=Math.min(26,state.settings.fontSize+1);applySettings();$('#font-value').textContent=state.settings.fontSize;},'font-down':()=>{state.settings.fontSize=Math.max(13,state.settings.fontSize-1);applySettings();$('#font-value').textContent=state.settings.fontSize;},contrast:b=>{state.settings.contrast=!state.settings.contrast;applySettings();b.classList.toggle('on',state.settings.contrast);b.setAttribute('aria-checked',state.settings.contrast);},motion:b=>{state.settings.motion=!state.settings.motion;applySettings();b.classList.toggle('on',state.settings.motion);b.setAttribute('aria-checked',state.settings.motion);},'save-paste':async()=>{let name=$('#paste-name').value.trim()||'Untitled.md';if(!/\.(md|markdown|txt)$/i.test(name))name+='.md';const text=$('#paste-body').value;if(!text.trim()){toast('Paste some text first');return;}try{await addText(name,text);closePanels();}catch(e){toast(e.message);}}
};
document.addEventListener('click',e=>{const closer=e.target.closest('[data-close]');if(closer){feedback();closer.closest('dialog')?.close();return;}const b=e.target.closest('[data-action]');if(b){e.preventDefault();if(b.matches(':disabled')||b.getAttribute('aria-disabled')==='true')return;feedback(['star','save-paste','palette','reader-theme'].includes(b.dataset.action)?'confirm':'selection');if(e.detail===0)pressWave(b);const action=actions[b.dataset.action];if(action){try{Promise.resolve(action(b)).catch(err=>toast(err.message));}catch(err){toast(err.message);}}return;}const a=e.target.closest('#markdown a');if(a){e.preventDefault();feedback();followLink(a.getAttribute('href')||'');return;}if(e.target.closest('summary'))feedback();});
document.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;const el=tactile(e.target);if(!el)return;releasePress();const r=el.getBoundingClientRect();press={el,id:e.pointerId,x:e.clientX,y:e.clientY};el.classList.add('is-pressed');pressWave(el,e.clientX-r.left,e.clientY-r.top);});
document.addEventListener('pointermove',e=>{if(press&&e.pointerId===press.id&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>12)releasePress();},{passive:true});
for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,releasePress);window.addEventListener('blur',releasePress);document.addEventListener('scroll',releasePress,{passive:true,capture:true});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"][data-action]')){e.preventDefault();e.target.click();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'&&state.view==='reader'){e.preventDefault();showFind();}if(e.key==='Escape'&&state.focus&&!document.querySelector('dialog[open]'))actions.focus();});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
window.addEventListener('native-library',e=>receiveLibrary(e.detail));window.addEventListener('native-error',e=>toast(e.detail));window.addEventListener('native-message',e=>toast(e.detail));window.addEventListener('native-busy',e=>busy(e.detail));
window.Nightwire={savePosition,pauseReading:()=>terminal?.pause(),back(){if(terminal?.exitBlackout())return true;if(document.querySelector('dialog[open]')){closePanels();return true;}if($('#find-input')){closeFind();return true;}if(state.focus){actions.focus();return true;}if(state.view==='reader'){navigate('library');return true;}if(state.view==='graph'&&state.doc&&state.docs.some(d=>d.id===state.doc.id)){openDocument(state.doc.id);return true;}if(state.view!=='home'){navigate('home');return true;}return false;},classifiers:new ClassifierRegistry(),async classifierInput(id=state.active){const d=state.docs.find(v=>v.id===id);if(!d)throw Error('Choose a document first');const text=await getText(d),a=C.analyze(text,d.name,md);const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));const hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');return {schemaVersion:1,documentId:d.id,contentRevision:hash,name:d.name,title:a.title,text,headings:a.headings,tags:a.tags};}};
applySettings();render();
if(native)Native.list();else try{database=await initDB();await receiveLibrary({docs:(await dbAll()).map(({text,...d})=>d)});}catch(e){toast('Local storage is unavailable: '+e.message);}
