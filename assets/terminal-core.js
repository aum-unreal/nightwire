const DIAGRAM=/^(mermaid|dot|graphviz|plantuml|puml|d2|svgbob|ditaa|flowchart|sequence|math|latex|tex|katex)$/i;
// Read visible Markdown prose in source order, without markup, URLs or fenced code.
// What the word stream cannot show (code, diagrams, images, tables, raw HTML) is kept as words.asides:
// {index: the word that follows it, kind, label, line: the block's data-line on the Page, anchor}.
export function readingWords(analysis) {
 const words=[],asides=[]; let anchor=null,line=null;
 const aside=(kind,label)=>{const last=asides[asides.length-1];if(last&&last.index===words.length&&last.line===line&&last.kind===kind)return;asides.push({index:words.length,kind,label,line,anchor});};
 for(let i=0;i<analysis.tokens.length;i++) {
  const token=analysis.tokens[i];
  if(token.nesting!==-1&&token.attrGet?.('data-line'))line=Number(token.attrGet('data-line'));
  if(token.type==='heading_open') anchor=token.attrGet('id');
  if(token.type==='fence'||token.type==='code_block'){const lang=(token.info||'').trim().split(/\s+/)[0]||'';aside(DIAGRAM.test(lang)?'diagram':'code',DIAGRAM.test(lang)?`${lang} diagram`:lang?`${lang} code`:'Code block');continue;}
  if(token.type==='html_block'){if(!/^\s*<!--/.test(token.content))aside('html','Embedded HTML');continue;}
  if(token.type==='table_open'){aside('table','Table');continue;}
  if(token.type!=='inline') continue;
  let text='';
  for(const child of token.children||[]) {
   if(child.type==='image'){aside('image',child.content?`Image · ${child.content}`:'Image');continue;}
   if(['text','code_inline'].includes(child.type)) text+=child.content;
   else if(['softbreak','hardbreak'].includes(child.type)) text+=' ';
  }
  text=text.replace(/^\[![\w-]+\]\s*/, '').replace(/^\[[ xX]\]\s*/, '');
  for(const value of text.trim().split(/\s+/).filter(Boolean)) words.push({text:value,anchor});
 }
 words.asides=asides;
 return words;
}
// The aside to offer at a position: shown from the first word after it for the next `span` words.
export function asideAt(words,position,group=1,span=48){
 const list=words.asides||[];let found=null;
 for(const a of list){if(a.index<=position+group-1||a.index===words.length&&position>=words.length-group)found=a;else break;}
 return found&&position<found.index+span?found:null;
}
// First word index of a section; null when it holds no prose.
export function sectionStart(words,anchor){if(!anchor)return null;const i=words.findIndex(w=>w.anchor===anchor);return i<0?null:i;}
export const clampWpm = value => Math.min(1000,Math.max(80,Math.round((Number(value)||300)/10)*10));
export function bionicParts(word) {
 const chars=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(word)].map(s=>s.segment):Array.from(word);
 const letters=chars.map((s,i)=>/[\p{L}\p{N}]/u.test(s)?i:-1).filter(i=>i>=0);
 if(!letters.length)return ['',word];
 const end=letters[Math.ceil(letters.length/2)-1]+1;
 return [chars.slice(0,end).join(''),chars.slice(end).join('')];
}
// Each frame gets its full dwell. A delayed callback advances once, never catches up.
export class WordPlayer {
 constructor(words,{index=0,wpm=300,group=1,onFrame=()=>{},onState=()=>{},schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id)}={}) {
  Object.assign(this,{words,wpm:clampWpm(wpm),group:group===2?2:1,onFrame,onState,schedule,cancel});
  this.index=Math.min(words.length,Math.max(0,Math.floor(Number(index)||0)));this.playing=false;this.timer=null;
 }
 frame(){const start=this.index===this.words.length?Math.max(0,this.words.length-this.group):this.index;return this.words.slice(start,start+this.group);}
 clear(){if(this.timer!==null)this.cancel(this.timer);this.timer=null;}
 emit(){this.onFrame(this.frame(),this.index);}
 arm(){this.clear();if(!this.playing)return;const count=Math.min(this.group,this.words.length-this.index);this.timer=this.schedule(()=>{this.timer=null;if(!this.playing)return;this.index=Math.min(this.words.length,this.index+count);if(this.index===this.words.length){this.pause();this.emit();return;}this.emit();this.arm();},60000/this.wpm*count);}
 play(){if(!this.words.length||this.playing)return;if(this.index===this.words.length)this.index=0;this.playing=true;this.emit();this.onState();this.arm();}
 pause(){this.clear();this.playing=false;this.onState();}
 seek(index){this.pause();this.index=Math.min(this.words.length,Math.max(0,Math.floor(Number(index)||0)));this.emit();}
 step(direction){this.seek(this.index+direction*this.group);}
 speed(value){this.wpm=clampWpm(value);this.arm();}
 grouping(value){this.group=value===2?2:1;this.emit();this.arm();}
 destroy(){this.pause();}
}
