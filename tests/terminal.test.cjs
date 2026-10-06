const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
globalThis.markdownit=require('markdown-it');const C=require('../assets/core.js');
const core=import('data:text/javascript;base64,'+fs.readFileSync(require.resolve('../assets/terminal-core.js')).toString('base64'));
test('terminal extracts visible prose, aliases, adjacent formatting and section anchors',async()=>{
 const {readingWords,bionicParts}=await core;
 const a=C.analyze('---\ntags: secret\n---\n# Title\n\n**Hel**lo [label](https://hidden.test) [[Note|alias]]\n\n> [!NOTE]\n> useful\n\n- [x] done\n\n## Section\n\n`inline` text\n\n```js\nhiddenCode\n```\n\n<script>hiddenHtml</script>\n','a.md');
 const words=readingWords(a);assert.deepEqual(words.map(w=>w.text),['Title','Hello','label','alias','useful','done','Section','inline','text']);assert.equal(words.at(-1).anchor,'section');assert.deepEqual(bionicParts('reading'),['read','ing']);assert.deepEqual(bionicParts('e\u0301lan'),['e\u0301l','an']);assert.deepEqual(bionicParts('…'),['','…']);
});
test('WPM is words per minute, speed changes rearm once, pause and teardown cancel',async()=>{
 const {WordPlayer}=await core;let callback=null,delay=null;const p=new WordPlayer(Array.from({length:5},(_,i)=>({text:String(i)})),{wpm:300,schedule:(fn,ms)=>{callback=fn;delay=ms;return 1;},cancel:()=>{callback=null;}});
 const tick=()=>{const fn=callback;callback=null;fn();};
 p.play();assert.equal(delay,200);tick();assert.equal(p.index,1);p.grouping(2);assert.equal(delay,400);assert.deepEqual(p.frame().map(w=>w.text),['1','2']);p.speed(600);assert.equal(delay,200);tick();assert.equal(p.index,3);tick();assert.equal(p.index,5);assert.equal(p.playing,false);assert.equal(callback,null);
 p.seek(4);assert.deepEqual(p.frame().map(w=>w.text),['4']);p.play();assert.equal(delay,100);p.pause();assert.equal(callback,null);p.play();p.destroy();assert.equal(callback,null);
});
test('empty input, malformed preferences and late callbacks stay bounded',async()=>{
 const {WordPlayer,clampWpm}=await core;assert.equal(clampWpm(Infinity),1000);assert.equal(clampWpm(-100),80);assert.equal(clampWpm('bad'),300);
 const empty=new WordPlayer([]);empty.play();assert.equal(empty.playing,false);
 let pending;const p=new WordPlayer([{text:'one'},{text:'two'},{text:'three'}],{index:-1,schedule:fn=>{pending=fn;return 1;},cancel:()=>{}});p.play();pending();assert.equal(p.index,1,'Late callbacks advance one frame');p.pause();pending();assert.equal(p.index,1);p.seek(999);assert.equal(p.index,3);p.play();assert.equal(p.index,0);p.destroy();
});
test('Read keeps skipped code, diagrams, tables and images as asides with Page lines',async()=>{
 const {readingWords,asideAt,sectionStart}=await core;
 const src='# Doc\n\nIntro words here.\n\n## Build\n\nRun this:\n\n```js\nconst x=1;\n```\n\nThen look:\n\n```mermaid\ngraph TD;A-->B\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n![chart](data:image/png;base64,AA==) after image\n\n<!-- comment -->\n\nEnd.\n';
 const a=C.analyze(src,'d.md'),words=readingWords(a),kinds=words.asides.map(x=>x.kind);
 assert.deepEqual(kinds,['code','diagram','table','image']);
 assert.deepEqual(words.asides.map(x=>x.label),['js code','mermaid diagram','Table','Image · chart']);
 const code=words.asides[0];assert.equal(words[code.index].text,'Then');assert.equal(code.line,9);assert.equal(code.anchor,'build');
 assert.equal(asideAt(words,code.index-1),null);assert.equal(asideAt(words,code.index),code);assert.equal(asideAt(words,code.index-1,2),code);
 const many=Object.assign(Array.from({length:100},()=>({text:'x'})),{asides:[{index:5,kind:'code'}]});assert.ok(asideAt(many,52));assert.equal(asideAt(many,53),null);
 assert.equal(words[sectionStart(words,'build')].text,'Build');assert.equal(sectionStart(words,'missing'),null);
});
