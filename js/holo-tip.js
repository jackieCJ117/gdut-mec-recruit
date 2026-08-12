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
     弹窗配置：键 = 屏号（1-10）
     每条：title 标题 | text 正文 | list 条目数组 | tags 标签数组
           pos 位置 | size 大小 | mode 显示模式 | quiz 答题（可选）
     pos: 预设 tl/tr/bl/br/ml/mr/mt（角落/贴边，不挡正文），或自由坐标 {x, y}
     size: sm 小(300×170-260) / md 中(420×260-370) / lg 大(560×360-500)
     mode: one 单条显示（默认，FAB 循环）| all 同屏同时显示全部（上限 3）
     quiz: { question 题目, options 选项数组, correct 正确项索引(0 起), explain 解析 }
     纵向对比技巧：大窗给 list+tags（内容多自然高），小窗只给 text（紧凑）
     ============================================================ */
  var TIP_SCREENS = {
    /* 1 启动屏：不配置弹窗（用户指定取消）
       排布原则：各屏数量与类型比例错开——02 全知识、03/05/08 答题为主、04/07/09 知识为主、06 少而精 */
    2: [ /* 关于：全知识向（mode all，同屏 3 窗） */
      { title: "机创是什么", pos: "tl", size: "sm", mode: "all",
        text: "机械创新团队是<em>竞赛驱动</em>的科创团队——不是兴趣社团，是带着作品上赛场的。四组联动，从图纸到落地。" },
      { title: "2008 · 传承至今", pos: "tr", size: "md", mode: "all",
        text: "团队从 2008 年一路走到今天，奖杯是每年一届攒下来的。<em>你是第几届，由你来写。</em>",
        list: ["2008 年成立", "历届成员已覆盖多届学生", "今年招新，等你入队"],
        tags: ["历史", "传承"] },
      { title: "四组怎么配合", pos: "bl", size: "lg", mode: "all",
        text: "结构负责「做出来」，电控负责「动起来」，视觉负责「认出来」，运营负责「传出去」。",
        list: ["结构 → 图纸到实物", "电控 → 驱动与控制", "视觉 → 感知与识别", "运营 → 宣传与策划"],
        tags: ["四组", "协作"] }
    ],
    3: [ /* 结构组：答题为主（2 答题 + 1 知识） */
      { title: "答题 · 建模软件", pos: "tr", size: "md",
        quiz: { question: "结构组的主力建模软件是？",
          options: ["AutoCAD", "SolidWorks", "MATLAB", "Blender"], correct: 1,
          explain: "组内系统学习 SW2018+，建模到装配一条龙。" } },
      { title: "答题 · 小车复现", pos: "bl", size: "md",
        quiz: { question: "结构组做「智能小车复现」项目，最终要打通什么？",
          options: ["只把图画完", "设计 → 制造的闭环", "只会 3D 打印", "只背标准件规格"], correct: 1,
          explain: "从图纸到实物的完整落地能力，是结构组的核心目标。" } },
      { title: "结构组做什么", pos: "tl", size: "lg",
        text: "画图、建模、出图纸、做样机——<em>一个机器人长什么样，先由结构组说了算。</em>",
        list: ["SolidWorks 建模", "机械结构设计", "3D 打印与装配", "图纸规范"],
        tags: ["SolidWorks", "机构", "3D 打印"] }
    ],
    4: [ /* 电控组：知识为主（1 答题 + 2 知识） */
      { title: "电控组做什么", pos: "bl", size: "lg",
        text: "从点亮一颗灯珠，到让整台机器跑起来——<em>单片机、电机驱动、控制算法，都在电控。</em>",
        list: ["C 语言编程", "STM32 开发", "PCB 设计与焊接", "PID 控制"],
        tags: ["单片机", "C 语言", "电路"] },
      { title: "电控组最难的是什么", pos: "tr", size: "md",
        text: "调 PID。<em>一个参数调一晚上是常态</em>——但调通那一刻的成就感，也最值。" },
      { title: "答题 · 主控芯片", pos: "tl", size: "md",
        quiz: { question: "电控组核心主控芯片是？",
          options: ["51 单片机", "STM32", "Arduino Uno", "ESP8266"], correct: 1,
          explain: "STM32 + HAL 库，驱动外设与执行器。" } }
    ],
    5: [ /* 视觉组：答题为主（2 答题 + 1 知识） */
      { title: "答题 · 目标识别", pos: "bl", size: "md",
        quiz: { question: "视觉组主要用什么做目标识别？",
          options: ["OpenCV + 深度学习", "纯 OCR", "Photoshop 修图", "纯手工标注"], correct: 0,
          explain: "传统 CV + CNN / YOLO 等深度学习模型。" } },
      { title: "答题 · 采血管识别", pos: "br", size: "md",
        quiz: { question: "采血管分拣机靠什么自动识别颜色和条码？",
          options: ["扫码枪", "OpenMV 视觉", "人工目检", "红外传感器阵列"], correct: 1,
          explain: "OpenMV 视觉技术在分拣环节自动完成颜色分类与条码读取。" } },
      { title: "视觉组做什么", pos: "tr", size: "lg",
        text: "让机器「看见」——OpenCV 传统视觉、深度学习目标检测，<em>识别、定位、决策，都靠视觉。</em>",
        list: ["Python / OpenCV", "目标检测（YOLO 等）", "图像处理", "模型部署到嵌入式"],
        tags: ["OpenCV", "深度学习", "YOLO"] }
    ],
    6: [ /* 运营组：少而精（1 答题 + 1 知识） */
      { title: "运营组做什么", pos: "br", size: "md",
        text: "招新宣传、赛事记录、推文排版、PPT 答辩——<em>团队的「门面」和「喉舌」，都是运营。</em>",
        list: ["招新与活动策划", "推文 / 排版", "摄影剪辑", "答辩 PPT"],
        tags: ["运营", "宣传"] },
      { title: "答题 · 运营职能", pos: "tl", size: "md",
        quiz: { question: "运营组主要负责什么？",
          options: ["画电路板", "宣传策划、赛事记录与答辩 PPT", "写单片机程序", "机械建模出图"], correct: 1,
          explain: "团队的「门面」与「喉舌」——招新宣传、记录、推文、PPT。" } }
    ],
    7: [ /* 战绩：知识为主（1 答题 + 2 知识） */
      { title: "备赛冷知识", pos: "tr", size: "md",
        text: "从选题到答辩通常<em>大半年</em>——前期调研、中期硬肝、后期打磨，一个都不能少。",
        list: ["选题与方案", "设计与装配", "联调与测试", "答辩与展示"],
        tags: ["备赛", "历程"] },
      { title: "采血管分拣机怎么来的", pos: "bl", size: "lg",
        text: "把医院化验室的重复劳动做成自动化——<em>创意来自「去医院抽血时的观察」。</em>",
        list: ["CORE-XY 运动平台", "OpenMV 视觉识别", "STM32 控制", "与 LIS 系统对接"],
        tags: ["项目", "采血管分拣机"] },
      { title: "答题 · 在研项目", pos: "br", size: "md",
        quiz: { question: "下面哪个是团队的在研项目？",
          options: ["采血管分拣机", "智慧药房（智能送药小车）", "机械手夹取装置", "以上都是"], correct: 3,
          explain: "采血管分拣机、智慧药房是两个在研项目；机械手夹取是结构组典型机构设计课题。" } }
    ],
    8: [ /* 英灵殿：答题为主（2 答题 + 1 知识） */
      { title: "答题 · 殿名由来", pos: "br", size: "md",
        quiz: { question: "「英灵殿」的名字取自？",
          options: ["希腊神话", "北欧神话", "《山海经》", "圣经"], correct: 1,
          explain: "凡战场扬名者皆入英灵殿——这里陈列为团队扬名的前辈档案。" } },
      { title: "答题 · 档案去向", pos: "bl", size: "md",
        quiz: { question: "档案卡上的「去向」指的是？",
          options: ["毕业后的发展（保研 / 就业 / 深造）", "当年比赛的城市", "成员的家乡", "下一次要打的比赛"], correct: 0,
          explain: "记录前辈毕业后的去向，也是后来者的参考坐标。" } },
      { title: "英灵殿是什么", pos: "tr", size: "lg",
        text: "取自北欧神话——凡战场扬名者，皆入英灵殿。<em>这里陈列的，是曾在赛场为团队扬名的前辈。</em>",
        list: ["每位前辈一张档案卡", "记录他们的战绩与寄语", "由团队逐年更新"],
        tags: ["英灵殿", "传承", "档案"] }
    ],
    9: [ /* 报名：知识为主（1 答题 + 2 知识） */
      { title: "报名要准备什么", pos: "br", size: "sm",
        text: "把报名表填完整，第 6 题能配图就配图——<em>作品图比漂亮话更能说明你。</em>" },
      { title: "面试会问什么", pos: "tl", size: "sm",
        text: "自我介绍、你感兴趣的组别、有没有相关经历。<em>真诚 > 包装，准备两个作品 / 想法再上场。</em>" },
      { title: "答题 · 组别勾选", pos: "bl", size: "md",
        quiz: { question: "报名表最多可以勾选几个面试组别？",
          options: ["只能 1 个", "可以多选", "不允许选", "最多 3 个"], correct: 1,
          explain: "支持多选，但面试会按你的第一意向重点考察，建议想清楚最想进哪个组。" } }
    ]
    /* 10 加入我们：不配置弹窗（用户指定取消） */
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
    /* —— 答题（quiz）模式：选项可点，对错即时反馈 + 解析 —— */
    if (cfg.quiz) {
      var quiz = el("div", "holo-tip__quiz");
      quiz.appendChild(el("p", "holo-tip__quiz-q", cfg.quiz.question));
      var opts = el("div", "holo-tip__quiz-opts");
      cfg.quiz.options.forEach(function (opt, i) {
        var btn = el("button", "holo-tip__quiz-opt", "");
        btn.type = "button";
        btn.setAttribute("data-quiz-opt", i);
        btn.innerHTML = "<span class='holo-tip__quiz-opt-key'>" + String.fromCharCode(65 + i) +
          "</span><span class='holo-tip__quiz-opt-text'>" + opt + "</span>";
        opts.appendChild(btn);
      });
      quiz.appendChild(opts);
      var explain = el("p", "holo-tip__quiz-explain", "");
      explain.setAttribute("aria-live", "polite");
      explain.hidden = true;
      quiz.appendChild(explain);
      /* 作答：点对绿色 + 解析，点错红色并亮出正确项 */
      quiz.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-quiz-opt]");
        if (!btn || quiz.classList.contains("is-done")) return;
        quiz.classList.add("is-done");
        var chosen = Number(btn.getAttribute("data-quiz-opt"));
        var correct = cfg.quiz.correct;
        var key = String.fromCharCode(65 + correct);
        opts.children[correct].classList.add("is-correct");
        if (chosen === correct) {
          explain.innerHTML = "✅ 回答正确。" + (cfg.quiz.explain || "");
        } else {
          btn.classList.add("is-wrong");
          explain.innerHTML = "✗ 正确答案是 <b>" + key + "</b>。" + (cfg.quiz.explain || "");
        }
        explain.hidden = false;
      });
      body.appendChild(quiz);
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

  /* 隐藏：open 的走关闭动画，未 open 但可见的直接藏
     用快照锁定发起时刻的窗口，延迟回调不会误伤之后新显示的窗口 */
  function hideAll(skipAnim) {
    var closing = allTips.filter(function (wrap) {
      var tip = tipEl(wrap);
      return tip && !wrap.hidden && tip.classList.contains("is-open");
    });
    closing.forEach(function (wrap) {
      var tip = tipEl(wrap);
      tip.classList.add("is-closing");
      tip.classList.remove("is-open");
      window.setTimeout(function () {
        tip.classList.remove("is-closing");
        wrap.hidden = true;
      }, skipAnim ? 0 : 240);
    });
    allTips.forEach(function (wrap) {
      if (wrap.hidden) return;
      var tip = tipEl(wrap);
      if (tip && !tip.classList.contains("is-open") && !tip.classList.contains("is-closing")) {
        wrap.hidden = true;
      }
    });
  }

  /* —— 追加显示（逐个弹出用：不隐藏已弹的窗口） —— */
  function showTipAppend(wrap) {
    wrap.hidden = false;
    requestAnimationFrame(function () {
      var tip = tipEl(wrap);
      if (tip) tip.classList.add("is-open");
    });
  }

  /* —— 激活某屏：旧窗立即清场，新窗 8s 后开始弹出 ——
     02(all)/07/08(单条)：8s 一次弹出；
     03/04/05/06(多条)：8s 弹第 1 条 → 之后每 3s 弹下一条（追加显示） */
  var autoTimer = null;
  var autoStepTimers = [];

  function activateScreen(screenId) {
    if (screenId === currentScreen) return;
    currentScreen = screenId;
    currentIdx = -1;
    hideAll(true);
    var list = tipsByScreen[screenId];
    if (!list || !list.length) return;
    /* 清掉旧屏的逐条定时器 */
    autoStepTimers.forEach(function (t) { window.clearTimeout(t); });
    autoStepTimers = [];
    window.clearTimeout(autoTimer);
    /* 8s 后开始弹该屏弹窗；8s 内翻走则取消 */
    autoTimer = window.setTimeout(function () {
      if (currentScreen !== screenId) return;   /* 已翻走，不弹 */
      var isAll = list[0]._cfg && list[0]._cfg.mode === "all";
      if (isAll || list.length <= 1) {
        if (isAll) {
          showBatch(list);        /* 02 等：一起弹出 */
        } else {
          currentIdx = 0;
          showTip(list[0]);       /* 07/08 单条 */
        }
        return;
      }
      /* 多条屏：逐个弹出，间隔 3s（先大后小，按配置顺序） */
      list.forEach(function (w, i) {
        autoStepTimers.push(window.setTimeout(function () {
          if (currentScreen !== screenId) return;
          if (i === 0) currentIdx = 0;
          showTipAppend(w);       /* 追加显示，不覆盖前面的窗 */
        }, i * 3000));
      });
    }, 8000);
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

  /* —— 启动：加载 8s 后自动弹出（桌面弹当前屏；手机长页逐个弹全局知识） —— */
  window.setTimeout(function () {
    if (isMobile()) {
      /* 手机长页：全局知识 8s 起每 3s 切换一条（小屏逐个叠窗会乱，用切换） */
      if (!flatAll.length) return;
      flatAll.slice(0, 3).forEach(function (cfg, i) {
        window.setTimeout(function () {
          var s = screenOf(cfg);
          if (s && !tipsByScreen[s]) ensureScreen(s);
          var wrap = (tipsByScreen[s] || []).filter(function (w) { return w._cfg === cfg; })[0];
          if (wrap) showTip(wrap);
        }, 8000 + i * 3000);
      });
      return;
    }
    var id = activeScreen();
    if (id) ensureScreen(id);
    activateScreen(id || 1, true);
  }, 8000);

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
