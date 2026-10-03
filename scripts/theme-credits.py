import urllib.request,json,base64,concurrent.futures
from pathlib import Path
sources=json.loads(Path('scripts/theme-sources.json').read_text())
out=Path('scripts/licenses/themes');out.mkdir(parents=True,exist_ok=True)
def fetch(source):
 url='https://api.github.com/repos/'+source['repo']+'/contents/'+source.get('upstreamFile','LICENSE')
 request=urllib.request.Request(url,headers={'User-Agent':'Nightwire-theme-adapters','Accept':'application/vnd.github+json'})
 data=json.loads(urllib.request.urlopen(request,timeout=15).read())
 text=base64.b64decode(data['content']).decode()
 if source['id']=='gruvbox':
  text='Source: '+source['url']+'\n\n'+ '\n'.join(text.splitlines()[:8])+'\n'
  readme=json.loads(urllib.request.urlopen('https://api.github.com/repos/'+source['repo']+'/contents/README.md',timeout=15).read())
  body=base64.b64decode(readme['content']).decode()
  import re
  match=re.search(r'(?m)^\[MIT/X11\]\[\]\s*$',body)
  if not match:raise ValueError('Missing Gruvbox license section')
  text+='\nUpstream README license:\n'+match.group(0).strip()+'\n[MIT/X11]: https://en.wikipedia.org/wiki/MIT_License\n'
  source['readmeLicenseBlob']=readme['sha']
 (out/source['license']).write_text(text)
 source['licenseBlob']=data['sha']
 return source
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 results=list(pool.map(fetch,sources))
Path('scripts/theme-sources.json').write_text(json.dumps(results,indent=2)+'\n')
print('Stored five upstream licenses with pinned GitHub blob IDs.')
