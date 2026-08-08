/* ============================================================
   机创全息终端 CYBER 2026 · book.js  v6（一次一屏淡入引擎）
   全息终端界面：6 个模块屏幕（.screen）叠放，
   切换 = is-active 类驱动的 opacity + scale 淡入过渡（见 screen.css）。
   触发：键盘 / 底部导航按钮 / chips / 启动屏进入按钮。
   ============================================================ */
(function () {
  'use strict';

  var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var coverStart = document.getElementById('coverStart');

  var N = screens.length;          // 模块数（6）
  var current = 0;
  var busy = false;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FLOW = window.matchMedia('(max-width: 899px)');   // 手机长页模式
  var DUR = REDUCED ? 30 : 500;    // 切换过渡兜底时长

  /* —— UI 同步：chips 高亮 + 首尾禁用 —— */
  function setUI() {
    chips.forEach(function (chip, i) {
      var active = i === current;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === N - 1;
  }

  /* —— 07 战绩屏通电重播：切到 07 时触发「线 draw-on → 节点浮现」 —— */
  var powerZone = document.querySelector('.power__zone');
  function replayPower() {
    if (!powerZone) return;
    powerZone.classList.remove('is-powered');
    void powerZone.offsetWidth;   /* 强制 reflow，重启一次性动画 */
    powerZone.classList.add('is-powered');
  }

  /* —— 切换 —— */
  function goTo(target) {
    target = Math.max(0, Math.min(N - 1, target));
    if (target === current) return;
    if (busy) return;
    busy = true;
    screens[current].classList.remove('is-active');
    screens[target].classList.add('is-active');
    if (screens[target].getAttribute('data-screen') === '7') replayPower();
    current = target;
    setUI();
    /* 隐藏屏 clientHeight 为 0，量不出溢出，切到才有真实尺寸 */
    syncMore(screens[target]);
    setTimeout(function () { busy = false; }, DUR);
  }

  /* —— 控件 —— */
  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });
  if (coverStart) coverStart.addEventListener('click', function () {
    if (FLOW.matches) {
      /* 手机长页模式：滚动进入内容 */
      screens[1].scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    goTo(1);
  });

  /* —— 跳到报名模块：手机长页滚动 / 桌面切屏（供浮动按钮与 09 页收尾按钮共用） —— */
  function goToApply() {
    if (FLOW.matches) {
      var target = document.getElementById('apply-module') || screens[8];
      target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    goTo(8);
  }

  /* —— 手机端浮动报名按钮 —— */
  var mobileApply = document.getElementById('mobileApply');
  if (mobileApply) {
    mobileApply.addEventListener('click', function (e) {
      e.preventDefault();
      goToApply();
    });
  }

  /* —— 09 页收尾按钮：招新漏斗闭环回到 08 报名 —— */
  var ctaToApply = document.getElementById('ctaToApply');
  if (ctaToApply) ctaToApply.addEventListener('click', goToApply);
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      goTo(Number(chip.getAttribute('data-go')) - 1);
    });
  });

  /* —— 键盘（表单控件聚焦时豁免） —— */
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && typeof t.matches === 'function' && (t.matches('input, textarea, select, button, .valhalla__track') || t.isContentEditable)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(current - 1); }
  });

  /* —— 横滑切换（手机/触屏主力手势；纵向滚动交给面板，横向滑动手势切模块） —— */
  var viewport = document.getElementById('viewport');
  var startX = 0;
  var startY = 0;
  var dragging = false;
  viewport.addEventListener('pointerdown', function (e) {
    /* .valhalla__track 豁免：英灵殿横滑卡的拖拽属于卡片滚动，不是整屏翻页 */
    if (e.target.closest('input, textarea, select, a, button, .chip, .upload-btn, .valhalla__track')) return;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
  }, { passive: true });
  viewport.addEventListener('pointerup', function (e) {
    if (!dragging) return;
    dragging = false;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (Math.abs(dx) < 60 || Math.abs(dx) <= Math.abs(dy)) return;
    goTo(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });
  /* pointercancel：触摸滑动卡片被浏览器接管时（touch-action 让渡），
     必须复位 dragging，否则过期 startX 会让后续任意点击被算成翻页 */
  viewport.addEventListener('pointercancel', function () { dragging = false; }, { passive: true });

  /* —— 滚动提示：面板还有内容没看到时显示底部渐隐 + 向下箭头 ——
     桌面面板高仅 ~723px，07 页动力轴区单块就 985px，压缩装不下，
     所以"下面还有"必须有可见信号。滚到底或本来无溢出 → 加 is-end 淡出。 */
  var TOL = 4;   /* 容差：亚像素与缩放下 scrollTop 取不到精确底部 */
  function syncMore(sheet) {
    if (!sheet) return;
    var hasOverflow = sheet.scrollHeight - sheet.clientHeight > TOL;
    var atEnd = sheet.scrollTop + sheet.clientHeight >= sheet.scrollHeight - TOL;
    sheet.classList.toggle('is-end', !hasOverflow || atEnd);
  }
  var sheets = Array.prototype.slice.call(document.querySelectorAll('.sheet--paper'));
  sheets.forEach(function (sheet) {
    sheet.addEventListener('scroll', function () { syncMore(sheet); }, { passive: true });
    syncMore(sheet);
  });
  /* 视口变化会改变溢出量（矮视口压缩档位切换），重算一次 */
  window.addEventListener('resize', function () { sheets.forEach(syncMore); });

  setUI();
})();
