/* ============================================================
   机创日报 CYBER 2026 · book.js
   3D 翻页引擎：顺序翻页 / 键盘 / 按钮 / 触屏滑动 / 页角点击
   <900px 时由 CSS 降级为纵向报纸，本引擎自动停用
   ============================================================ */
(function () {
  'use strict';

  var leaves = Array.prototype.slice.call(document.querySelectorAll('.leaf'));
  var stage = document.getElementById('stage');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var statusEl = document.getElementById('pageStatus');
  var coverStart = document.getElementById('coverStart');

  var mqDesktop = window.matchMedia('(min-width: 900px)');
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STATES = leaves.length + 1; // 4 张纸页 → 5 个版面
  var current = 0;                // 已翻张数
  var busy = false;

  function isDesktop() { return mqDesktop.matches; }

  /* z-index：未翻转页中 index 最小者压顶（封面在最上），翻转页全部垫底 */
  function applyZ() {
    leaves.forEach(function (leaf, j) {
      var idx = j + 1;
      leaf.style.zIndex = leaf.classList.contains('leaf--flipped')
        ? String(idx)
        : String(50 + leaves.length - idx);
    });
  }

  function setStatus() {
    if (!statusEl) return;
    statusEl.textContent = '第 ' + (current + 1) + ' 版 / 共 ' + STATES + ' 版';
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === STATES - 1;
  }

  function flipLeaf(leaf, forward, done) {
    leaf.classList.add('leaf--turning');
    if (forward) leaf.classList.add('leaf--flipped');
    else leaf.classList.remove('leaf--flipped');

    var settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      leaf.classList.remove('leaf--turning');
      busy = false;
      if (done) done();
    }
    leaf.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, REDUCED ? 30 : 1100); // transitionend 兜底
  }

  /* 顺序翻页：一次翻一张，直到到达目标版面 */
  function goTo(target) {
    if (!isDesktop()) return;
    target = Math.max(0, Math.min(STATES - 1, target));
    if (target === current) { setStatus(); return; }
    if (busy) return;
    busy = true;

    var forward = target > current;
    var step = forward ? 1 : -1;

    (function run() {
      if (current === target) { busy = false; applyZ(); setStatus(); return; }
      var idx = forward ? current : current - 1; // 前翻翻第 current 张；后翻翻已翻的最后一张
      flipLeaf(leaves[idx], forward, function () {
        current += step;
        applyZ();
        setStatus();
        run();
      });
    })();
  }

  /* —— 控件 —— */
  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });
  if (coverStart) coverStart.addEventListener('click', function () { goTo(current + 1); });

  /* —— 键盘 —— */
  document.addEventListener('keydown', function (e) {
    if (!isDesktop()) return;
    var t = e.target;
    if (t && typeof t.matches === 'function' && (t.matches('input, textarea, select, button') || t.isContentEditable)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(current - 1); }
  });

  /* —— 页角点击翻页（不劫持链接/按钮/表单） —— */
  stage.addEventListener('click', function (e) {
    if (!isDesktop() || busy) return;
    if (e.target.closest('a, button, input, textarea, select, label, .summary-box')) return;
    var rect = stage.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var w = rect.width;
    if (x < w * 0.18) goTo(current - 1);
    else if (x > w * 0.82) goTo(current + 1);
  });

  /* —— 触屏滑动（桌面触屏，配合拖拽翻阅） —— */
  var startX = null;
  stage.addEventListener('pointerdown', function (e) {
    if (!isDesktop()) return;
    startX = e.clientX;
  }, { passive: true });
  stage.addEventListener('pointerup', function (e) {
    if (!isDesktop() || startX === null) return;
    var dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) < 40) return;
    goTo(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });

  /* —— 跨断点尺寸变化 —— */
  mqDesktop.addEventListener('change', setStatus);

  applyZ();
  setStatus();
})();
