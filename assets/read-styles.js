import {readInstruments} from './read-theme-registry.js';
export const readStyles=[
 {id:'classic',name:'Classic',detail:'Archival index. Theme-aware paper keys, filed tab, engraved ruler.'},
 {id:'cyberdeck',name:'Cyberdeck',detail:'Field terminal. Moulded shell, cartridge, hardware shelf.'},
 {id:'phosphor',name:'Phosphor',detail:'Command workstation. CRT buffer, key bank, indexed presets.'},
 {id:'mixtape',name:'Mixtape',detail:'Cassette machine. Tape label, moving hubs, enamel transport.'},
 {id:'orbital',name:'Orbital',detail:'Optical flight bench. Progress arc, payload rail, actuator keys.'},
 {id:'nocturne',name:'Nocturne',detail:'Bound midnight folio. Margin controls, ribbon, engraved colophon.'}
];
export const readStyle=value=>readStyles.some(style=>style.id===value)?value:'cyberdeck';
export function stylePicker(){return `<div class="read-style-gallery" aria-label="Read style previews">${readStyles.map(s=>`<button class="read-style-card" data-read-style="${s.id}" aria-pressed="false"><span class="read-style-mini mini-${s.id}" aria-hidden="true">${readInstruments[s.id].preview}</span><span><strong>${s.name}</strong><small>${s.detail}</small></span></button>`).join('')}</div>`;}
