# 持衡 · 资产管理：项目复盘与交接（精简版）

完整版（含时间线、每个坑的损失与对策）在 Claude 文档「持衡 · 资产管理系统：项目复盘与交接文档」。

## 怎么改、怎么发

```bash
cd asset-manager
python3 build.py source/Main.dc.html index.html   # 生成 index.html（不要手改它）
python3 -m http.server 8000                        # 打开 http://localhost:8000
```

- 唯一真源：`source/Main.dc.html`（样式 + 模板 + 逻辑）。`index.html` 是生成物，`dc-lite.js` 是独立运行时。
- 示例数据：`getData()`（持仓/负债/类别）与 `getSeed()`（流水生成器）。汇率：`getData().currencies[].perUSD`。默认币种：`renderVals()` 里状态默认值 `disp`。
- 模板写法：占位只用 `{{a.b}}`；条件 `<sc-if value="{{x}}">`，循环 `<sc-for list="{{xs}}" as="x">`；事件 `onClick/onMouseEnter/onFocus/onChange`；非空元素必须闭合。
- 线上地址：https://yongranliu.github.io/yongran.github.io/asset-manager/ （项目站，不是 yongranliu.github.io/asset-manager/）。

## 数据

金额统一以新台币存储、展示时按汇率换算。导入支持三类 CSV（流水/持仓/负债），编码自动识别 UTF-8 / Big5 / GB18030，日期支持民国年。本机存储键：`chiheng.userTxs.v1`、`chiheng.userHold.v1`、`chiheng.userLiab.v1`、`chiheng.useSample.v1`、`chiheng.disp.v1`。

## 做得好的

- 每次改动都截图自查，版面问题自己先发现。
- 动画用「切换 class 重播 + 缓动状态」一套机制。
- 金额基准币种存储、日期用整天序号，日/周/月与上期对比没有时区和月末错位。
- 一份源码、两处发布（设计稿 + GitHub Pages）。

## 耽误时间的

- 风格没先对齐，整套重做 3 次（深色科技风 → 浅色普通 → 暖纸拼贴）。**对策**：先出 2–3 张草图让用户选。
- 线上地址没打开就给用户，还给错了。**对策**：交付前自己打开真实地址。
- 数据入口（记一笔、导入）到第 8 轮才做。**对策**：财务类产品第一版就要有。
- 沙箱里字体加载不了，始终没看到真实字体效果。**对策**：字体自托管。
- 编辑器里用户手动保存导致发布被拒、覆盖手改；Git 远程跟踪记录缺失导致 Stop 钩子误报；GraphQL 禁用导致 `gh pr create` 失败（改用 `gh api repos/<仓库>/pulls`）。

## 已知限制与下一步

数据只在本机浏览器（无导出/备份）；汇率与市值非实时；净资产曲线是推算值；无预算/订阅识别/报表导出。建议顺序：导出备份 → 预算与超支提醒 → 字体自托管 → 汇率一键更新（GitHub 版）→ 为 `parseImport` 补单元测试。
