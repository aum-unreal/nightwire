const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets/vendor');
fs.mkdirSync(assets, {recursive:true});
const files = {
 'markdown-it': ['dist/browser/markdown-it.umd.min.js', 'markdown-it.js', 'LICENSE'],
 'dompurify': ['dist/purify.min.js', 'purify.js', 'LICENSE'],
 'minisearch': ['dist/umd/index.js', 'minisearch.js', 'LICENSE.txt'],
 'force-graph': ['dist/force-graph.min.js', 'force-graph.js', 'LICENSE'],
 '@highlightjs/cdn-assets': ['highlight.min.js', 'highlight.js', 'LICENSE'],
 'animejs': ['dist/bundles/anime.umd.min.js', 'anime.js', 'LICENSE.md'],
 'lucide': ['dist/umd/lucide.min.js', 'lucide.js', 'LICENSE']
};
let notices = 'NIGHTWIRE — THIRD-PARTY LICENSES\n\n';
for (const [name, [src, dest, license]] of Object.entries(files)) {
 const dir = path.join(root, 'node_modules', name);
 fs.copyFileSync(path.join(dir, src), path.join(assets,dest));
 const pkg = JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
 notices += `\n${'='.repeat(72)}\n${name} ${pkg.version}\n${JSON.stringify(pkg.repository || '')}\n\n${fs.readFileSync(path.join(dir,license),'utf8')}\n`;
}
// The graph distribution bundles these packages. Preserve their own notices too.
const visited = new Set(Object.keys(files));
function licenses(name) {
 if (visited.has(name)) return; visited.add(name);
 const dir = path.join(root,'node_modules',name);
 if (!fs.existsSync(dir)) throw new Error('Missing graph dependency: '+name);
 const pkg = JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
 const license = fs.readdirSync(dir).find(f => /^licen[cs]e(?:\.|$)/i.test(f));
 const licensePath = license ? path.join(dir,license) : path.join(root,'scripts/licenses',name+'.txt');
 if (!fs.existsSync(licensePath)) throw new Error('Missing license: '+name);
 notices += `\n${'='.repeat(72)}\n${name} ${pkg.version}\n${JSON.stringify(pkg.repository || '')}\n\n${fs.readFileSync(licensePath,'utf8')}\n`;
 for (const dep of Object.keys(pkg.dependencies || {})) licenses(dep);
}
const graph = JSON.parse(fs.readFileSync(path.join(root,'node_modules/force-graph/package.json')));
for (const dep of Object.keys(graph.dependencies)) licenses(dep);
// Reading adapters borrow palette identities, with each upstream attribution retained.
const themeSources=JSON.parse(fs.readFileSync(path.join(root,'scripts/theme-sources.json'),'utf8'));
for(const source of themeSources){notices+=`\n${'='.repeat(72)}\n${source.name} — reading palette/style reference\n${source.url}\nSource blob: ${source.licenseBlob}\n\n${fs.readFileSync(path.join(root,'scripts/licenses/themes',source.license),'utf8')}\n`;}
const fontSources=JSON.parse(fs.readFileSync(path.join(root,'scripts/font-sources.json'),'utf8'));
for(const font of fontSources){const license=font.files.find(file=>file[0]==='OFL.txt');for(const [upstream,file,sha]of font.files){const target=path.join(root,upstream==='OFL.txt'?'scripts/licenses/fonts':'assets/fonts',file);const data=fs.readFileSync(target);const digest=require('node:crypto').createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');if(digest!==sha)throw Error('Font source mismatch: '+file);}notices+=`\n${'='.repeat(72)}\n${font.name} — offline reading font\n${font.url}\nPinned source: ${font.repository?'https://github.com/'+font.repository+'/tree/'+font.revision:'https://github.com/google/fonts/tree/'+(font.revision||'main')+'/ofl/'+font.directory}\n\n${fs.readFileSync(path.join(root,'scripts/licenses/fonts',license[1]),'utf8')}\n`;}
fs.writeFileSync(path.join(root,'assets/THIRD_PARTY_LICENSES.txt'),notices);
console.log('Offline assets + '+(visited.size+themeSources.length+fontSources.length)+' library, theme and font notices ready');
