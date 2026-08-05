# 机创时报 CYBER 2026 · 机械创新团队秋季招新特刊

广工机械创新团队 2026 秋季招新网站 —— **未来式虚拟报纸**，可翻页阅读。
配色取自队标青 `#176388`，封面深黑霓虹 + 内页浅色纸面。报名表内容照抄团队官方 docx，做成网页可填写表单（数据暂存本机浏览器，后端后续接入）。

在线地址：`https://jackieCJ117.github.io/gdut-mec-recruit/`（GitHub Pages）

---

## 一、本地预览

```bash
cd "C:\Users\Lenovo\Desktop\招新网站创建"
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

- 桌面（≥900px）：左右双页书刊，翻页交互
- 手机（<900px）：自动降级为纵向滑动报纸

## 二、文件结构

```
├── index.html          # 全部版面与占位文案（改内容就改这里）
├── css/
│   ├── base.css        # 设计 tokens（色板/字体）+ 3D 翻页基座
│   ├── cover.css       # 封面深黑霓虹
│   └── paper.css       # 内页纸面 + 表单
├── js/
│   ├── book.js         # 翻页引擎（键盘/按钮/滑动/页角）
│   └── form.js         # 报名表单校验 + 本地暂存
└── assets/
    ├── logo.png        # 队标（已压缩，直接替换同名文件即可）
    └── 报名表原版.docx  # 供新生下载的原版报名表
```

## 三、占位内容替换指南

所有占位都集中在 **`index.html`**，按版面对照查找替换：

| 版面 | 需替换内容 |
|---|---|
| 封面 | 「EST. 20XX」成立年份、大标题「下一台改变世界的机器，等你来造」 |
| 01 关于团队 | 团队简介两段文字、队训「精益·创新·协作·突破」、三个数字（成立/成员/奖项） |
| 02 组别矩阵 | 四个组别的职责与「适合谁」描述、技能标签 |
| 03 战绩与日程 | 三个成就卡（`data-placeholder` 标注处）、招新时间轴四个日期 |
| 04 报名指南 | 群号/截止时间等（`data-placeholder` 处）；报名邮箱在 `js/form.js` 的 `CONTACT_EMAIL` |
| 06 加入我们 | QQ 群号、公众号名、二维码（`qr` 区目前是占位图形） |

- **配图**：内页配图目前是青色系几何占位（SVG），可用真实照片/作品图替换；队标直接替换 `assets/logo.png` 同名文件即可。
- **邮箱/联系方式**：`js/form.js` 顶部 `CONTACT_EMAIL`。

## 四、报名数据说明

- 报名表单**前端校验** → 写入浏览器 `localStorage`（键 `mec_application_2026`），并支持草稿自动保存、刷新回填。
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
