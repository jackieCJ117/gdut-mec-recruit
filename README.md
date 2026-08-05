# 机创时报 CYBER 2026 · 机械创新团队秋季招新特刊

广工机械创新团队 2026 秋季招新网站 —— **未来式全息虚拟报刊**：3D 双开书刊，可翻页阅读。

- **形态**：6 个版面重组为 3 个跨页的 3D 书刊（P1 封面+关于 / P2 组别+战绩 / P3 报名+加入），当前跨页平摊居中，前后跨页 3D 侧立露出；翻页表演（合拢→滑动→展开）+ 点击两侧露出区即可翻页。
- **视觉**：浅色全息演绎队标色板（队标青 `#107090` + 金属蓝灰箔 `#B0B0D0→#9090B0→#707090`），全套零依赖 CSS 特效：彩虹箔、色差、glitch 故障字、噪点颗粒、扫描线、鼠标视差。
- **字体**：报头得意黑（自托管子集），正文系统黑体，英文 Orbitron。
- **占位**：群号/公众号/战绩/日期等为高级感占位动效（`LOADING DATA…` / `接通中… CONNECTING` / 呼吸 TBD），替换真实数据后动效自动停用。
- **手机端**（<900px）：自动降级为纵向流式报纸，内容完整无裁切，报名表单可用。

在线地址：`https://jackieCJ117.github.io/gdut-mec-recruit/`（GitHub Pages）

---

## 一、本地预览

```bash
cd "C:\Users\Lenovo\Desktop\招新网站创建"
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

- 桌面（≥900px）：3D 双开书刊，翻页交互（键盘 / 按钮 / 拖拽 / 点击露出区 / 底部轨道）
- 手机（<900px）：纵向流式报纸，页面整体滚动

## 二、文件结构

```
├── index.html          # 全部版面与占位文案（改内容就改这里）
├── css/
│   ├── base.css        # 设计 tokens（色板/字体）+ 布局基座 + 背景层
│   ├── cover.css       # 封面
│   ├── paper.css       # 内页纸面 + 表单
│   ├── book3d.css      # 3D 书刊形态（跨页/书脊/姿态/流式降级）
│   └── holo.css        # 全息视觉语言（箔/色差/glitch/噪点/占位动效）
├── js/
│   ├── book.js         # 3D 书刊引擎（跨页切换 + 流式分支）
│   ├── form.js         # 报名表单校验 + 本地暂存
│   └── fx.js           # 占位动效 + 鼠标视差
└── assets/
    ├── logo.png        # 队标（已压缩，直接替换同名文件即可）
    ├── fonts/          # 得意黑 woff2 子集（自托管）
    └── 报名表原版.docx  # 供新生下载的原版报名表
```

## 三、占位内容替换指南

所有占位都集中在 **`index.html`**，按版面对照查找替换：

| 版面 | 需替换内容 |
|---|---|
| 封面 | 「EST. 20XX」成立年份（`<span class="glitch" data-text="20XX">`，换真值后删 glitch 类）、大标题「下一台改变世界的机器，等你来造」 |
| 01 关于团队 | 团队简介两段文字、队训、三个数字（`data-count` 属性换成真实值） |
| 02 组别矩阵 | 四组职责与技能标签 |
| 03 战绩与日程 | 成就卡 `N×`（flick-target）、`LOADING DATA` 标签、招新时间轴三个 `tbd` 日期 |
| 04 报名指南 | 群号/截止时间等（`data-placeholder` 处）；报名邮箱在 `js/form.js` 的 `CONTACT_EMAIL` |
| 06 加入我们 | QQ 群号/公众号（`connect-anim`，换真值后删该类）、二维码（`qr--holo` 占位图形换真实图片） |

- **占位动效自动停用规则**：文本仍含 `X / 占位 / N× / 20XX` 时 fx.js 才启用动效；替换为真实文本（并清理 `data-count`、`glitch`/`connect-anim`/`tbd` 等标记）即停用。
- **配图**：内页配图目前是青色系几何占位（SVG），可用真实照片/作品图替换；队标直接替换 `assets/logo.png` 同名文件即可。
- **字体**：报头得意黑子集在 `assets/fonts/smiley-sans.woff2`，如需新增生僻字需重新子集化。

## 四、报名数据说明

- 报名表单**前端校验** → 写入浏览器 `localStorage`（键 `mec_application_2026`），支持草稿自动保存、刷新回填。
- 提交后生成「报名摘要」可一键复制，发邮件 `3607199098@qq.com` 完成报名（与原报名表流程一致）。
- **接后端**：在页面加载后定义 `window.MEC_SUBMIT_HOOK`（接收报名数据对象，返回 Promise），提交时自动调用；当前为空。

## 五、部署 / 更新

仓库：`jackieCJ117/gdut-mec-recruit`（公开，GitHub Pages 免费要求 public）。
改完代码后：

```bash
cd "C:\Users\Lenovo\Desktop\招新网站创建"
git add -A
git commit -m "update"
git push origin main
```

Push 后约 1 分钟 GitHub Actions 自动重新部署。
