import json,urllib.request,concurrent.futures,datetime
from pathlib import Path
ROOT=Path(__file__).parent
raw=json.loads((ROOT/'dist/data.json').read_text()); cache=ROOT/'source-data/subjects';cache.mkdir(exist_ok=True)
def get(r):
 p=cache/f"{r['id']}.json"
 try:
  if p.exists():s=json.loads(p.read_text())
  else:
   req=urllib.request.Request(f"https://api.bgm.tv/v0/subjects/{r['id']}",headers={'User-Agent':'HaoranAnimeJournal/1.0 (personal archive)'})
   with urllib.request.urlopen(req,timeout=20) as resp:s=json.load(resp)
   p.write_text(json.dumps(s,ensure_ascii=False))
  return r['id'],{k:s.get(k) for k in ['date','platform','summary','eps']}
 except Exception as e:return r['id'],{'error':str(e)}
metadata={}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 for i,(rid,s) in enumerate(pool.map(get,raw['records'])):
  metadata[str(rid)]=s
  if (i+1)%50==0:print('Metadata:',i+1,flush=True)
(ROOT/'dist/metadata.json').write_text(json.dumps(metadata,ensure_ascii=False))
print(json.dumps({'metadata_saved':sum('error' not in s for s in metadata.values()),'errors':{rid:s for rid,s in metadata.items() if 'error' in s}}),flush=True)
