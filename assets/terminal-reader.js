import {typefaceTrigger} from './reader-fonts.js';
import {readStyle} from './read-styles.js';
import {instrumentMarkup} from './read-theme-registry.js';
import {readingWords,WordPlayer,clampWpm,bionicParts} from './terminal-core.js';
// Sentence-case readout shared by every instrument's monitor: "1 word · bionic".
export const modeText=(group,settings)=>`${group===2?'2 words':'1 word'} · ${settings.terminalBionic!==false?'bionic':'plain'}`;
export function createTerminal({root,doc,index,settings,save,saveSettings,icon,escape:esc,motion,feedback,icons,onDocument,onFiles,onStyleChange,onPlaying}) {
 const words=readingWords(doc.analysis),wpm=clampWpm(settings.terminalWpm),group=settings.terminalGroup===2?2:1;
 const presentation=readStyle(settings.terminalStyle);
 root.className='terminal-main theme-'+presentation+(presentation==='cyberdeck'?' cyberdeck-root':presentation==='classic'?'':' vibe-root vibe-'+presentation);
 document.body.dataset.terminalPresentation=presentation;
 root.dataset.terminalAlignment=settings.terminalAlignment==='center'?'center':'fixed';
 root.innerHTML=instrumentMarkup({doc,words,wpm,group,settings,icon,esc,presentation});
 root.querySelector('.terminal-header-tools,.deck-system-keys').insertAdjacentHTML('afterbegin',`<button class="icon-btn" id="terminal-blackout" aria-label="Blackout reading"><svg class="glyph" aria-hidden="true"><use href="#g-visor"/></svg></button>`);
 root.querySelector('.terminal-monitor-top').insertAdjacentHTML('beforeend',typefaceTrigger(settings.font,esc));
 const $=s=>root.querySelector(s),events=new AbortController(),signal=events.signal;
 let pulse=null,needleMotion=null,dialMotion=null,entryMotion=null,disposed=false,player,blackoutSurface=null,stagePlaceholder=null,wasPlaying=false;
 // A live serial plate fills each instrument's label slot: file, length and time left. The name shrinks first.
 const left=seconds=>seconds>=60?`${Math.floor(seconds/60)} min ${seconds%60} s`:seconds+' s';
 root.querySelectorAll('.terminal-serial').forEach(el=>el.innerHTML=`<span class="serial-name">${esc(doc.name)}</span><span class="serial-meta"><span class="serial-sep"> · </span>${words.length} ${words.length===1?'word':'words'}<span class="serial-time"> · <span class="serial-left"></span></span></span>`);
 const on=(el,event,fn)=>el.addEventListener(event,fn,{signal});
 const persist=()=>{if(player)save(player.index);};
 function systemBlackout(value){if(typeof window.Native?.readingBlackout==='function')Native.readingBlackout(value);}
 function enterBlackout(){
  if(disposed||blackoutSurface||!words.length)return;
  entryMotion?.revert();entryMotion=null;feedback();
  root.style.setProperty('--blackout-text',getComputedStyle($('#terminal-words')).color);
  const stage=$('.terminal-stage');stagePlaceholder=document.createComment('reading stage');stage.replaceWith(stagePlaceholder);
  blackoutSurface=document.createElement('div');blackoutSurface.className='terminal-blackout-surface';blackoutSurface.tabIndex=0;blackoutSurface.setAttribute('role','button');blackoutSurface.setAttribute('aria-label','Exit blackout reading');blackoutSurface.setAttribute('aria-description','Tap, Enter or Escape pauses and returns to controls. Space pauses or resumes reading.');
  blackoutSurface.append(stage);root.append(blackoutSurface);$('.terminal-deck').inert=true;
  document.body.classList.add('reading-blackout');systemBlackout(true);sizeScreen();blackoutSurface.focus({preventScroll:true});
  blackoutSurface.onpointerdown=e=>e.stopPropagation();
  blackoutSurface.onclick=e=>{e.stopPropagation();feedback();exitBlackout();};
 }
 function exitBlackout(restoreFocus=true){
  if(!blackoutSurface)return false;
  player.pause();stagePlaceholder.replaceWith(blackoutSurface.querySelector('.terminal-stage'));stagePlaceholder=null;
  blackoutSurface.onclick=null;blackoutSurface.onpointerdown=null;blackoutSurface.remove();blackoutSurface=null;root.style.removeProperty('--blackout-text');$('.terminal-deck').inert=false;
  document.body.classList.remove('reading-blackout');systemBlackout(false);sizeScreen();
  if(restoreFocus)$('#terminal-play').focus({preventScroll:true});return true;
 }
 // The dock and rail take their materials from ui/read-shell.css via body[data-terminal-presentation]; light stays the user's accent, so no JS bridge is needed.
 function sizeScreen(){
  const viewport=Math.min(innerHeight,window.visualViewport?.height||innerHeight),dock=document.querySelector('.mobile-nav');
  const dockHeight=dock&&getComputedStyle(dock).display!=='none'?dock.getBoundingClientRect().height:0;
  const height=Math.max(220,Math.floor(viewport-dockHeight));root.style.setProperty('--terminal-height',height+'px');
  root.dataset.terminalSize=height<650?'compact':'regular';
  root.dataset.terminalLandscape=root.clientWidth>=580&&root.clientWidth>height*1.25&&height<560?'true':'false';
  // Full-size controls own 44px cells; if they leave the aperture too short for a large word, fold to the compact layout.
  if(root.dataset.terminalSize==='regular'&&($('.terminal-stage')?.clientHeight??Infinity)<72)root.dataset.terminalSize='compact';
  fitMark();fit();
 }
 // The header keys keep a 44px pitch, so on a narrow window the instrument's wordmark gives way instead.
 function fitMark(){
  const mark=root.querySelector('.terminal-header h1');if(!mark)return;mark.style.fontSize='';
  for(let pass=0;pass<3&&mark.scrollWidth>mark.clientWidth+1;pass++)mark.style.fontSize=parseFloat(getComputedStyle(mark).fontSize)*mark.clientWidth/mark.scrollWidth*.98+'px';
 }
 function fit(){
  const el=$('#terminal-words');if(!el)return;el.style.fontSize='';el.style.removeProperty('--frame-font-size');
  const stage=$('.terminal-stage'),height=Math.max(1,stage.clientHeight-parseFloat(getComputedStyle(stage).paddingTop)-parseFloat(getComputedStyle(stage).paddingBottom)-4);
  if(settings.terminalAlignment==='center'){
   const style=getComputedStyle(stage),width=Math.max(1,stage.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-24);
   for(let pass=0;pass<3;pass++){
    const ratio=Math.min(1,width/Math.max(1,el.scrollWidth),height/Math.max(1,el.getBoundingClientRect().height));if(ratio>=1)break;
    el.style.fontSize=Math.max(1,parseFloat(getComputedStyle(el).fontSize)*ratio*.99)+'px';
   }
   return;
  }
  // The line box depends on the viewport, while word fitting leaves its baseline fixed.
  const base=parseFloat(getComputedStyle(el).fontSize);el.style.fontSize=Math.min(base,height/1.5)+'px';
  const slots=[...el.querySelectorAll('.terminal-word-slot')];
  for(let pass=0;pass<3;pass++){
   const ratio=Math.min(1,...slots.map(slot=>{const word=slot.querySelector('.terminal-word');return word?slot.clientWidth/Math.max(1,word.getBoundingClientRect().width):1;}));if(ratio>=1)break;
   const word=el.querySelector('.terminal-word');el.style.setProperty('--frame-font-size',Math.max(1,parseFloat(getComputedStyle(word).fontSize)*ratio*.99)+'px');
  }
 }

 function frame(values,position){
  const wordMarkup=w=>{const [first,last]=bionicParts(w.text);return `<span class="terminal-word">${settings.terminalBionic!==false?`<b>${esc(first)}</b>${esc(last)}`:esc(w.text)}</span>`;};
  $('#terminal-words').innerHTML=values.length?(settings.terminalAlignment==='center'?values.map(wordMarkup).join(''):Array.from({length:settings.terminalGroup===2?2:1},(_,i)=>`<span class="terminal-word-slot"><span class="terminal-baseline" aria-hidden="true"></span>${values[i]?wordMarkup(values[i]):''}</span>`).join('')):'<span class="terminal-no-prose">No readable prose</span>';fit();
  $('#terminal-position').textContent=`${Math.min(words.length,position+(position<words.length?values.length:0))} / ${words.length}`;
  const progress=words.length?position/words.length*100:0;root.style.setProperty('--word-progress',progress);root.style.setProperty('--reel-turn',position*9+'deg');$('#terminal-percent').textContent=Math.round(progress)+'%';$('#terminal-seek').value=position;$('#terminal-seek').style.setProperty('--position',progress+'%');
  const remaining=Math.ceil((words.length-position)/player.wpm*60);$('#terminal-remaining').textContent=left(remaining)+' left';root.querySelectorAll('.serial-left').forEach(el=>el.textContent=left(remaining)+' left');
  const heading=doc.analysis.headings.find(h=>h.id===values[0]?.anchor);$('#terminal-section').textContent=heading?.text||doc.analysis.title;$('#terminal-section').title=heading?.text||doc.analysis.title;
 }
 function status(){if(disposed)return;$('#terminal-status').textContent=player.playing?'Reading':player.index===words.length&&words.length?'Finished':'Paused';if(player.playing!==wasPlaying){wasPlaying=player.playing;onPlaying?.(wasPlaying);}$('.terminal-monitor').classList.toggle('streaming',player.playing);$('#terminal-play').innerHTML=icon(player.playing?'pause':'play')+`<span>${player.playing?'Pause':player.index===words.length&&words.length?'Replay':'Start'}</span>`;$('#terminal-play').setAttribute('aria-label',player.playing?'Pause reading':'Start reading');icons();persist();}
 player=new WordPlayer(words,{index,wpm,group,onFrame:frame,onState:status});player.emit();status();
 for(const b of root.querySelectorAll('.terminal-transport button'))b.disabled=!words.length;
 const speed=(value,animate=true)=>{
  if(!motion()){entryMotion?.revert();entryMotion=null;}
  player.speed(value);settings.terminalWpm=player.wpm;$('#terminal-wpm').value=player.wpm;$('#terminal-speed-input').value=player.wpm;
  const percent=(player.wpm-80)/920*100;needleMotion?.cancel();pulse?.cancel();dialMotion?.cancel();
  root.style.setProperty('--dial-progress',percent);const pointer=$('.deck-dial-pointer'),angle=percent*1.8-90;
  if(pointer){if(animate&&motion()&&window.anime)dialMotion=anime.animate(pointer,{rotate:angle,duration:300,ease:'out(3)'});else pointer.style.transform=`rotate(${angle}deg)`;}
  if(animate&&motion()&&window.anime){needleMotion=anime.animate($('.terminal-needle'),{left:percent+'%',duration:250,ease:'out(3)'});pulse=anime.animate($('#terminal-wpm'),{scale:[1.045,1],duration:260,ease:'out(3)'});}else{$('.terminal-needle').style.left=percent+'%';$('#terminal-wpm').style.transform='';}
  root.querySelectorAll('[data-speed]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.speed)===player.wpm));frame(player.frame(),player.index);if(animate){feedback();saveSettings();}
 };
 $('#terminal-blackout').disabled=!words.length;on($('#terminal-blackout'),'click',enterBlackout);
 speed(wpm,false);
 on($('#terminal-speed-input'),'input',e=>speed(e.target.value));
 on($('#terminal-slower'),'click',()=>speed(player.wpm-10));on($('#terminal-faster'),'click',()=>speed(player.wpm+10));
 root.querySelectorAll('[data-speed]').forEach(b=>on(b,'click',()=>speed(b.dataset.speed)));
 const toggle=()=>{feedback();player.playing?player.pause():player.play();};on($('#terminal-play'),'click',toggle);
 on($('#terminal-restart'),'click',()=>{feedback();player.seek(0);persist();});on($('#terminal-prev'),'click',()=>{feedback();player.step(-1);persist();});on($('#terminal-next'),'click',()=>{feedback();player.step(1);persist();});
 on($('#terminal-seek'),'input',e=>{player.seek(e.target.value);persist();});
 root.querySelectorAll('[data-group]').forEach(b=>on(b,'click',()=>{feedback();settings.terminalGroup=Number(b.dataset.group);player.grouping(settings.terminalGroup);root.querySelectorAll('[data-group]').forEach(v=>v.setAttribute('aria-pressed',v===b));saveSettings();updateMode();}));
 function updateMode(){$('#terminal-mode').textContent=modeText(player.group,settings);}
 on($('#terminal-bionic'),'click',()=>{feedback();settings.terminalBionic=settings.terminalBionic===false;$('#terminal-bionic').setAttribute('aria-pressed',settings.terminalBionic);saveSettings();updateMode();player.emit();});
 on($('#terminal-file'),'click',()=>{feedback();player.pause();onFiles();});
 on($('#terminal-document'),'click',()=>onDocument(words[Math.min(player.index,words.length-1)]?.anchor));
 on(document,'keydown',e=>{if(blackoutSurface&&(e.key==='Escape'||e.key==='Enter')){e.preventDefault();exitBlackout();return;}if(e.ctrlKey||e.altKey||e.metaKey||e.target.closest('input,select,textarea,button,[contenteditable]')||document.querySelector('dialog[open]'))return;if(e.key===' '){e.preventDefault();toggle();}else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();player.step(e.key==='ArrowLeft'?-1:1);persist();}});
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 on(reducedMotion,'change',()=>{if(!motion()){entryMotion?.revert();entryMotion=null;speed(player.wpm,false);}});
 on(document,'visibilitychange',()=>{if(document.hidden){exitBlackout(false);player.pause();}});on(window,'pagehide',()=>{exitBlackout(false);player.pause();});on(window,'resize',sizeScreen);on(window,'reading-font-ready',sizeScreen);if(window.visualViewport)on(window.visualViewport,'resize',sizeScreen);
 sizeScreen();const screenResize=new ResizeObserver(sizeScreen);screenResize.observe(root);screenResize.observe(root.parentElement);
 document.fonts.ready.then(()=>{if(!disposed)sizeScreen();});
 if(presentation==='cyberdeck'&&motion()&&window.anime)entryMotion=anime.animate($('.deck-hardware'),{opacity:[0,1],translateY:[7,0],duration:360,ease:'out(3)',onComplete:()=>{entryMotion?.revert();entryMotion=null;}});
 icons();
 return {save:persist,enterBlackout,exitBlackout,pause:()=>{exitBlackout(false);player.pause();},destroy(){exitBlackout(false);player.destroy();disposed=true;events.abort();screenResize.disconnect();pulse?.cancel();needleMotion?.cancel();dialMotion?.cancel();entryMotion?.revert();delete document.body.dataset.terminalPresentation;if(wasPlaying){wasPlaying=false;onPlaying?.(false);}},settingsChanged(){if((readStyle(settings.terminalStyle))!==presentation){player.pause();onStyleChange();return;}root.dataset.terminalAlignment=settings.terminalAlignment==='center'?'center':'fixed';if(!motion()){entryMotion?.revert();entryMotion=null;}speed(player.wpm,false);player.emit();}};
}
