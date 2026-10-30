import re, sys, pathlib
src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
out = pathlib.Path(sys.argv[2])
title = re.search(r'<title>(.*?)</title>', src, re.S).group(1)
tpl = re.search(r'<x-dc>(.*?)</x-dc>', src, re.S).group(1)
logic = re.search(r'<script type="text/x-dc" data-dc-script[^>]*>(.*?)</script>', src, re.S).group(1)
assert '</script' not in tpl and '</script' not in logic
html = f'''<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="持衡：个人资产管理看板，含收支变化、资产配置、持仓明细与多币种换算（示例数据）。">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%231F2A44'/%3E%3Cpath d='M16 7v17M10 24h12M8 11h16' stroke='%23F4E8B8' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E">
</head>
<body>
<div id="dc-root"></div>
<script type="text/x-dc-template" id="dc-template">{tpl}</script>
<script type="text/x-dc" data-dc-script>{logic}</script>
<script src="dc-lite.js"></script>
</body>
</html>
'''
out.write_text(html, encoding='utf-8')
print('wrote', out, len(html))
