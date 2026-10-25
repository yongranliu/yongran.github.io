import json,urllib.request,concurrent.futures,time
from pathlib import Path
ROOT=Path(__file__).parent
p=ROOT/'dist/data.json';d=json.loads(p.read_text());out=ROOT/'dist/assets';out.mkdir(exist_ok=True)
def download(r):
 dest=out/f"{r['id']}.jpg"
 if dest.exists():return r['id'],True
 for attempt in range(2):
  try:
   req=urllib.request.Request(r['coverUrl'],headers={'User-Agent':'HaoranAnimeJournal/1.0','Referer':'https://bgm.tv/'})
   with urllib.request.urlopen(req,timeout=15) as resp: b=resp.read()
   if len(b)<300:raise ValueError('Empty image')
   dest.write_bytes(b);return r['id'],True
  except Exception:
   if attempt: return r['id'],False
 return r['id'],False
result={}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
 for i,(rid,ok) in enumerate(pool.map(download,d['records'])):
  result[rid]=ok
  if (i+1)%40==0:print(f'Covers: {i+1}/{len(d["records"])}',flush=True)
for r in d['records']:
 if result.get(r['id']):r['cover']=f"assets/{r['id']}.jpg"
try:
 req=urllib.request.Request(d['user']['avatar'],headers={'User-Agent':'HaoranAnimeJournal/1.0'})
 (out/'avatar.jpg').write_bytes(urllib.request.urlopen(req,timeout=15).read());d['user']['localAvatar']='assets/avatar.jpg'
except Exception:pass
p.write_text(json.dumps(d,ensure_ascii=False))
print(json.dumps({'saved':sum(result.values()),'missing':[rid for rid,ok in result.items() if not ok]}),flush=True)
