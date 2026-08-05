/* ============================================================
   机创日报 CYBER 2026 · form.js
   报名表：前端校验 + localStorage 暂存（含草稿自动保存）
   + 后端接入点 MEC_SUBMIT_HOOK（当前为空，接后端时实现即可）
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'mec_application_2026';
  var CONTACT_EMAIL = '3607199098@qq.com';

  var formA = document.getElementById('mec-form');     // 第 04 版：基础信息 + 第1题
  var formB = document.getElementById('mec-form-b');   // 第 05 版：第2-6题 + 提交
  var statusEl = document.getElementById('formStatus');

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* —— 汇总全部字段 —— */
  function gather() {
    var data = {};
    qsa('input[type=text], input[type=email], input[type=tel], textarea', formA).forEach(function (el) {
      if (el.name) data[el.name] = el.value.trim();
    });
    qsa('input[type=text], input[type=email], input[type=tel], textarea', formB).forEach(function (el) {
      if (el.name) data[el.name] = el.value.trim();
    });
    data.groups = qsa('input[name=group]:checked').map(function (c) { return c.value; });
    data.skills = qsa('input[name=skill]:checked').map(function (c) { return c.value; });
    return data;
  }

  /* —— 校验：必填项 + 邮箱格式 + 至少一个组别 —— */
  function validate(data) {
    var errs = [];
    if (!data.name) errs.push('姓名');
    if (!data.class_grade) errs.push('年级专业班级');
    if (!data.college) errs.push('学院');
    if (!data.email) errs.push('邮箱');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.push('邮箱格式');
    if (!data.phone) errs.push('联系方式');
    if (!data.groups.length) errs.push('至少勾选一个面试组别');
    return errs;
  }

  function buildSummary(data) {
    return [
      '【机械创新团队 2026 招新报名摘要】',
      '姓名：' + (data.name || '—'),
      '年级专业班级：' + (data.class_grade || '—'),
      '学院：' + (data.college || '—'),
      '邮箱：' + (data.email || '—'),
      '联系方式：' + (data.phone || '—'),
      '面试组别：' + (data.groups.join('、') || '—'),
      '掌握技能：' + (data.skills.join('、') || '—'),
      '个人介绍：' + (data.intro || '—'),
      '入队目的：' + (data.purpose || '—'),
      '大学规划：' + (data.plan || '—'),
      '作品/创意展示：' + (data.portfolio || '—'),
      '',
      '请将本摘要或填写好的原版报名表发送至：' + CONTACT_EMAIL
    ].join('\n');
  }

  function showSuccess(data) {
    if (!statusEl) return;
    var sum = buildSummary(data);
    statusEl.className = 'form-submit__status ok';
    statusEl.innerHTML = '';

    var p = document.createElement('p');
    p.textContent = '✓ 报名信息已暂存到本机浏览器（刷新页面仍可查看）。请将下方摘要复制后发送至邮箱 ' + CONTACT_EMAIL + ' 完成报名；也可下载原版报名表填写后发送。';

    var pre = document.createElement('textarea');
    pre.readOnly = true;
    pre.className = 'summary-box';
    pre.value = sum;
    pre.rows = 8;
    pre.setAttribute('aria-label', '报名信息摘要');

    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn-submit btn-copy';
    copyBtn.textContent = '复制摘要';
    copyBtn.addEventListener('click', function () {
      pre.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(sum).then(function () {
          copyBtn.textContent = '已复制 ✓';
          setTimeout(function () { copyBtn.textContent = '复制摘要'; }, 2000);
        }).catch(function () {
          copyBtn.textContent = '复制失败，请手动全选复制';
        });
      } else {
        document.execCommand('copy');
        copyBtn.textContent = '已复制 ✓';
      }
    });

    statusEl.appendChild(p);
    statusEl.appendChild(pre);
    statusEl.appendChild(copyBtn);
  }

  /* —— 提交：校验 → 暂存 → 后端钩子 → 成功态 —— */
  formB.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = gather();
    var errs = validate(data);
    if (errs.length) {
      if (statusEl) {
        statusEl.className = 'form-submit__status err';
        statusEl.textContent = '请补充：' + errs.join('、') + '（基础信息在第 04 版，请翻回填写）';
      }
      return;
    }
    if (statusEl) { statusEl.className = 'form-submit__status'; statusEl.textContent = '正在暂存…'; }

    var payload = Object.assign({ savedAt: new Date().toISOString() }, data);
    Promise.resolve()
      .then(function () {
        localStorage.setItem(STORE_KEY, JSON.stringify(payload));
      })
      .then(function () {
        // 后端接入点：若需把报名数据写入服务器，在此实现
        if (typeof window.MEC_SUBMIT_HOOK === 'function') return window.MEC_SUBMIT_HOOK(payload);
        return null;
      })
      .then(function () { showSuccess(data); })
      .catch(function (err) {
        if (statusEl) {
          statusEl.className = 'form-submit__status err';
          statusEl.textContent = '暂存失败：' + (err && err.message ? err.message : err);
        }
      });
  });

  /* —— 草稿自动保存（防丢失） —— */
  var timer = null;
  function scheduleDraftSave() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      try {
        var data = gather();
        data.draft = true;
        data.savedAt = new Date().toISOString();
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
      } catch (e) { /* localStorage 不可用时静默 */ }
    }, 400);
  }
  if (formA) formA.addEventListener('input', scheduleDraftSave);
  if (formB) formB.addEventListener('input', scheduleDraftSave);

  /* —— 回填草稿 —— */
  function restore() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { raw = null; }
    if (!raw) return;
    qsa('input[type=text], input[type=email], input[type=tel], textarea').forEach(function (el) {
      if (el.name && raw[el.name]) el.value = raw[el.name];
    });
    (raw.groups || []).forEach(function (v) {
      var c = qs('input[name=group][value="' + v + '"]');
      if (c) c.checked = true;
    });
    (raw.skills || []).forEach(function (v) {
      var c = qs('input[name=skill][value="' + v + '"]');
      if (c) c.checked = true;
    });
  }
  restore();
})();
