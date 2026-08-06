/* ============================================================
   机创全息终端 CYBER 2026 · holo-tip.js
   全息小知识悬浮窗（按屏配置版）：
   - 每个内容屏配置自己的弹窗组（位置 / 数量 / 大小各不相同）
   - 翻屏自动切换：进入某屏弹出该屏第一条知识
   - FAB 按钮与「下一条」在当前屏列表内循环
   改内容/配置就改顶部 TIP_SCREENS
   ============================================================ */
(function () {
  "use strict";

  /* ============================================================
     弹窗配置：键 = 屏号（1-9）
     每条：title 标题 | text 正文 | list 条目数组 | tags 标签数组
           pos 位置 | size 大小 | mode 显示模式
     pos: 预设 tl/tr/bl/br/ml/mr/mt（角落/贴边，不挡正文），或自由坐标 {x, y}
     size: sm 小(300×170-260) / md 中(420×260-370) / lg 大(560×360-500)
     mode: one 单条显示（默认，FAB 循环）| all 同屏同时显示全部（上限 3）
     纵向对比技巧：大窗给 list+tags（内容多自然高），小窗只给 text（紧凑）
     ============================================================ */
  var TIP_SCREENS = {
    1: [
      { title: "机创冷知识 01", pos: "br", size: "lg",
        text: "【占位】有趣小知识一：<em>例如机创的冷知识、团队趣闻、比赛轶事。</em>",
        list: ["【占位】小知识延伸要点一", "【占位】小知识延伸要点二", "【占位】小知识延伸要点三"],
        tags: ["趣味", "冷知识", "机创"] }
    ],
    2: [
      { title: "机创冷知识 02", pos: "tl", size: "sm", mode: "all",
        text: "【占位】有趣小知识二：<em>关于机创团队的冷知识。</em>" },
      { title: "机创冷知识 03", pos: "tr", size: "md", mode: "all",
        text: "【占位】有趣小知识三：<em>关于招新季的隐藏彩蛋。</em>",
        list: ["【占位】彩蛋详情一", "【占位】彩蛋详情二"] },
      { title: "机创冷知识 04", pos: "bl", size: "lg", mode: "all",
        text: "【占位】有趣小知识四：<em>关于团队从图纸到赛场的历程。</em>",
        list: ["【占位】历程要点一", "【占位】历程要点二", "【占位】历程要点三"],
        tags: ["历史", "赛场", "机创"] }
    ],
    3: [
      { title: "结构组冷知识", pos: "bl", size: "lg",
        text: "【占位】结构组相关小知识：<em>例如零件命名、图纸上的小讲究。</em>",
        list: ["【占位】结构细节一", "【占位】结构细节二", "【占位】结构细节三"],
        tags: ["SolidWorks", "机构", "3D 打印"] }
    ],
    4: [
      { title: "电控组冷知识 01", pos: "tl", size: "sm", mode: "all",
        text: "【占位】电控组相关小知识一。" },
      { title: "电控组冷知识 02", pos: "tr", size: "md", mode: "all",
        text: "【占位】电控组相关小知识二。",
        list: ["【占位】电控细节一", "【占位】电控细节二"] },
      { title: "电控组冷知识 03", pos: "bl", size: "lg", mode: "all",
        text: "【占位】电控组相关小知识三：<em>从点亮灯珠到驱动整机。</em>",
        list: ["【占位】开发要点一", "【占位】开发要点二", "【占位】开发要点三"],
        tags: ["单片机", "C 语言", "电路"] }
    ],
    5: [
      { title: "视觉组冷知识", pos: "tr", size: "lg",
        text: "【占位】视觉识别组相关小知识：<em>例如训练模型时的趣事。</em>",
        list: ["【占位】算法趣事一", "【占位】算法趣事二", "【占位】算法趣事三"],
        tags: ["OpenCV", "深度学习", "YOLO"] }
    ],
    6: [
      { title: "运营组冷知识 01", pos: "tl", size: "sm", mode: "all",
        text: "【占位】运营组相关小知识一。" },
      { title: "运营组冷知识 02", pos: "br", size: "md", mode: "all",
        text: "【占位】运营组相关小知识二。",
        list: ["【占位】运营细节一", "【占位】运营细节二"] }
    ],
    7: [
      { title: "备赛冷知识", pos: "tr", size: "md",
        text: "【占位】备赛期的小知识：<em>例如赛场上的规矩与趣闻。</em>",
        list: ["【占位】赛场规矩一", "【占位】赛场规矩二"] }
    ],
    8: [
      { title: "报名小提示", pos: "br", size: "sm",
        text: "【占位】报名相关的小提示/冷知识。" }
    ],
    9: [
      { title: "加入冷知识 01", pos: "tl", size: "sm", mode: "all",
        text: "【占位】加入我们相关小知识一。" },
      { title: "加入冷知识 02", pos: "tr", size: "md", mode: "all",
        text: "【占位】加入我们相关小知识二。",
        list: ["【占位】加入细节一", "【占位】加入细节二"] },
      { title: "加入冷知识 03", pos: "bl", size: "lg", mode: "all",
        text: "【占位】加入我们相关小知识三：<em>从零基础到赛场。</em>",
        list: ["【占位】成长路径一", "【占位】成长路径二", "【占位】成长路径三"],
        tags: ["零基础", "传帮带", "参赛"] }
    ]
  };

  /* ============================================================
     渲染：惰性创建各屏弹窗 DOM
     ============================================================ */
  var tipsByScreen = {};   // 屏号 -> 弹窗元素数组
  var allTips = [];
  var currentScreen = 0;   // 当前激活屏
  var currentIdx = -1;     // 当前屏内显示索引
  var flatAll = [];        // 全部知识平铺（手机端全局循环用）

  Object.keys(TIP_SCREENS).forEach(function (k) {
    TIP_SCREENS[k].forEach(function (c) {
      flatAll.push(c);
    });
  });

  /* cfg 引用 -> 所在屏号（对象不能作 Map 键，用遍历查找） */
  function screenOf(cfg) {
    for (var k in TIP_SCREENS) {
      if (TIP_SCREENS[k].indexOf(cfg) !== -1) return k;
    }
    return null;
  }

  function isMobile() {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html) node.innerHTML = html;
    return node;
  }

  function buildTip(cfg) {
    /* wrapper 负责 fixed 定位（含居中 translate），holo-tip 本体负责开合动画 transform */
    var posIsFree = typeof cfg.pos === "object" && cfg.pos !== null;
    var wrap = el("div", "holo-tip__wrap pos--" + (posIsFree ? "xy" : cfg.pos));
    wrap.hidden = true;
    wrap._cfg = cfg;
    if (posIsFree) {
      wrap.style.setProperty("--tip-x", cfg.pos.x || "50%");
      wrap.style.setProperty("--tip-y", cfg.pos.y || "20%");
    }
    var tip = el("aside", "holo-tip size--" + (cfg.size || "md"));
    tip.setAttribute("role", "dialog");
    tip.setAttribute("aria-label", cfg.title);
    wrap.appendChild(tip);
    tip.appendChild(el("span", "holo-tip__scan"));
    /* 全息投影建立层：边框分段描边 + 投影闪光 */
    var frame = el("span", "holo-tip__frame");
    frame.innerHTML = '<span class="seg seg-t"></span><span class="seg seg-r"></span>' +
      '<span class="seg seg-b"></span><span class="seg seg-l"></span>';
    tip.appendChild(frame);
    tip.appendChild(el("span", "holo-tip__flash"));
    ["tl", "tr", "bl", "br"].forEach(function (pos) {
      tip.appendChild(el("span", "holo-tip__anchor holo-tip__anchor--" + pos));
    });

    var head = el("header", "holo-tip__head");
    head.appendChild(el("span", "holo-tip__head-ico", "◈"));
    head.appendChild(el("span", "holo-tip__title", cfg.title));
    var close = el("button", "holo-tip__close", "✕");
    close.type = "button";
    close.setAttribute("aria-label", "关闭");
    head.appendChild(close);
    tip.appendChild(head);

    var body = el("div", "holo-tip__body");
    body.appendChild(el("span", "holo-tip__placeholder-note", "CONTENT SLOT · 占位待替换"));
    if (cfg.text) body.appendChild(el("p", null, cfg.text));
    if (cfg.list) {
      var ul = el("ul", "holo-tip__list");
      cfg.list.forEach(function (item) { ul.appendChild(el("li", null, item)); });
      body.appendChild(ul);
    }
    if (cfg.tags) {
      var tags = el("div", "holo-tip__tags");
      cfg.tags.forEach(function (t) { tags.appendChild(el("span", "holo-tip__tag", t)); });
      body.appendChild(tags);
    }
    tip.appendChild(body);

    var foot = el("footer", "holo-tip__foot");
    /* 批量模式（mode all）同屏多窗时只留关闭按钮 */
    if (cfg.mode !== "all") {
      var nextBtn = el("button", "holo-tip__btn holo-tip__btn--primary", "下一条");
      nextBtn.type = "button";
      nextBtn.setAttribute("data-next", "");
      foot.appendChild(nextBtn);
    }
    var doneBtn = el("button", "holo-tip__btn", "我知道了");
    doneBtn.type = "button";
    doneBtn.setAttribute("data-close-tip", "");
    foot.appendChild(doneBtn);
    tip.appendChild(foot);
    return wrap;
  }

  /* 为每个屏构建弹窗（惰性：切到该屏才创建） */
  function ensureScreen(screenId) {
    if (tipsByScreen[screenId]) return;
    var list = (TIP_SCREENS[screenId] || []).map(buildTip);
    tipsByScreen[screenId] = list;
    list.forEach(function (tip) {
      document.body.appendChild(tip);
      allTips.push(tip);
    });
  }

  /* ============================================================
     显示 / 隐藏（wrap 是定位容器，内部 .holo-tip 是动画本体）
     ============================================================ */
  function tipEl(wrap) {
    return wrap ? wrap.querySelector(".holo-tip") : null;
  }

  function showTip(wrap) {
    hideAll(true);   /* 先清场：单条模式下只会有一个弹窗可见 */
    wrap.hidden = false;
    requestAnimationFrame(function () {
      var tip = tipEl(wrap);
      if (tip) tip.classList.add("is-open");
    });
  }

  /* 批量显示（mode all）：同屏多个弹窗同时出现 */
  function showBatch(wraps) {
    hideAll(true);
    wraps.forEach(function (w) {
      w.hidden = false;
      requestAnimationFrame(function () {
        var tip = tipEl(w);
        if (tip) tip.classList.add("is-open");
      });
    });
  }

  /* 隐藏：open 的走关闭动画，未 open 但可见的直接藏 */
  function hideAll(skipAnim) {
    allTips.forEach(function (wrap) {
      var tip = tipEl(wrap);
      if (!tip || wrap.hidden) return;
      if (tip.classList.contains("is-open")) {
        tip.classList.add("is-closing");
        tip.classList.remove("is-open");
        window.setTimeout(function () {
          tip.classList.remove("is-closing");
          wrap.hidden = true;
        }, skipAnim ? 0 : 240);
      } else {
        wrap.hidden = true;
      }
    });
  }

  /* —— 激活某屏（翻屏瞬间切换，旧窗同步消失） —— */
  function activateScreen(screenId) {
    if (screenId === currentScreen) return;
    currentScreen = screenId;
    currentIdx = -1;
    hideAll(true);
    var list = tipsByScreen[screenId];
    if (!list || !list.length) return;
    if (list[0]._cfg && list[0]._cfg.mode === "all") {
      showBatch(list);        /* 批量屏：全部同显 */
    } else {
      currentIdx = 0;
      showTip(list[0]);       /* 单条屏：显示第一条 */
    }
  }

  /* —— 下一条 —— */
  function next() {
    /* 手机长页模式：全局知识平铺循环（没有"屏"概念） */
    if (isMobile()) {
      var curIdx = -1;
      allTips.forEach(function (w) {
        if (!w.hidden && w._cfg) curIdx = flatAll.indexOf(w._cfg);
      });
      var nc = flatAll[(curIdx + 1) % flatAll.length];
      var s = screenOf(nc);
      if (s && !tipsByScreen[s]) ensureScreen(s);
      var list = s ? tipsByScreen[s] : [];
      var wrap = list.filter(function (w) { return w._cfg === nc; })[0];
      if (wrap) showTip(wrap);
      return;
    }
    /* 桌面：批量屏 FAB 重新弹出全部；单条屏屏内循环 */
    var list = tipsByScreen[currentScreen];
    if (!list || !list.length) return;
    if (list[0]._cfg && list[0]._cfg.mode === "all") {
      showBatch(list);
      return;
    }
    currentIdx = (currentIdx + 1) % list.length;
    showTip(list[currentIdx]);
  }

  /* ============================================================
     翻屏监听：MutationObserver 观察 .screen 的 is-active 切换
     ============================================================ */
  var activeScreen = function () {
    var s = document.querySelector(".screen.is-active");
    return s ? Number(s.getAttribute("data-screen")) : 0;
  };
  var observer = new MutationObserver(function () {
    var id = activeScreen();
    if (id) ensureScreen(id), activateScreen(id);
  });
  observer.observe(document.getElementById("viewport") || document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });

  /* —— 启动：自动弹出当前屏第一条（进入后 4 秒） —— */
  window.setTimeout(function () {
    var id = activeScreen();
    if (id) ensureScreen(id);
    activateScreen(id || 1, true);
  }, 4000);

  /* ============================================================
     交互绑定（事件委托）
     ============================================================ */
  var fab = document.getElementById("tipFab");
  if (fab) fab.addEventListener("click", next);

  /* 单独关闭一个 wrap（关闭动画） */
  function closeWrap(wrap) {
    var tip = tipEl(wrap);
    if (!tip || wrap.hidden) return;
    if (tip.classList.contains("is-open")) {
      tip.classList.add("is-closing");
      tip.classList.remove("is-open");
      window.setTimeout(function () {
        tip.classList.remove("is-closing");
        wrap.hidden = true;
      }, 240);
    } else {
      wrap.hidden = true;
    }
  }

  document.addEventListener("click", function (e) {
    var tip = e.target.closest(".holo-tip");
    if (!tip) return;
    var wrap = tip.closest(".holo-tip__wrap");
    if (!wrap) return;
    if (e.target.closest(".holo-tip__close") || e.target.closest("[data-close-tip]")) {
      closeWrap(wrap);
      currentIdx = -1;
    } else if (e.target.closest("[data-next]")) {
      next();
    }
  });

  /* —— ESC 关闭当前 —— */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") hideAll(false);
  });

  /* —— 标题栏拖动（仅桌面端精确指针） —— */
  if (!window.matchMedia("(pointer: coarse)").matches) {
    document.addEventListener("pointerdown", function (e) {
      var head = e.target.closest(".holo-tip__head");
      if (!head || e.target.closest(".holo-tip__close")) return;
      var tip = head.closest(".holo-tip");
      var wrap = tip ? tip.closest(".holo-tip__wrap") : null;
      if (!wrap) return;
      head.setPointerCapture(e.pointerId);
      /* 起点偏移基于 wrap（fixed 相对视口），保证从原位置开始跟随 */
      head._drag = {
        wrap: wrap,
        x: e.clientX - wrap.offsetLeft,
        y: e.clientY - wrap.offsetTop
      };
    });
    document.addEventListener("pointermove", function (e) {
      var head = e.target.closest(".holo-tip__head");
      if (!head || !head._drag) return;
      var wrap = head._drag.wrap;
      if (!wrap) return;
      var x = Math.min(Math.max(e.clientX - head._drag.x, -wrap.offsetWidth + 80), window.innerWidth - 80);
      var y = Math.min(Math.max(e.clientY - head._drag.y, 0), window.innerHeight - 40);
      wrap.style.right = "auto";
      wrap.style.left = x + "px";
      wrap.style.top = y + "px";
      wrap.style.bottom = "auto";
      wrap.style.transform = "none"; /* 拖动后取消居中对齐 */
    });
    document.addEventListener("pointerup", function (e) {
      var head = e.target.closest(".holo-tip__head");
      if (head && head._drag) delete head._drag;
    });
  }
})();
