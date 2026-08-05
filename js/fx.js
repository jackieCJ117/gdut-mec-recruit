/* ============================================================
   机创时报 CYBER 2026 · fx.js
   占位高级化动效 + 鼠标视差（零依赖，ES5 风格与 book.js/form.js 一致）：
   - count-up 数字滚动（30+ / 10+，进视口触发）+ DATA.PENDING 标签
   - N× 战绩数字周期性故障帧 + LOADING DATA 角标
   - 群号/公众号字符流收敛为「接通中… CONNECTING」
   - 鼠标视差：背景/装饰层随指针微移 + 书刊透视原点跟随
   占位检测：文本含 X / 占位 / N× / 20XX 才启用动效——
   日后替换真实数据（同时清掉 data-count 等标记）自动停用。
   ============================================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* —— 占位判定：仍含占位标记才启用 —— */
  function isPlaceholder(el) {
    return /X|占位|N×|20XX/.test(el.textContent || '');
  }

  /* ============================================================
     1. count-up 数字滚动（进视口触发，out-cubic 缓动）
     ============================================================ */
  function initCountUp() {
    if (REDUCED) return;
    var els = document.querySelectorAll('.facts__num.count-up');
    Array.prototype.forEach.call(els, function (el) {
      if (!el.getAttribute('data-count')) return;  // 真数据时删除该属性即停用
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      var suffix = el.textContent.trim().replace(/\d+/, '');
      if (typeof IntersectionObserver !== 'function') return;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.disconnect();
          var t0 = performance.now();
          var dur = 1200;
          function tick(now) {
            var p = Math.min(1, (now - t0) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) { requestAnimationFrame(tick); return; }
            el.textContent = target + suffix;
            var tag = document.createElement('span');
            tag.className = 'data-pending';
            tag.textContent = 'DATA.PENDING';
            tag.setAttribute('aria-hidden', 'true');
            el.appendChild(tag);
          }
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  /* ============================================================
     2. N× 战绩数字周期性故障帧 + LOADING DATA 角标
     ============================================================ */
  function initFlick() {
    var els = document.querySelectorAll('.trophy__num.flick-target');
    Array.prototype.forEach.call(els, function (el) {
      if (!isPlaceholder(el)) return;
      if (!REDUCED) {
        setInterval(function () {
          if (document.hidden) return;
          el.classList.add('flick');
          setTimeout(function () { el.classList.remove('flick'); }, 160);
        }, 3500);
      }
      var tag = document.createElement('small');
      tag.className = 'loading-data';
      tag.textContent = 'LOADING DATA…';
      tag.setAttribute('aria-hidden', 'true');
      el.parentNode.appendChild(tag);
    });
  }

  /* ============================================================
     3. 群号/公众号字符流 →「接通中… CONNECTING」循环
     ============================================================ */
  function initConnect() {
    var els = document.querySelectorAll('.connect-anim');
    Array.prototype.forEach.call(els, function (el) {
      if (!isPlaceholder(el)) return;
      var full = el.textContent;
      var glyphs = '01X#▚▞▓▒░';
      var phase = 0;    // 0=乱码 1=CONNECTING 2=休息
      if (REDUCED) return;
      (function loop() {
        setTimeout(function () {
          if (document.hidden) return;
          if (phase === 0) {
            phase = 1;
            el.textContent = full.split('').map(function (c) {
              return Math.random() < 0.45 ? glyphs[Math.floor(Math.random() * glyphs.length)] : c;
            }).join('');
            loop();
          } else if (phase === 1) {
            phase = 2;
            el.textContent = '接通中… CONNECTING';
            el.classList.add('is-connected');
            loop();
          } else {
            phase = 0;
            el.textContent = full;
            el.classList.remove('is-connected');
            loop();
          }
        }, phase === 0 ? 80 : phase === 1 ? 2200 : 2800);
      })();
    });
  }

  /* ============================================================
     4. 鼠标视差：背景/装饰层随指针微移 + 书刊透视原点跟随
        触摸设备（pointer: coarse）禁用
     ============================================================ */
  function initParallax() {
    if (REDUCED || window.matchMedia('(pointer: coarse)').matches) return;
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-depth]'));
    if (!els.length) return;
    var stage = document.querySelector('.holo__stage');
    var ox = 0;
    var oy = 0;
    var raf = null;
    document.addEventListener('mousemove', function (e) {
      ox = e.clientX / window.innerWidth - 0.5;
      oy = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    function apply() {
      raf = null;
      els.forEach(function (el) {
        var d = parseFloat(el.getAttribute('data-depth')) || 8;
        el.style.transform = 'translate3d(' + (ox * d).toFixed(1) + 'px,' + (oy * d).toFixed(1) + 'px,0)';
      });
      if (stage) {
        stage.style.perspectiveOrigin = (50 + ox * 8).toFixed(2) + '% ' + (42 + oy * 8).toFixed(2) + '%';
      }
    }
  }

  /* —— 启动 —— */
  initCountUp();
  initFlick();
  initConnect();
  initParallax();
})();
