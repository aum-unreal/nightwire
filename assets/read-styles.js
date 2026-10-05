import {readInstruments} from './read-theme-registry.js';
export const readStyles=[
 {id:'classic',name:'Classic',detail:'A filed index card in the page’s own colours.'},
 {id:'cyberdeck',name:'Cyberdeck',detail:'A handheld deck: one OLED window, hard keys.'},
 {id:'phosphor',name:'Phosphor',detail:'A green screen above a bank of keys.'},
 {id:'mixtape',name:'Mixtape',detail:'A cassette whose reels follow your place.'},
 {id:'orbital',name:'Orbital',detail:'An optical bench; the arc is your progress.'},
 {id:'nocturne',name:'Nocturne',detail:'A bound folio with its keys in the margin.'}
];
export const readStyle=value=>readStyles.some(style=>style.id===value)?value:'cyberdeck';
// The cartridge shelf (§6.8 Picker): one seated card per instrument, its miniature above a Plex name plate.
export function stylePicker(){return `<div class="read-style-gallery cartridge-shelf" role="group" aria-label="Read style">${readStyles.map(s=>`<button class="read-style-card" data-read-style="${s.id}" aria-pressed="false"><span class="read-style-mini mini-${s.id}" aria-hidden="true">${readInstruments[s.id].preview}</span><span class="read-style-plate"><span class="pip" aria-hidden="true"></span><span class="read-style-name">${s.name}</span></span><span class="read-style-line">${s.detail}</span></button>`).join('')}</div>`;}
