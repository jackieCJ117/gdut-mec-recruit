/* ============================================================
   机创时报 CYBER 2026 · book.js  v5（3D 双开书刊引擎）
   6 版面重组为 3 个跨页（.page），轨道平移 + 页姿态类驱动 3D：
   - 当前跨页平摊居中，前后跨页 3D 侧立露出（两侧微缩）
   - 翻页表演：旧页合拢（is-folding）→ 轨道滑动 → 姿态切换
   - 触发：键盘 / 按钮 / 横滑拖拽 / 点击两侧露出 / chips
   - 手机端（<900px）降级为纵向流式：滚动定位代替轨道平移
   ============================================================ */
(function () {
  'use strict';

  var track = document.getElementById('track');
  var viewport = document.getElementById('viewport');
  var pages = Array.prototype.slice.call(track.children);
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var coverStart = document.getElementById('coverStart');

  var N = pages.length;                  // 跨页数（3）
  var current = 0;
  var busy = false;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FLOW = window.matchMedia('(max-width: 899px)');  // 流式降级模式

  var step = 0;          // 相邻跨页中心距
  var base = 0;          // 首跨页左边距
  var centerShift = 0;   // 使当前跨页居中的偏移
  var EXPOSE = 110;      // 两侧露出宽度（px）：邻页侧立后露出的窄条
  var ANG = 15;          // 邻页侧立角度（deg）
  var SCALE = 0.94;      // 邻页缩放

  /* —— UI 同步：chips 高亮（同跨页双 chip 同亮）+ 首尾禁用 —— */
  function setUI() {
    chips.forEach(function (chip, i) {
      var active = Math.floor(i / 2) === current;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === N - 1;
  }

  /* —— 姿态：轨道平移 + 每页 is-current / is-prev / is-next ——
     两侧邻页的 translateX 必须按实际布局像素注入：track 平移后邻页
     离视口很远，CSS 固定百分比无法在不同屏宽下精确露出。
     坐标系说明：per-page translateX 相对元素的流内位置（track 坐标系），
     所以 dx 用「目标视觉中心 - 当前视觉中心」闭环计算——
     当前视觉中心 = track 平移量 x + offsetLeft + 半宽
     （offsetLeft 相对 book-wrap，不受 transform 影响，稳）；
     目标中心用「露出端视觉半宽」反推，rotateY + perspective 的投影
     会使露出端视觉半宽变为 scaledHalf·cosθ·persp/(persp+z)，必须计入，
     否则露出量偏差数十像素。
     rotateY 方向：露出端转向远离观察者（z>0 侧），藏在当前页之后——
     prev（露右端）用负角，next（露左端）用正角，绝不遮挡当前页。 */
  function applyPose() {
    var x = -step * current + (centerShift - base);
    track.style.transform = 'translateX(' + x + 'px)';
    var stage = document.querySelector('.holo__stage');
    var persp = stage ? parseFloat(getComputedStyle(stage).perspective) || 2400 : 2400;
    var pageW = pages[0] ? pages[0].offsetWidth : 0;
    var rad = ANG * Math.PI / 180;
    var scaledHalf = pageW * SCALE / 2;
    var z = scaledHalf * Math.sin(rad);                    // 露出端 z 深度
    var visHalf = scaledHalf * Math.cos(rad) * persp / (persp + z);  // 视觉半宽
    var holoLeft = viewport.offsetLeft;                    // holo 相对 book-wrap
    var vw = viewport.offsetWidth;
    pages.forEach(function (p, i) {
      p.classList.toggle('is-current', i === current);
      p.classList.toggle('is-prev', i < current);
      p.classList.toggle('is-next', i > current);
      var dx = 0;
      var curCx = x + p.offsetLeft + pageW / 2;            // 当前视觉中心
      if (i < current) {
        dx = (holoLeft + EXPOSE - visHalf) - curCx;        // 右缘露 EXPOSE
      } else if (i > current) {
        dx = (holoLeft + vw - EXPOSE + visHalf) - curCx;   // 左缘露 EXPOSE
      }
      if (dx) {
        var rot = i < current ? -ANG : ANG;
        p.style.transform = 'translateX(' + dx + 'px) rotateY(' + rot + 'deg) scale(' + SCALE + ')';
      } else {
        p.style.transform = '';
      }
    });
  }

  /* —— 布局测量（跨页尺寸 / 边距 / 居中偏移） —— */
  function measure() {
    if (!pages[0] || !pages[1]) return;
    var firstW = pages[0].getBoundingClientRect().width;
    step = pages[1].offsetLeft - pages[0].offsetLeft;
    base = pages[0].offsetLeft;
    var vw = viewport.getBoundingClientRect().width;
    centerShift = (vw - firstW) / 2;
    applyPose();
  }

  /* —— 翻页 —— */
  function goTo(target) {
    target = Math.max(0, Math.min(N - 1, target));
    if (target === current) return;
    if (busy) return;
    busy = true;
    var from = pages[current];

    /* 流式模式：直接滚动到目标跨页 */
    if (FLOW.matches) {
      current = target;
      pages[target].scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      busy = false;
      setUI();
      return;
    }

    /* 3D 模式：旧页合拢 → 轨道滑动 + 姿态切换 → 展开完成 */
    if (!REDUCED) from.classList.add('is-folding');
    var settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      busy = false;
      from.classList.remove('is-folding');
      setUI();
    }
    setTimeout(function () {
      current = target;
      applyPose();
      setTimeout(finish, REDUCED ? 30 : 420);
    }, REDUCED ? 30 : 550);
  }

  /* —— 控件 —— */
  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });
  if (coverStart) coverStart.addEventListener('click', function () { goTo(1); });
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var go = Number(chip.getAttribute('data-go'));
      goTo(Math.floor((go - 1) / 2));   // 6 版 → 3 跨页
    });
  });

  /* —— 点击两侧露出的邻页（3D 模式；忽略表单/链接/按钮） —— */
  track.addEventListener('click', function (e) {
    if (FLOW.matches) return;
    var t = e.target;
    if (t && typeof t.closest === 'function' && t.closest('a, button, input, textarea, select, .chip')) return;
    var p = t && typeof t.closest === 'function' ? t.closest('.page') : null;
    if (!p) return;
    if (p.classList.contains('is-prev')) goTo(current - 1);
    else if (p.classList.contains('is-next')) goTo(current + 1);
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
    if (Math.abs(dx) < 64 || Math.abs(dx) <= Math.abs(dy)) return;
    goTo(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });

  /* —— 尺寸 / 流式模式变化重排 —— */
  window.addEventListener('resize', measure);
  if (typeof FLOW.addEventListener === 'function') {
    FLOW.addEventListener('change', measure);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  }

  measure();
  setUI();
})();
