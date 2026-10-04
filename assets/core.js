/* Shared extraction for the renderer, search worker and classifier adapters. */
(function(root) {
 'use strict';
 const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const slug = value => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu,'').trim().replace(/\s+/g,'-') || 'section';
 function parser() {
  const md = root.markdownit({html:true,linkify:true,typographer:false});
  md.inline.ruler.before('link','wikilink',(state,silent) => {
   if (state.src.slice(state.pos,state.pos+2) !== '[[') return false;
   const end = state.src.indexOf(']]',state.pos+2); if(end < 0) return false;
   const value = state.src.slice(state.pos+2,end); if(value.includes('\n') || !value.trim()) return false;
   if(!silent) { const [target,...alias] = value.split('|'); const open = state.push('link_open','a',1); open.attrSet('href','wiki:'+target.trim().split('#').map(encodeURIComponent).join('#')); const text = state.push('text','',0); text.content = alias.join('|') || target; state.push('link_close','a',-1); }
   state.pos = end+2; return true;
  });
  return md;
 }
 function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if(!match) return {body:source,fields:[],offset:0,tags:[]};
  const fields = [], tags = [];
  let tagList = false;
  for(const line of match[1].split(/\r?\n/)) {
   const pair = line.match(/^([\w-]+):\s*(.*)$/);
   if(pair) { fields.push({key:pair[1],value:pair[2].replace(/^['"]|['"]$/g,'')}); tagList = pair[1] === 'tags'; if(tagList) tags.push(...pair[2].replace(/[\[\]'"#]/g,'').split(/[,\s]+/).filter(Boolean)); }
   else if(tagList && /^\s+-\s+/.test(line)) tags.push(line.replace(/^\s+-\s+/, '').replace(/^['"]|['"]$/g,''));
  }
  return {body:source.slice(match[0].length), fields, offset:match[0].split('\n').length-1,tags};
 }
 // The first top-level paragraph as plain text, cut at a word boundary to at most 240 characters.
 function lede(tokens) {
  const at = tokens.findIndex(t => t.type === 'paragraph_open' && t.level === 0), open = at >= 0 ? at : tokens.findIndex(t => t.type === 'paragraph_open');
  if(open < 0) return '';
  const text = (tokens[open+1]?.children || []).map(c => c.type === 'text' || c.type === 'code_inline' ? c.content : c.type === 'softbreak' || c.type === 'hardbreak' ? ' ' : '').join('').replace(/\s+/g,' ').trim();
  if(text.length <= 240) return text;
  const cut = text.slice(0,239), space = cut.lastIndexOf(' ');
  return (space > 160 ? cut.slice(0,space) : cut).replace(/[\s,;:.–—-]+$/,'') + '…';
 }
 function analyze(source,name,md = parser()) {
  const fm = frontmatter(source), tokens = md.parse(fm.body,{}), headings = [], links = [], texts = [], tags = new Set(fm.tags), used = new Map();
  for(let n=0;n<tokens.length;n++) {
   const t = tokens[n];
   if(t.type === 'heading_open') {
    const inline = tokens[n+1]; const text = inline.content.replace(/[*`]/g,''); const base = slug(text); const num = used.get(base) || 0; used.set(base,num+1); const id = num ? `${base}-${num}` : base;
    t.attrSet('id',id); headings.push({id,text,level:Number(t.tag.slice(1)),line:(t.map?.[0] || 0)+fm.offset+1});
   }
   if(t.map && t.nesting !== -1) t.attrSet('data-line',String(t.map[0]+fm.offset+1));
   if(t.type === 'inline') for(const child of t.children || []) {
    if(child.type === 'text' || child.type === 'code_inline') { texts.push(child.content); if(child.type === 'text') for(const match of child.content.matchAll(/(?:^|\s)#([\p{L}\p{N}_/-]+)/gu)) tags.add(match[1]); }
    if(child.type === 'link_open') { const href=child.attrGet('href'); const next = t.children[t.children.indexOf(child)+1]; links.push({href,label:next?.content || href}); }
   }
   if(t.type === 'fence' || t.type === 'code_block') texts.push(t.content);
  }
  const body = texts.join('\n');
  const title = headings.find(h=>h.level===1)?.text || fm.fields.find(f=>f.key==='title')?.value || name.replace(/\.(md|markdown|txt)$/i,'');
  return {title,headings,links,tags:[...tags],fields:fm.fields,body,tokens,words:body.trim().split(/\s+/).filter(Boolean).length,lede:lede(tokens),lines:source.replace(/\r?\n$/,'').split(/\r?\n/).length};
 }
 function normalizeTarget(href) { try { return decodeURIComponent(href.replace(/^wiki:/,'')).split('#')[0].split('/').pop().replace(/\.(md|markdown|txt)$/i,'').normalize('NFKC').toLowerCase(); } catch { return ''; } }
 function resolveLink(href,docs) {
  if(!href || /^(https?:|mailto:|#)/i.test(href)) return null;
  const target = normalizeTarget(href), matches = docs.filter(d => [d.name.replace(/\.(md|markdown|txt)$/i,''),d.analysis?.title].filter(Boolean).some(v=>v.normalize('NFKC').toLowerCase()===target));
  return matches.length===1 ? matches[0] : null;
 }
 function graphData(docs, active, scope='document', filters={headings:true,tags:true,links:true}) {
  const selected = scope==='all' ? docs : docs.filter(d=>d.id===active), nodes=[],links=[], ids=new Set(), edgeIds=new Set();
  const add = node => {if(!ids.has(node.id)) {ids.add(node.id);nodes.push(node);}};
  const edge = (source,target,type) => {const key=source+'>'+target;if(!edgeIds.has(key)){edgeIds.add(key);links.push({source,target,type});}};
  for(const doc of selected) {
   add({id:doc.id,label:doc.analysis?.title || doc.name,type:'document',doc:doc.id});
   const a = doc.analysis;if(!a) continue;
   if(filters.headings) {const stack=[];for(const h of a.headings) {if(h.level===1&&h.text===a.title)continue;const id=doc.id+'#'+h.id;add({id,label:h.text,type:'heading',doc:doc.id,anchor:h.id});while(stack.length && stack.at(-1).level>=h.level)stack.pop();edge(stack.at(-1)?.id || doc.id,id,'structure');stack.push({id,level:h.level});}}
   if(filters.tags) for(const tag of a.tags) { const id='tag:'+tag;add({id,label:'#'+tag,type:'tag',tag});edge(doc.id,id,'tag'); }
   if(filters.links) for(const link of a.links) {
    if(link.href.startsWith('#')) {const id=doc.id+link.href;if(ids.has(id))edge(doc.id,id,'reference');continue;}
    const resolved=resolveLink(link.href,docs);const id=resolved?.id || 'link:'+link.href;
    add({id,label:resolved?.analysis?.title || resolved?.name || link.label,type:resolved?'document':'link',doc:resolved?.id,href:link.href});edge(doc.id,id,'reference');
   }
  }
  return {nodes,links};
 }
 const api = {escape,slug,parser,analyze,frontmatter,resolveLink,graphData};
 root.NightwireCore = api; if(typeof module !== 'undefined') module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis);
