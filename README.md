# 机创全息终端 CYBER 2026 · 机械创新团队招新通道

广工机械创新团队 2026 秋季招新网站 —— **JARVIS 风格全息终端界面**（深空暗底 + 深色玻璃面板 + 霓虹青发光）。

- **形态**：一次一屏的全息终端。6 个模块（启动屏 / 关于 / 组别 / 战绩 / 报名 / 加入），切换为 opacity + scale 空间淡入，像切换终端界面，不是翻书。
- **视觉**：深空黑蓝渐变底 + 深色玻璃面板（霓虹描边 + 外发光）+ 队标青 `#107090` / 霓虹青 `#2fc4dc` 发光语言；全套零依赖 CSS 特效：彩虹箔、色差、glitch 故障字、噪点颗粒、扫描线、光斑掠过、鼠标视差。
- **字体**：标题得意黑（自托管子集），正文系统黑体，英文 Orbitron。
- **占位**：群号/公众号/战绩/日期为高级感占位动效（`LOADING DATA…` / `接通中… CONNECTING` / 呼吸 TBD），替换真实数据后动效自动停用。
- **交互**：键盘方向键 / 底部导航按钮 / 模块编号 chips / 启动屏进入按钮；报名表单面板内滚动，提交按钮滚动可达。

在线地址：`https://jackieCJ117.github.io/gdut-mec-recruit/`（GitHub Pages）

---

## 一、本地预览

```bash
cd "C:\Users\Lenovo\Desktop\招新网站创建"
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

桌面与手机均一次一屏淡入切换；手机端面板内滚动。

## 二、文件结构

```
├── index.html          # 全部模块与占位文案（改内容就改这里）
├── css/
│   ├── base.css        # 设计 tokens（深色色板/字体）+ 终端布局 + 背景层
│   ├── cover.css       # 启动屏（深色霓虹欢迎界面）
│   ├── paper.css       # 内容面板（卡片/表单/时间轴）
│   ├── screen.css      # 一次一屏淡入过渡 + 面板滚动
│   └── holo.css        # 全息视觉语言（箔/色差/glitch/噪点/占位动效）
├── js/
│   ├── book.js         # 淡入切换引擎（键盘/按钮/chips）
│   ├── form.js         # 报名表单校验 + 本地暂存
│   └── fx.js           # 占位动效 + 鼠标视差
└── assets/
    ├── logo.png        # 队标（已压缩，直接替换同名文件即可）
    ├── fonts/          # 得意黑 woff2 子集（自托管）
    └── 报名表原版.docx  # 供新生下载的原版报名表
```

## 三、占位内容替换指南

所有占位都集中在 **`index.html`**，按模块对照查找替换：

| 模块 | 需替换内容 |
|---|---|
| 01 启动屏 | 「EST. 20XX」成立年份（`<span class="glitch" data-text="20XX">`，换真值后删 glitch 类）、大标语「下一台改变世界的机器，等你来造」 |
| 02 关于 | 团队简介两段文字、队训、三个数字（`data-count` 属性换成真实值） |
| 03 组别矩阵 | 四组职责与技能标签 |
| 04 战绩与日程 | 成就卡 `N×`（flick-target）、`LOADING DATA` 标签、招新时间轴三个 `tbd` 日期 |
| 05 报名 | 群号/截止时间等（`data-placeholder` 处）；报名邮箱在 `js/form.js` 的 `CONTACT_EMAIL` |
| 06 加入我们 | QQ 群号/公众号（`connect-anim`，换真值后删该类）、二维码（`qr--holo` 占位图形换真实图片） |

- **占位动效自动停用规则**：文本仍含 `X / 占位 / N× / 20XX` 时 fx.js 才启用动效；替换为真实文本（并清理 `data-count`、`glitch`/`connect-anim`/`tbd` 等标记）即停用。
- **配图**：内容区配图目前是青色系几何占位（SVG），可用真实照片/作品图替换；队标直接替换 `assets/logo.png` 同名文件即可。
- **字体**：标题得意黑子集在 `assets/fonts/smiley-sans.woff2`，如需新增生僻字需重新子集化。

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
