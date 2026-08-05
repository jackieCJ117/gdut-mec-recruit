/* ============================================================
   机创时报 CYBER 2026 · book.js  v4（玻璃全息切换器）
   横滑分页：像素步长 + 居中偏移 + 相邻版面两侧露出微缩
   像 iOS 后台应用切换器：当前版居中最大，前后版面在两侧露出
   ============================================================ */
(function () {
  'use strict';

  var track = document.getElementById('track');
  var viewport = document.getElementById('viewport');
  var panels = Array.prototype.slice.call(track.children);
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var coverStart = document.getElementById('coverStart');

  var N = panels.length;
  var current = 0;
  var busy = false;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var step = 0;      // 相邻面板中心距
  var base = 0;      // 首面板左边距
  var centerShift = 0; // 使当前版居中的偏移

  function setUI() {
    chips.forEach(function (chip, i) {
      var active = i === current;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === N - 1;
  }

  function applyTransform() {
    var x = -step * current + (centerShift - base);
    track.style.transform = 'translateX(' + x + 'px)';
    panels.forEach(function (p, i) {
      p.classList.toggle('is-current', i === current);
    });
  }

  function measure() {
    if (!panels[0] || !panels[1]) return;
    var firstW = panels[0].getBoundingClientRect().width;
    step = panels[1].offsetLeft - panels[0].offsetLeft;
    base = panels[0].offsetLeft;
    var vw = viewport.getBoundingClientRect().width;
    centerShift = (vw - firstW) / 2;
    applyTransform();
  }

  function goTo(target) {
    target = Math.max(0, Math.min(N - 1, target));
    if (target === current) return;
    if (busy) return;
    busy = true;
    current = target;
    applyTransform();

    var settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      busy = false;
      setUI();
    }
    track.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, REDUCED ? 30 : 900); // transitionend 兜底
    setUI();
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

  /* —— 键盘 —— */
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && typeof t.matches === 'function' && (t.matches('input, textarea, select, button') || t.isContentEditable)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(current - 1); }
  });

  /* —— 横滑拖拽（忽略从表单/链接发起的拖动） —— */
  var startX = 0;
  var startY = 0;
  var dragging = false;
  viewport.addEventListener('pointerdown', function (e) {
    if (e.target.closest('input, textarea, select, a, button, .chip, .summary-box')) return;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
  }, { passive: true });
  viewport.addEventListener('pointerup', function (e) {
    if (!dragging) return;
    dragging = false;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
    goTo(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });

  /* —— 尺寸变化重排 —— */
  window.addEventListener('resize', measure);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  }

  measure();
  setUI();
})();
