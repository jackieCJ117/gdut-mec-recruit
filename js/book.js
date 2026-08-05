/* ============================================================
   机创日报 CYBER 2026 · book.js  v3（全息横滑大屏）
   横滑分页器：轨道 translateX 滑动 / 箭头 / 键盘 / 拖拽 / 轨道芯片
   ============================================================ */
(function () {
  'use strict';

  var track = document.getElementById('track');
  var viewport = document.getElementById('viewport');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var coverStart = document.getElementById('coverStart');

  var N = track.children.length;
  var current = 0;
  var busy = false;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setUI() {
    chips.forEach(function (chip, i) {
      var active = i === current;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === N - 1;
  }

  function goTo(target) {
    target = Math.max(0, Math.min(N - 1, target));
    if (target === current) return;
    if (busy) return;
    busy = true;
    current = target;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';

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

  setUI();
})();
