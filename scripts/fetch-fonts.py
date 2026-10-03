"""Optional maintainer command: download pinned, unmodified Google Fonts binaries and OFL notices.
The normal APK build uses the checked-in files and makes no font requests.
"""
import base64,concurrent.futures,hashlib,json,urllib.request,urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
sources=json.loads((ROOT/'scripts/font-sources.json').read_text())
font_dir=ROOT/'assets/fonts';font_dir.mkdir(exist_ok=True)
licenses=ROOT/'scripts/licenses/fonts';licenses.mkdir(parents=True,exist_ok=True)
def fetch(item):
 source,(name,dest,sha)=item
 if source.get('revision'):
  repo=source.get('repository','google/fonts')
  prefix='' if source.get('repository') else 'ofl/'+source['directory']+'/'
  url='https://raw.githubusercontent.com/'+repo+'/'+source['revision']+'/'+prefix+urllib.parse.quote(name)
  binary=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Nightwire-offline-fonts'}),timeout=30).read()
 else:
  request=urllib.request.Request('https://api.github.com/repos/google/fonts/git/blobs/'+sha,headers={'User-Agent':'Nightwire-offline-fonts'})
  data=json.loads(urllib.request.urlopen(request,timeout=30).read())
  binary=base64.b64decode(data['content'])
 assert hashlib.sha1(('blob '+str(len(binary))+'\0').encode()+binary).hexdigest()==sha,'Upstream font blob mismatch'
 target=(licenses if name=='OFL.txt' else font_dir)/dest
 target.write_bytes(binary)
 return dest,len(binary)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for name,size in pool.map(fetch,[(source,file) for source in sources for file in source['files']]):print(name,size)
