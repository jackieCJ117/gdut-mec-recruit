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

  /* ============================================================
     5. 报头 meta 打字机（进视口逐字打出 + ▍ 光标）
        翻页显示 07 时由 IntersectionObserver 触发一次
     ============================================================ */
  function initTypewriter() {
    if (REDUCED) return;
    var els = document.querySelectorAll('[data-typewriter]');
    Array.prototype.forEach.call(els, function (el) {
      var full = el.textContent;
      var started = false;
      /* 隐藏屏是 opacity/visibility 隐藏（screen.css），几何上仍与视口相交，
         IntersectionObserver 会误触发——必须按计算可见性门控 */
      function visible() {
        var s = el.closest('.screen');
        return !s || getComputedStyle(s).visibility !== 'hidden';
      }
      function start() {
        started = true;
        el.textContent = '';
        el.classList.add('typewriter');
        var i = 0;
        (function tick() {
          if (i <= full.length) {
            el.textContent = full.slice(0, i);
            i++;
            setTimeout(tick, 85 + Math.random() * 70);
          }
        })();
      }
      setInterval(function () {
        if (!started && visible()) start();
      }, 250);
    });
  }

  /* ============================================================
     6. holo-bar 统计数字 count-up（进视口触发，out-cubic）
        选择器：.holo-bar__num[data-count]
     ============================================================ */
  function initHoloCount() {
    if (REDUCED) return;
    var els = document.querySelectorAll('.holo-bar__num[data-count]');
    Array.prototype.forEach.call(els, function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      function run() {
        var t0 = performance.now();
        var dur = 900;
        function tick(now) {
          var p = Math.min(1, (now - t0) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) { requestAnimationFrame(tick); return; }
          el.textContent = target;
        }
        requestAnimationFrame(tick);
      }
      if (typeof IntersectionObserver !== 'function') { run(); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.disconnect();
          run();
        });
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  /* ============================================================
     7. 走线数据包：按 trace 的 d 路径注入流动圆点（SMIL animateMotion）
        新增奖项/项目自动生效，无需逐个手改 SVG
     ============================================================ */
  function initPackets() {
    if (REDUCED) return;
    var NS = 'http://www.w3.org/2000/svg';
    var traces = document.querySelectorAll('.award-node__trace, .power__project-trace');
    Array.prototype.forEach.call(traces, function (svg) {
      var line = svg.querySelector('.award-node__trace-line');
      var d = line && line.getAttribute('d');
      if (!d) return;
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'award-node__packet');
      c.setAttribute('r', '1.7');
      c.setAttribute('fill', 'currentColor');
      var am = document.createElementNS(NS, 'animateMotion');
      am.setAttribute('dur', (1.6 + Math.random() * 1.8).toFixed(2) + 's');
      am.setAttribute('repeatCount', 'indefinite');
      am.setAttribute('path', d);
      c.appendChild(am);
      svg.appendChild(c);
    });
  }

  /* ============================================================
     8. 英灵殿：横滑档案卡（手机后台卡片范式）
        轨道 scroll-snap 原生吸附；JS 按滚动位置计算透视——
        居中卡正面，两侧缩放 / 变暗 / 微旋转 / 下移；
        切换进中心时 glitch 闪帧 + 寄语打字机重播。
        每张卡自带完整档案（用户在 HTML 的 .vcard 中替换）。
     ============================================================ */
  function initValhalla() {
    var track = document.getElementById('valhallaTrack');
    if (!track) return;
    var originals = Array.prototype.slice.call(track.querySelectorAll('.vcard'));
    if (!originals.length) return;
    var N = originals.length;

    /* —— 无限循环：前后各克隆一组（布局 = [前组][原组][后组]），
       滚动越界时无动画跳回原组对应位置（前后组视觉相同 → 无缝） —— */
    var head = originals.map(function (c) { return c.cloneNode(true); });
    var tail = originals.map(function (c) { return c.cloneNode(true); });
    head.forEach(function (c) { track.appendChild(c); });
    for (var ti = tail.length - 1; ti >= 0; ti--) track.insertBefore(tail[ti], track.firstChild);
    /* 克隆组是视觉重复：语义上隐藏，避免读屏重复播报 */
    Array.prototype.forEach.call(track.querySelectorAll('.vcard'), function (c, i) {
      if (i < N || i >= N * 2) c.setAttribute('aria-hidden', 'true');
    });

    var cards = Array.prototype.slice.call(track.querySelectorAll('.vcard'));
    var quoteCache = cards.map(function (c) {
      var q = c.querySelector('.vcard__quote');
      return q ? q.textContent : '';
    });
    var prevActive = -1;
    var typeToken = 0;   /* 打字机令牌：快速连点时旧链让位 */

    /* 卡 i（all 数组下标）居中时所需的 scrollLeft */
    var STEP = 0;
    function posOf(i) {
      var pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      var w = originals[0].offsetWidth;
      STEP = w + 18;   /* gap 与 CSS 的 18px 一致 */
      return pad + i * STEP + w / 2 - track.clientWidth / 2;
    }

    function typeInto(el, text) {
      var myToken = ++typeToken;
      if (REDUCED) { el.textContent = text; return; }
      el.textContent = '';
      el.classList.add('typing');
      var i = 0;
      (function tick() {
        if (myToken !== typeToken) return;   /* 已被更新的滚动取代 */
        if (i <= text.length) {
          el.textContent = text.slice(0, i);
          i++;
          setTimeout(tick, 45 + Math.random() * 55);
        } else {
          el.classList.remove('typing');
        }
      })();
    }

    /* —— 透视计算：中心卡正面，两侧缩放/变暗/微旋转/下移 —— */
    var raf = null;
    function apply() {
      raf = null;
      var trackRect = track.getBoundingClientRect();
      var cx = trackRect.left + trackRect.width / 2;
      var active = 0;
      var activeDist = Infinity;
      cards.forEach(function (card, i) {
        var rect = card.getBoundingClientRect();
        var center = rect.left + rect.width / 2;
        var d = Math.abs(center - cx);
        var t = Math.min(d / (trackRect.width * 0.55), 1);
        /* 滞回：新卡需显著更近（12px）才接管 active，
           避免拖拽悬停两卡中点时闪帧/打字机每帧重播 */
        if (d < activeDist - 12) { activeDist = d; active = i; }
        var scale = 1 - t * 0.14;
        var opacity = 1 - t * 0.45;
        var rot = -Math.sign(center - cx) * t * 8;   /* 左正右负微倾斜 */
        var ty = t * 12;
        card.style.transform =
          'translateY(' + ty + 'px) scale(' + scale + ') rotateY(' + rot + 'deg)';
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = Math.round((1 - t) * 100);
      });
      /* 循环：中心卡落入前后克隆组 → 无动画跳回原组对应位置
         （跳转后由下一帧 scroll 重算，prevActive 不变 → 不触发切换特效） */
      if (active < N) {
        track.scrollLeft = posOf(active + N);
        return;
      }
      if (active >= N * 2) {
        track.scrollLeft = posOf(active - N);
        return;
      }
      if (active !== prevActive) {
        prevActive = active;
        cards.forEach(function (card, i) {
          card.classList.toggle('is-active', i === active);
        });
        /* 进中心：闪帧 + 寄语打字机重播；active 状态暴露给辅助技术 */
        var card = cards[active];
        card.classList.remove('is-flashing');
        void card.offsetWidth;
        card.classList.add('is-flashing');
        /* 闪帧播完即移除：残留的 animation 声明会压制 .is-active 的呼吸脉冲 */
        setTimeout(function () { card.classList.remove('is-flashing'); }, 260);
        typeInto(card.querySelector('.vcard__quote'), quoteCache[active]);
        cards.forEach(function (c, j) {
          if (j === active) c.setAttribute('aria-current', 'true');
          else c.removeAttribute('aria-current');
        });
      }
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(apply); }
    track.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    /* 初始定位：原组卡 0 居中（左侧露出前组克隆卡，形成循环首屏） */
    track.scrollLeft = posOf(N);
    apply();

    /* —— 左右箭头（桌面） —— */
    var prevBtn = track.parentElement.querySelector('.valhalla__arrow--prev');
    var nextBtn = track.parentElement.querySelector('.valhalla__arrow--next');
    function step(dir) {
      var w = cards[prevActive >= 0 ? prevActive : 0].offsetWidth;
      track.scrollBy({ left: dir * (w + 18), behavior: REDUCED ? 'auto' : 'smooth' });
    }
    if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

    /* —— 鼠标拖拽（非触屏且未降级动效） —— */
    if (!REDUCED && !window.matchMedia('(pointer: coarse)').matches) {
      var down = false;
      var startX = 0;
      var startLeft = 0;
      function endDrag() {
        if (!down) return;
        down = false;
        track.classList.remove('is-dragging');
      }
      track.addEventListener('pointerdown', function (e) {
        if (e.target.closest('a, button')) return;
        down = true;
        startX = e.clientX;
        startLeft = track.scrollLeft;
        track.classList.add('is-dragging');
      }, { passive: true });
      window.addEventListener('pointermove', function (e) {
        if (!down) return;
        track.scrollLeft = startLeft - (e.clientX - startX);
      }, { passive: true });
      window.addEventListener('pointerup', endDrag, { passive: true });
      window.addEventListener('pointercancel', endDrag, { passive: true });
    }

    /* —— 键盘左右键滚动卡片（焦点在轨道上时；book.js 已豁免整屏翻页） —— */
    track.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      var w = cards[prevActive >= 0 ? prevActive : 0].offsetWidth;
      track.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * (w + 18), behavior: REDUCED ? 'auto' : 'smooth' });
    });
  }

  /* ============================================================
     9. 英灵殿青色数据雨：.data-rain 内生成竖直字符列（随机位置/时长）
     ============================================================ */
  function initDataRain() {
    var rain = document.querySelector('.data-rain');
    if (!rain || REDUCED) return;
    var glyphs = '01X#▓▒░';
    for (var i = 0; i < 7; i++) {
      var col = document.createElement('span');
      col.className = 'data-col';
      var len = 8 + Math.floor(Math.random() * 8);
      var txt = '';
      for (var k = 0; k < len; k++) txt += glyphs[Math.floor(Math.random() * glyphs.length)];
      col.textContent = txt;
      col.style.left = (4 + i * 13) + '%';
      col.style.animationDuration = (5 + Math.random() * 6).toFixed(2) + 's';
      col.style.animationDelay = (-Math.random() * 8).toFixed(2) + 's';
      col.style.opacity = (0.35 + Math.random() * 0.45).toFixed(2);
      rain.appendChild(col);
    }
  }

  /* ============================================================
     10. 全息视角追踪：指针位置 → --vx/--vy（-1..1），
         当前卡高光/剪影光晕随视角偏移（攻壳 Solograms 反光感）
     ============================================================ */
  function initViewTilt() {
    var carousel = document.querySelector('.valhalla__carousel');
    if (!carousel || REDUCED || window.matchMedia('(pointer: coarse)').matches) return;
    carousel.addEventListener('pointermove', function (e) {
      var r = carousel.getBoundingClientRect();
      var vx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      var vy = ((e.clientY - r.top) / r.height - 0.5) * 2;
      carousel.style.setProperty('--vx', vx.toFixed(3));
      carousel.style.setProperty('--vy', vy.toFixed(3));
    }, { passive: true });
  }

  /* ============================================================
     11. 07 页战功脊柱联动：悬停奖项节点 → 能量光珠送达该节点
         + 顶部总战绩灯点亮（轴 = 数据总线，节点 = 挂载点）
     ============================================================ */
  function initPowerLink() {
    var body = document.querySelector('.sheet__body--honors');
    if (!body) return;
    var spine = body.querySelector('.power__spine');
    var dot = body.querySelector('.power__pulse-dot');
    var head = body.querySelector('.power__headlight');
    if (!spine || !dot || !head) return;
    /* 奖项节点 + 在研项目卡：悬停任一 → 能量送达该位置 */
    Array.prototype.forEach.call(body.querySelectorAll('.award-node, .power__project'), function (node) {
      node.addEventListener('mouseenter', function () {
        var nRect = node.getBoundingClientRect();
        var sRect = spine.getBoundingClientRect();
        var pct = ((nRect.top + nRect.height / 2) - sRect.top) / sRect.height * 100;
        pct = Math.max(4, Math.min(96, pct));
        dot.style.animation = 'none';
        dot.style.top = pct.toFixed(1) + '%';
        dot.style.opacity = '1';
        head.classList.add('is-lit');
      });
      node.addEventListener('mouseleave', function () {
        dot.style.animation = '';
        dot.style.top = '';
        dot.style.opacity = '';
        head.classList.remove('is-lit');
      });
    });
  }

  /* —— 启动 —— */
  initCountUp();
  initFlick();
  initConnect();
  initParallax();
  initTypewriter();
  initHoloCount();
  initPackets();
  initValhalla();
  initDataRain();
  initViewTilt();
  initPowerLink();
})();
