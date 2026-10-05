// Full upstream glyphs. Lexend uses a synthesized italic; other bundled families have real italic faces.
export const readingFonts={
 sans:{pair:'Aa',name:'System sans',short:'System',group:'sans',family:'var(--sans)',description:'Device default'},
 serif:{pair:'Qg',name:'Book serif',group:'serif',family:'Georgia, "Noto Serif", serif',description:'Classic book type'},
 source:{pair:'Rt',name:'Source Sans 3',short:'Source Sans',group:'sans',family:'"NW Source Sans 3", var(--sans)',description:'Clean humanist sans'},
 literata:{pair:'Qa',name:'Literata',group:'serif',family:'"NW Literata", Georgia, serif',description:'Bookish, generous detail'},
 atkinson:{pair:'Il1',accessible:true,name:'Atkinson Hyperlegible Next',short:'Atkinson',group:'sans',family:'"NW Atkinson Next", var(--sans)',description:'Distinct letter shapes'},
 plex:{pair:'0O{}',name:'IBM Plex Mono',short:'Plex Mono',group:'mono',family:'"NW Plex Mono", var(--mono)',description:'Engineered monospace'},
 inter:{pair:'R4',name:'Inter',group:'sans',family:'"NW Inter", var(--sans)',description:'Crisp screen type'},
 dm:{pair:'Gy',name:'DM Sans',group:'sans',family:'"NW DM Sans", var(--sans)',description:'Open, geometric forms'},
 work:{pair:'Rk',name:'Work Sans',group:'sans',family:'"NW Work Sans", var(--sans)',description:'Sturdy, practical rhythm'},
 nunito:{pair:'ag',name:'Nunito Sans',group:'sans',family:'"NW Nunito Sans", var(--sans)',description:'Soft, broad letterforms'},
 lora:{pair:'Ag',name:'Lora',group:'serif',family:'"NW Lora", Georgia, serif',description:'Brush-like curves'},
 newsreader:{pair:'fi',name:'Newsreader',group:'serif',family:'"NW Newsreader", Georgia, serif',description:'Fine editorial texture'},
 alegreya:{pair:'Th',name:'Alegreya',group:'serif',family:'"NW Alegreya", Georgia, serif',description:'Calligraphic, lively rhythm'},
 crimson:{pair:'ffl',name:'Crimson Pro',group:'serif',family:'"NW Crimson Pro", Georgia, serif',description:'Traditional book warmth'},
 fraunces:{pair:'&g',name:'Fraunces',group:'serif',family:'"NW Fraunces", Georgia, serif',description:'Expressive, rounded serifs'},
 jetbrains:{pair:'->',name:'JetBrains Mono',short:'JetBrains',group:'mono',family:'"NW JetBrains Mono", var(--mono)',description:'Tall, precise monospace'},
 space:{pair:'@#',name:'Space Mono',group:'mono',family:'"NW Space Mono", var(--mono)',description:'Geometric terminal type'},
 opendyslexic:{pair:'bdpq',name:'OpenDyslexic',short:'OpenDyslexic',group:'sans',accessible:true,family:'"NW OpenDyslexic", var(--sans)',description:'Weighted bases, distinct shapes'},
 lexend:{pair:'aG',name:'Lexend',group:'sans',accessible:true,family:'"NW Lexend", var(--sans)',description:'Wide forms; slanted italic'},
 roboto:{pair:'0Ø',name:'Roboto Mono',group:'mono',family:'"NW Roboto Mono", var(--mono)',description:'Steady technical rhythm'}
};
export function typefaceTrigger(font,esc){const face=readingFonts[font]||readingFonts.literata;return `<button class="type-trigger" data-action="typefaces" aria-label="Choose reading typeface" aria-haspopup="dialog" title="Choose reading typeface: ${esc(face.name)}"><span class="type-trigger-glyph" aria-hidden="true">Aa</span><span class="type-trigger-name">${esc(face.short||face.name)}</span><span class="type-trigger-notch" aria-hidden="true"></span></button>`;}
// Type case (§6.6): a proof strip in the chosen face, then drawer pulls and a compartment grid. proof is plain text (escaped here).
const groupName={sans:'Sans',serif:'Serif',mono:'Mono'};
export const rackMeta=face=>groupName[face.group]+(face.accessible?' · legibility':'')+' · '+face.description.charAt(0).toLowerCase()+face.description.slice(1);
export function fontRackMarkup(font,esc,proof='The quiet part of the page is where the reading happens.'){const face=readingFonts[font]||readingFonts.literata;return `<section class="font-rack" aria-label="Typeface library"><figure class="rack-proof paper"><figcaption class="rack-proof-head"><span id="rack-font-name">${esc(face.name)}</span><span class="stamp" id="rack-font-meta">${esc(rackMeta(face))}</span></figcaption><p class="rack-proof-line">${esc(proof)}</p></figure><div class="font-rack-controls"><label class="field field--search rack-find"><input id="font-rack-search" type="search" placeholder="Find a typeface" aria-label="Find a typeface" autocomplete="off" spellcheck="false"></label><div class="font-rack-filters" role="group" aria-label="Typeface categories">${[['all','All'],['sans','Sans'],['serif','Serif'],['mono','Mono'],['accessible','Legibility']].map(([id,name])=>`<button class="drawer-pull" data-font-group="${id}" aria-label="${id==='accessible'?'Accessibility typefaces':name+' typefaces'}" aria-pressed="${id==='all'}"><span class="drawer-pull-cup" aria-hidden="true"></span><span class="drawer-pull-label">${name}</span></button>`).join('')}</div></div><div class="font-rack-grid">${Object.entries(readingFonts).map(([id,f])=>`<button class="font-option" data-action="choose-font" data-font="${id}" data-family-group="${f.group}" aria-label="Use ${esc(f.name)}" aria-pressed="${id===font}" style="--specimen-font:${esc(f.family)}"><span class="pip" aria-hidden="true"></span>${f.accessible?'<span class="font-option-l" aria-hidden="true">L</span>':''}<span class="font-option-pair" aria-hidden="true">${esc(f.pair)}</span><span class="font-option-name">${esc(f.short||f.name).replace(/([a-z])([A-Z])/g,'$1­$2')}</span></button>`).join('')}</div><p id="font-rack-empty" role="status" hidden></p></section>`;}
let requestedFont;
export function applyReadingFont(settings){
 if(!Object.prototype.hasOwnProperty.call(readingFonts,settings.font))settings.font='literata';
 const id=settings.font,font=readingFonts[id];document.documentElement.style.setProperty('--reading-font',font.family);
 document.documentElement.dataset.readingFont=id;
 for(const [selector,value]of [['#reading-font-name',font.name],['#reading-font-description',font.description],['#rack-font-name',font.name],['#rack-font-meta',rackMeta(font)],['.type-trigger-name',font.short||font.name]])document.querySelectorAll(selector).forEach(el=>el.textContent=value);
 document.querySelectorAll('.type-trigger').forEach(el=>el.title='Choose reading typeface: '+font.name);
 document.querySelectorAll('[data-font]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.font===id));
 if(requestedFont!==id){requestedFont=id;const family=getComputedStyle(document.documentElement).getPropertyValue('--reading-font');Promise.all([document.fonts.load('400 36px '+family),document.fonts.load('700 36px '+family)]).then(()=>{if(document.documentElement.dataset.readingFont===id)window.dispatchEvent(new Event('reading-font-ready'));}).catch(()=>{});}
}
