import json,urllib.request,concurrent.futures,time,collections,datetime
from pathlib import Path
ROOT=Path(__file__).parent
UA='HaoranAnimeJournal/1.0 (personal collection archive)'
def get(url):
 for i in range(3):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':UA})
   with urllib.request.urlopen(req,timeout=25) as r:return json.load(r)
  except Exception:
   if i==2:raise
   time.sleep(1)
def page(offset):return get(f'https://api.bgm.tv/v0/users/1152693/collections?subject_type=2&limit=50&offset={offset}')
user=get('https://api.bgm.tv/v0/users/1152693')
first=page(0);pages=[first]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 pages+=list(pool.map(page,range(50,first['total'],50)))
rows=[r for p in pages for r in p['data']]
assert len(rows)==first['total'],(len(rows),first['total'])
assert len({r['subject_id'] for r in rows})==len(rows)
raw={'user':user,'total':first['total'],'fetched_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'collections':rows}
(ROOT/'source-data/bangumi-original.json').write_text(json.dumps(raw,ensure_ascii=False,indent=2))
records=[]
for r in rows:
 s=r['subject'];records.append({'id':s['id'],'title':s['name_cn'] or s['name'],'originalTitle':s['name'],'status':r['type'],'rating':r['rate'],'comment':r['comment'] or '', 'userTags':r['tags'],'tags':[t['name'] for t in s.get('tags',[])[:12]],'date':s.get('date') or '', 'episodes':s.get('eps',0),'progress':r.get('ep_status',0),'updatedAt':r['updated_at'],'summary':s.get('short_summary',''),'coverUrl':s.get('images',{}).get('common',''),'cover':'','globalScore':s.get('score',0),'rank':s.get('rank',0),'type':s.get('type',2)})
data={'version':1,'user':{'id':user['id'],'nickname':user['nickname'],'avatar':user['avatar']['large'],'url':user['url']},'fetchedAt':raw['fetched_at'],'source':'https://bangumi.tv/user/1152693','total':len(records),'records':records}
(ROOT/'dist/data.json').write_text(json.dumps(data,ensure_ascii=False))
print(json.dumps({'total':len(rows),'status_counts':dict(collections.Counter(r['status'] for r in records)),'rated':sum(bool(r['rating']) for r in records),'comments':sum(bool(r['comment']) for r in records),'top_rated':[{k:r[k] for k in ['id','title','rating']} for r in sorted(records,key=lambda r:r['rating'],reverse=True)[:15]],'sample':rows[0]},ensure_ascii=False),flush=True)
