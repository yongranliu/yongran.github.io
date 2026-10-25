# 帧间 · 豪然的番剧手账

个人番剧手账网站，数据来自我的 [Bangumi 收藏](https://bangumi.tv/user/1152693)。纯静态网站，用 GitHub Pages 托管。

- `index.html` 页面结构，`style.css` 样式，`app.js` 交互，`music.js` 配乐控制
- `data.json`、`metadata.json`：收藏快照与条目信息；页面里的「更新收藏」会实时读取 Bangumi
- `assets/`：封面、首页横图、字体、配乐

本地预览：`python3 -m http.server 8000`，然后打开 http://localhost:8000 。

图片、动画、音乐版权归各自权利人，来源见网站页脚。
