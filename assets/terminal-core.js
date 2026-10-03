// Read visible Markdown prose in source order, without markup, URLs or fenced code.
export function readingWords(analysis) {
 const words=[]; let anchor=null;
 for(let i=0;i<analysis.tokens.length;i++) {
  const token=analysis.tokens[i];
  if(token.type==='heading_open') anchor=token.attrGet('id');
  if(token.type!=='inline') continue;
  let text='';
  for(const child of token.children||[]) {
   if(['text','code_inline'].includes(child.type)) text+=child.content;
   else if(['softbreak','hardbreak'].includes(child.type)) text+=' ';
  }
  text=text.replace(/^\[![\w-]+\]\s*/, '').replace(/^\[[ xX]\]\s*/, '');
  for(const value of text.trim().split(/\s+/).filter(Boolean)) words.push({text:value,anchor});
 }
 return words;
}
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
