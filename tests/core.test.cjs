const test=require('node:test'),assert=require('node:assert/strict');
globalThis.markdownit=require('markdown-it');
const C=require('../assets/core.js');
test('headings, Unicode slugs, duplicate headings, frontmatter line offsets',()=>{
 const a=C.analyze('---\ntags: [night, reading]\n---\n# A file\n\n## Café & 日本\n\n## Café & 日本\n','a.md');
 assert.equal(a.title,'A file');assert.deepEqual(a.tags,['night','reading']);assert.equal(a.headings[0].line,4);assert.equal(a.headings[1].id,'café-日本');assert.equal(a.headings[2].id,'café-日本-1');
});
test('Markdown parser omits headings and tags inside code blocks from structure',()=>{
 const a=C.analyze('# Title\n```md\n# fake\n#not-a-tag\n```\nA #real-tag. `#inline-code`\n','a.md');
 assert.equal(a.headings.length,1);assert.deepEqual(a.tags,['real-tag']);
});
test('wikilinks support aliases and resolve case-insensitive Markdown targets',()=>{
 const a=C.analyze('# File\n[[Other file.md#section|An alias]]\n','a.md');
 assert.equal(a.links[0].label,'An alias');assert.equal(a.links[0].href,'wiki:Other%20file.md#section');
 const target={id:'b',name:'other FILE.md'};
 // Encoded wiki anchors must be split after decoding, like normal Markdown anchors.
 assert.equal(C.resolveLink(a.links[0].href,[target]),target);
});
test('ambiguous same-name files do not silently open the wrong file',()=>{
 assert.equal(C.resolveLink('wiki:other',[{id:'1',name:'Other.md'},{id:'2',name:'Other.md'}]),null);
});
test('graphs connect shared tags, documents and heading hierarchy with valid edges',()=>{
 const docs=[{id:'a',name:'A.md',analysis:C.analyze('# A\n## Parent\n### Child\n#topic\n[[B]]','A.md')},{id:'b',name:'B.md',analysis:C.analyze('# B\n#topic','B.md')}];
 const g=C.graphData(docs,'a','all');const ids=new Set(g.nodes.map(n=>n.id));
 assert.equal(g.nodes.filter(n=>n.id==='tag:topic').length,1);
 assert(g.links.some(l=>l.source==='a'&&l.target==='b'));
 assert(g.links.some(l=>l.source==='a#parent'&&l.target==='a#child'));
 assert(g.links.every(l=>ids.has(l.source)&&ids.has(l.target)));
 const filtered=C.graphData(docs,'a','document',{headings:false,tags:false,links:false});assert.equal(filtered.nodes.length,1);assert.equal(filtered.links.length,0);
});
test('frontmatter tag lists and body tags are extracted; source remains unchanged',()=>{
 const source='---\ntags:\n  - cyberdeck\n  - reading\n---\n# Title\nHello #world';const a=C.analyze(source,'a.md');assert.deepEqual(a.tags,['cyberdeck','reading','world']);assert.equal(a.headings[0].line,6);assert(source.includes('---\n'));
});
