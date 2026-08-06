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

  /* —— 切换 —— */
  function goTo(target) {
    target = Math.max(0, Math.min(N - 1, target));
    if (target === current) return;
    if (busy) return;
    busy = true;
    screens[current].classList.remove('is-active');
    screens[target].classList.add('is-active');
    current = target;
    setUI();
    setTimeout(function () { busy = false; }, DUR);
  }

  /* —— 控件 —— */
  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });
  if (coverStart) coverStart.addEventListener('click', function () { goTo(1); });
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      goTo(Number(chip.getAttribute('data-go')) - 1);
    });
  });

  /* —— 键盘（表单控件聚焦时豁免） —— */
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && typeof t.matches === 'function' && (t.matches('input, textarea, select, button') || t.isContentEditable)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(current - 1); }
  });

  /* —— 横滑切换（手机/触屏主力手势；纵向滚动交给面板，横向滑动手势切模块） —— */
  var viewport = document.getElementById('viewport');
  var startX = 0;
  var startY = 0;
  var dragging = false;
  viewport.addEventListener('pointerdown', function (e) {
    if (e.target.closest('input, textarea, select, a, button, .chip, .upload-btn')) return;
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

  setUI();
})();
