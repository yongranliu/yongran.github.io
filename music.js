'use strict';
// Old Memory is supplied by the owner; other remote recordings are not cached.
const SOUNDTRACKS=[
 {key:'old-memory',title:'Old Memory',artist:'市川淳',note:'默认背景音乐 · 缘之空',source:'assets/old-memory.mp3',bundled:true,link:'https://music.163.com/song?id=477982'},
 {key:'yuugao',title:'夕顔',artist:'能登麻美子',note:'校园迷糊大王 · 打开番剧时切换',source:'https://music.163.com/song/media/outer/url?id=624670.mp3',link:'https://music.163.com/song?id=624670'},
 {key:'futari',title:'两人的心情',original:'ふたりの気持ち',artist:'和田薫',note:'犬夜叉 · 打开番剧时切换',source:null,link:'https://www.kaoru-wada.com/'},
 {key:'wakare2',title:'分别2',original:'別れ2',artist:'松谷卓',note:'白兔糖 · 打开番剧时切换',source:null,link:'https://www.sonymusic.co.jp/artist/SuguruMatsutani/discography/ESCL-3747'},
 {key:'cocoon',title:'cocoon',artist:'林ゆうき',note:'三角迷踪 · 背景歌单',source:'https://music.163.com/song/media/outer/url?id=499818.mp3',link:'https://open.spotify.com/track/0zJ3BCfoyRysii4g5lC7Bc'}
];
let musicController=null;
function soundtrackForAnime(r){return /校园迷糊大王/.test(r.title)?1:/^犬夜叉/.test(r.title)?2:r.id===10843?3:null;}
function initMusic(){
 const audio=document.querySelector('#bgmAudio'),welcome=document.querySelector('#welcomeDialog'),dialog=document.querySelector('#musicDialog');
 const get=s=>document.querySelector(s),localSources=new Map(),failed=new Set();
 let index=0,mode='list',wanted=true,loading=false,errorText='',requestId=0,uploadKey=null,loadTimer;
 const preferenceKey='frame-notes-music-v2';
 try{const p=JSON.parse(localStorage.getItem(preferenceKey)||'null');if(p){wanted=p.enabled!==false;audio.volume=Math.max(0,Math.min(1,p.volume??.25));mode=p.mode==='one'?'one':'list';}else audio.volume=.25;}catch{audio.volume=.25;}
 function current(){return SOUNDTRACKS[index];}
 function save(){try{localStorage.setItem(preferenceKey,JSON.stringify({enabled:wanted,volume:audio.volume,mode}));}catch{}}
 function source(t){return localSources.get(t.key)||t.source;}
 function readyIndices(){return SOUNDTRACKS.map((t,i)=>t.bundled||localSources.has(t.key)?i:-1).filter(i=>i>=0);}
 function nextReadyIndex(){const ready=readyIndices();return ready.find(i=>i>index)??ready[0]??index;}
 function renderList(){get('#musicList').innerHTML=SOUNDTRACKS.map((t,i)=>`<div class="music-row ${index===i?'selected':''}"><button class="choose-track" data-track="${i}" aria-label="播放${esc(t.title)}"><span class="track-number">${index===i?'♫':String(i+1).padStart(2,'0')}</span><span><b>${esc(t.title)}${t.original?`<small>${esc(t.original)}</small>`:''}</b><span>${esc(t.artist)} · ${esc(t.note)}</span><em>${localSources.has(t.key)?'本机音频已就绪':t.bundled?'站内完整音频 · 已就绪':!t.source?'待添加音源':failed.has(t.key)?'外部音源暂不可用':'网易云音乐 · 外部音源'}</em></span></button><div class="track-actions"><button class="text-btn" data-upload-track="${esc(t.key)}">选择音频</button><a href="${esc(t.link)}" target="_blank" rel="noopener noreferrer" aria-label="查看${esc(t.title)}来源">↗</a></div></div>`).join('');}
 function update(){const playing=!audio.paused&&!audio.ended&&!errorText;get('.music-player').classList.toggle('is-playing',playing);get('#musicTitle').textContent=current().title;get('#musicGlyph').textContent=loading?'…':playing?'Ⅱ':'▶';get('#musicToggle').setAttribute('aria-pressed',String(playing));get('#musicToggle').setAttribute('aria-label',playing?'暂停背景音乐':'播放背景音乐');get('#musicState').textContent=errorText||(loading?'正在连接音源…':current().artist+' · '+(playing?'正在播放':wanted?'点击播放':'已暂停'));get('#musicLoop').textContent=mode==='one'?'↻₁':'↻';get('#musicLoop').title=mode==='one'?'单曲循环':'列表循环';get('#musicLoop').setAttribute('aria-label',(mode==='one'?'单曲循环':'列表循环')+'，点击切换');get('#musicVolume').value=Math.round(audio.volume*100);get('#volumeValue').value=Math.round(audio.volume*100)+'%';audio.loop=mode==='one'||(readyIndices().length===1&&readyIndices().includes(index));renderList();}
 function failure(message){clearTimeout(loadTimer);loading=false;errorText=message;failed.add(current().key);get('#musicMessage').textContent=current().title+'：'+message+'。可以选择本机音频后播放。';update();}
 async function play(){const mine=++requestId;clearTimeout(loadTimer);const src=source(current());errorText='';if(!src){failure('待添加音源 · 点击歌单');return;}if(audio.getAttribute('src')!==src){audio.pause();audio.setAttribute('src',src);audio.load();}loading=true;update();loadTimer=setTimeout(()=>{if(mine===requestId){audio.pause();failure('连接超时 · 点击歌单重试');}},12000);
  try{await audio.play();if(mine!==requestId)return;clearTimeout(loadTimer);loading=false;errorText='';failed.delete(current().key);update();}catch(e){if(mine!==requestId)return;clearTimeout(loadTimer);loading=false;if(e.name==='NotAllowedError'){errorText='点击播放，开启背景音乐';update();if(!document.querySelector('dialog[open]'))welcome.showModal();}else if(e.name!=='AbortError'){failure('音源暂不可用 · 点击歌单');}else update();}
 }
 function select(i,shouldPlay=wanted){++requestId;clearTimeout(loadTimer);audio.pause();index=(i+SOUNDTRACKS.length)%SOUNDTRACKS.length;loading=false;errorText='';audio.removeAttribute('src');audio.load();update();if(shouldPlay)play();}
 function pause(){wanted=false;++requestId;clearTimeout(loadTimer);loading=false;audio.pause();audio.removeAttribute('src');audio.load();errorText='';save();update();}
 get('#musicToggle').addEventListener('click',()=>{if(!audio.paused||loading)pause();else{wanted=true;save();play();}});
 get('#musicNext').addEventListener('click',()=>{if(readyIndices().length===1&&readyIndices()[0]===index){toast('目前已接入 Old Memory，其他歌曲可在歌单中补充音源。');return;}select(nextReadyIndex());});
 get('#musicLoop').addEventListener('click',()=>{mode=mode==='one'?'list':'one';save();update();});
 get('#openMusic').addEventListener('click',()=>{renderList();dialog.showModal();});
 get('#musicVolume').addEventListener('input',e=>{audio.volume=Number(e.target.value)/100;save();update();});
 audio.addEventListener('playing',()=>{clearTimeout(loadTimer);loading=false;errorText='';update();});
 audio.addEventListener('pause',update);
 audio.addEventListener('ended',()=>{if(wanted)select(mode==='one'?index:nextReadyIndex(),true);});
 audio.addEventListener('error',()=>{if(wanted&&audio.hasAttribute('src'))failure('音源暂不可用 · 点击歌单');});
 dialog.addEventListener('click',e=>{const track=e.target.closest('[data-track]');if(track){wanted=true;save();select(Number(track.dataset.track),true);}const upload=e.target.closest('[data-upload-track]');if(upload){uploadKey=upload.dataset.uploadTrack;get('#localMusicFile').click();}});
 get('#localMusicFile').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f||!uploadKey)return;if(f.size>80*1024*1024){get('#musicMessage').textContent='请选择 80 MB 以内的音频文件。';return;}const old=localSources.get(uploadKey);if(old)URL.revokeObjectURL(old);localSources.set(uploadKey,URL.createObjectURL(f));failed.delete(uploadKey);get('#musicMessage').textContent='已为 '+SOUNDTRACKS.find(t=>t.key===uploadKey).title+' 选择 '+f.name+'。';const target=SOUNDTRACKS.findIndex(t=>t.key===uploadKey);wanted=true;save();select(target,true);e.target.value='';});
 get('#welcomePlay').addEventListener('click',()=>{welcome.close();wanted=true;save();play();});
 for(const s of ['#welcomeQuiet','#welcomeClose'])get(s).addEventListener('click',()=>{welcome.close();pause();});
 welcome.addEventListener('cancel',pause);
 musicController={selectTrack(i){select(i);renderList();dialog.showModal();},open(){renderList();dialog.showModal();},forAnime(r){const target=soundtrackForAnime(r);if(target!==null&&target!==index){if(SOUNDTRACKS[target].bundled||localSources.has(SOUNDTRACKS[target].key))select(target);else toast('《'+SOUNDTRACKS[target].title+'》音源待补，当前背景音乐保持不变。');}}};
 update();if(wanted)play();
}
