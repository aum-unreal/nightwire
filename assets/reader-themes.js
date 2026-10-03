// Reading-page adapters. Palette provenance and upstream licenses: scripts/theme-sources.json.
export const readerThemes = {
 nightwire:{name:'Nightwire',description:'Black · lime & cyan',bg:'#000000',panel:'#090f0e',line:'#25332e',text:'#c5ceca',muted:'#9baaa3',link:'#75dfeb',bold:'#e3e9e6',italic:'#e994d3',headings:['#e3e9e6','#e3e9e6','#c8fa72','#75dfeb'],keyword:'#e994d3',string:'#c8fa72',number:'#75dfeb'},
 minimal:{name:'Minimal',description:'Neutral · quiet type',bg:'#191919',panel:'#232323',line:'#383838',text:'#d7d7d7',muted:'#a8a8a8',link:'#a7c7e7',bold:'#eeeeee',italic:'#c3c3c3',headings:['#eeeeee','#eeeeee','#d7d7d7','#d7d7d7'],keyword:'#c5b9db',string:'#b8cba7',number:'#d7bd96'},
 catppuccin:{name:'Catppuccin Mocha',description:'Pastel · lavender & peach',bg:'#1e1e2e',panel:'#181825',line:'#45475a',text:'#cdd6f4',muted:'#a6adc8',link:'#89b4fa',bold:'#f5c2e7',italic:'#f5e0dc',headings:['#cba6f7','#89b4fa','#a6e3a1','#fab387'],keyword:'#cba6f7',string:'#a6e3a1',number:'#fab387'},
 tokyo:{name:'Tokyo Night',description:'Ink · blue & violet',bg:'#1a1b26',panel:'#16161e',line:'#3b4261',text:'#c0caf5',muted:'#a9b1d6',link:'#7aa2f7',bold:'#bb9af7',italic:'#9ece6a',headings:['#bb9af7','#7aa2f7','#7dcfff','#9ece6a'],keyword:'#bb9af7',string:'#9ece6a',number:'#ff9e64'},
 nord:{name:'Nord',description:'Cool · frost & slate',bg:'#2e3440',panel:'#242933',line:'#4c566a',text:'#eceff4',muted:'#d8dee9',link:'#88c0d0',bold:'#ebcb8b',italic:'#b48ead',headings:['#eceff4','#88c0d0','#81a1c1','#a3be8c'],keyword:'#81a1c1',string:'#a3be8c',number:'#b48ead'},
 gruvbox:{name:'Gruvbox',description:'Warm · amber & olive',bg:'#282828',panel:'#1d2021',line:'#504945',text:'#ebdbb2',muted:'#bdae93',link:'#8ec07c',bold:'#fabd2f',italic:'#d3869b',headings:['#fabd2f','#8ec07c','#83a598','#fe8019'],keyword:'#fb4934',string:'#b8bb26',number:'#d3869b'}
};
const colourRgb=hex=>hex.match(/[a-f0-9]{2}/gi).map(value=>parseInt(value,16));
const colourMix=(base,tint,amount)=>'#'+colourRgb(base).map((value,i)=>Math.round(value*(1-amount)+colourRgb(tint)[i]*amount).toString(16).padStart(2,'0')).join('');
export function applyReaderTheme(settings,interfaceAccent='#c8fa72'){
 if(!readerThemes[settings.readerTheme])settings.readerTheme='nightwire';
 const theme=readerThemes[settings.readerTheme],style=document.documentElement.style;
 const tokens={bg:settings.readerBlack?'#000000':theme.bg,panel:theme.panel,line:theme.line,text:settings.contrast?'#f3f4f5':theme.text,muted:settings.contrast?'#d8dee9':theme.muted,link:theme.link,bold:theme.bold,italic:theme.italic,keyword:theme.keyword,string:theme.string,number:theme.number};
 for(const [key,value]of Object.entries(tokens))style.setProperty('--read-'+key,value);
 // Index shares the page palette. Its archival materials keep their tonal roles.
 const accent=settings.readerTheme==='nightwire'?interfaceAccent:theme.link;
 const strength={quiet:.055,balanced:.09,vivid:.15}[settings.intensity]||.09;
 const panel=settings.readerBlack?colourMix('#000000',theme.panel,.42):theme.panel;
 const key=colourMix(tokens.text,accent,.18);
 const index={accent,'accent-rgb':colourRgb(accent).join(','),'accent-soft':colourMix('#000000',accent,.15),'accent-border':colourMix('#000000',accent,.38),'accent-ink':'#101410',
  paper:tokens.bg,panel,shelf:colourMix(panel,accent,strength),rule:theme.line,registration:colourMix(theme.line,accent,.2),
  key,'key-edge':colourMix(key,'#ffffff',.22),'key-shadow':colourMix(panel,accent,.36),'key-ink':'#101410',
  metal:colourMix(panel,accent,.38),'metal-edge':colourMix(tokens.muted,accent,.25),highlight:colourMix(tokens.text,accent,.15)};
 for(const [name,value]of Object.entries(index))style.setProperty('--index-'+name,value);
 for(let i=0;i<6;i++)style.setProperty('--read-h'+(i+1),theme.headings[Math.min(i,theme.headings.length-1)]);
 document.documentElement.dataset.readerTheme=settings.readerTheme;
 document.documentElement.dataset.readerBlack=String(settings.readerBlack);
 return theme;
}
