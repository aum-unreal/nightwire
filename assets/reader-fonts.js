// Full upstream glyphs. Lexend uses a synthesized italic; other bundled families have real italic faces.
export const readingFonts={
 sans:{name:'System sans',short:'System',group:'sans',family:'var(--sans)',description:'Device default'},
 serif:{name:'Book serif',group:'serif',family:'Georgia, "Noto Serif", serif',description:'Classic book type'},
 source:{name:'Source Sans 3',short:'Source Sans',group:'sans',family:'"NW Source Sans 3", var(--sans)',description:'Clean humanist sans'},
 literata:{name:'Literata',group:'serif',family:'"NW Literata", Georgia, serif',description:'Bookish, generous detail'},
 atkinson:{accessible:true,name:'Atkinson Hyperlegible Next',short:'Atkinson',group:'sans',family:'"NW Atkinson Next", var(--sans)',description:'Distinct letter shapes'},
 plex:{name:'IBM Plex Mono',short:'Plex Mono',group:'mono',family:'"NW Plex Mono", var(--mono)',description:'Engineered monospace'},
 inter:{name:'Inter',group:'sans',family:'"NW Inter", var(--sans)',description:'Crisp screen type'},
 dm:{name:'DM Sans',group:'sans',family:'"NW DM Sans", var(--sans)',description:'Open, geometric forms'},
 work:{name:'Work Sans',group:'sans',family:'"NW Work Sans", var(--sans)',description:'Sturdy, practical rhythm'},
 nunito:{name:'Nunito Sans',group:'sans',family:'"NW Nunito Sans", var(--sans)',description:'Soft, broad letterforms'},
 lora:{name:'Lora',group:'serif',family:'"NW Lora", Georgia, serif',description:'Brush-like curves'},
 newsreader:{name:'Newsreader',group:'serif',family:'"NW Newsreader", Georgia, serif',description:'Fine editorial texture'},
 alegreya:{name:'Alegreya',group:'serif',family:'"NW Alegreya", Georgia, serif',description:'Calligraphic, lively rhythm'},
 crimson:{name:'Crimson Pro',group:'serif',family:'"NW Crimson Pro", Georgia, serif',description:'Traditional book warmth'},
 fraunces:{name:'Fraunces',group:'serif',family:'"NW Fraunces", Georgia, serif',description:'Expressive, rounded serifs'},
 jetbrains:{name:'JetBrains Mono',short:'JetBrains',group:'mono',family:'"NW JetBrains Mono", var(--mono)',description:'Tall, precise monospace'},
 space:{name:'Space Mono',group:'mono',family:'"NW Space Mono", var(--mono)',description:'Geometric terminal type'},
 opendyslexic:{name:'OpenDyslexic',short:'OpenDyslexic',group:'sans',accessible:true,family:'"NW OpenDyslexic", var(--sans)',description:'Weighted bases, distinct shapes'},
 lexend:{name:'Lexend',group:'sans',accessible:true,family:'"NW Lexend", var(--sans)',description:'Wide forms; slanted italic'},
 roboto:{name:'Roboto Mono',group:'mono',family:'"NW Roboto Mono", var(--mono)',description:'Steady technical rhythm'}
};
export function typefaceTrigger(font,esc){const face=readingFonts[font]||readingFonts.sans;return `<button class="type-trigger" data-action="typefaces" aria-label="Choose reading typeface" aria-haspopup="dialog" title="Choose reading typeface: ${esc(face.name)}"><span class="type-trigger-glyph" aria-hidden="true">Aa</span><span class="type-trigger-name">${esc(face.short||face.name)}</span><span class="type-trigger-notch" aria-hidden="true">⌄</span></button>`;}
export function fontRackMarkup(font,esc,icon){return `<section class="font-rack" aria-label="Typeface library"><div class="font-rack-specimen"><span class="font-rack-caption"><b id="rack-font-name">${esc((readingFonts[font]||readingFonts.sans).name)}</b><span>PAGE + READ</span></span><p>Keep <strong>useful details.</strong><br><em>Follow the thread.</em></p><span class="font-rack-glyphs">Il1 · O0 · Aa Gg · 0123456789</span></div><div class="font-rack-controls"><label class="font-rack-search">${icon('search')}<input id="font-rack-search" type="search" placeholder="Find a typeface" aria-label="Find a typeface" autocomplete="off"></label><div class="font-rack-filters" aria-label="Typeface categories">${[['all','All'],['sans','Sans'],['serif','Serif'],['mono','Mono'],['accessible','Access']].map(([id,name])=>`<button data-font-group="${id}" aria-label="${id==='accessible'?'Accessibility typefaces':name+' typefaces'}" aria-pressed="${id==='all'}">${name}</button>`).join('')}</div></div><div class="font-rack-grid">${Object.entries(readingFonts).map(([id,face],i)=>`<button class="font-option" data-action="choose-font" data-font="${id}" data-family-group="${face.group}" aria-label="Use ${esc(face.name)}" aria-pressed="${id===font}" style="--specimen-font:${esc(face.family)}"><span class="font-option-heading"><span>${String(i+1).padStart(2,'0')} / ${face.group.toUpperCase()}</span>${icon('check')}</span><span class="font-option-sample" aria-hidden="true">Aa 012.</span><strong>${esc(face.name)}</strong><small>${esc(face.description)}</small></button>`).join('')}</div><p id="font-rack-empty" hidden>No typefaces match that search.</p><button class="button primary font-rack-done" data-close>Keep this typeface ${icon('check')}</button></section>`;}
let requestedFont;
export function applyReadingFont(settings){
 if(!Object.prototype.hasOwnProperty.call(readingFonts,settings.font))settings.font='sans';
 const id=settings.font,font=readingFonts[id];document.documentElement.style.setProperty('--reading-font',font.family);
 document.documentElement.dataset.readingFont=id;
 for(const [selector,value]of [['#reading-font-name',font.name],['#reading-font-description',font.description],['#rack-font-name',font.name],['.type-trigger-name',font.short||font.name]])document.querySelectorAll(selector).forEach(el=>el.textContent=value);
 document.querySelectorAll('.type-trigger').forEach(el=>el.title='Choose reading typeface: '+font.name);
 document.querySelectorAll('[data-font]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.font===id));
 const select=document.getElementById('setting-font');if(select)select.value=id;
 if(requestedFont!==id){requestedFont=id;const family=getComputedStyle(document.documentElement).getPropertyValue('--reading-font');Promise.all([document.fonts.load('400 36px '+family),document.fonts.load('700 36px '+family)]).then(()=>{if(document.documentElement.dataset.readingFont===id)window.dispatchEvent(new Event('reading-font-ready'));}).catch(()=>{});}
}
