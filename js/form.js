/* ============================================================
   机创全息终端 CYBER 2026 · form.js
   报名表：前端校验 + Supabase 直接入库
   - 提交 → 图片上传（Storage）→ 数据写入 applications 表
   - RLS 已配置：匿名仅可 INSERT，不可读/改/删（数据安全）
   - 失败兜底：自动重试 + localStorage 草稿保留（不丢数据）
   - 旧版"发邮件摘要"流程已废弃
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     Supabase 配置（替换/更新时只改这里）
     ============================================================ */
  var SUPABASE_URL = 'https://fupapwykwuzgbpluqurm.supabase.co';   // 项目 URL（Settings → API）
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cGFwd3lrd3V6Z2JwbHVxdXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Nzc3OTksImV4cCI6MjEwMTU1Mzc5OX0.ygaLZ7VAXmPdIVYQXSewEc2Hk2GPrd82Xsl4Uo7OlNA'; // anon public key（公开密钥，安全由 RLS 保证）
  var SUPABASE_BUCKET = 'application-files';   // Storage 桶名（作品图片，需在控制台 Storage 创建并设为 Public）

  /* —— 图片上传限制 —— */
  var MAX_FILES = 3;                // 最多图片数
  var MAX_SIZE = 5 * 1024 * 1024;   // 单张 ≤5MB
  var MAX_EDGE = 1600;              // 压缩后最长边 px
  var JPEG_QUALITY = 0.8;           // 压缩质量

  var STORE_KEY = 'mec_application_2026';

  var formA = document.getElementById('mec-form');     // 报名版：基础信息 + 第1题
  var formB = document.getElementById('mec-form-b');   // 报名版：第2-6题 + 提交
  var statusEl = document.getElementById('formStatus');
  var fileInput = document.getElementById('f-portfolio-files');
  var uploadBtn = document.getElementById('uploadBtn');
  var uploadList = document.getElementById('uploadList');
  var pendingFiles = [];     // 待上传的压缩后图片（{name, blob}）

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* —— 汇总全部字段（键名与 applications 表列一一对应） —— */
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

  /* —— 带超时的 fetch（国内访问 Supabase 网络波动兜底） —— */
  function fetchWithTimeout(url, options, timeoutMs) {
    var timeout = timeoutMs || 20000;
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('网络超时，请重试')); }, timeout);
      fetch(url, options).then(function (res) {
        clearTimeout(timer);
        resolve(res);
      }).catch(function (err) {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  /* —— 重试一次的 fetch 封装 —— */
  function fetchRetry(url, options, timeoutMs) {
    return fetchWithTimeout(url, options, timeoutMs).catch(function () {
      return fetchWithTimeout(url, options, timeoutMs);   // 自动重试一次
    });
  }

  /* ============================================================
     图片处理：校验 → canvas 压缩 → 上传 Storage → 返回公开 URL
     ============================================================ */
  function readAsDataURL(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  function compressImage(file) {
    return readAsDataURL(file).then(function (dataUrl) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
          var w = Math.round(img.width * scale);
          var h = Math.round(img.height * scale);
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error('图片压缩失败')); return; }
            var ext = (file.type === 'image/png') ? 'png' : 'jpg';
            resolve({ name: randomName() + '.' + ext, blob: blob });
          }, 'image/jpeg', JPEG_QUALITY);
        };
        img.onerror = function () { reject(new Error('图片读取失败')); };
        img.src = dataUrl;
      });
    });
  }

  function randomName() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'f' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function uploadImage(file) {
    var path = SUPABASE_BUCKET + '/' + file.name;
    var url = SUPABASE_URL + '/storage/v1/object/' + path;
    return fetchRetry(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': file.blob.type
      },
      body: file.blob
    }, 30000).then(function (res) {
      if (!res.ok) throw new Error('图片上传失败（' + res.status + '）');
      return SUPABASE_URL + '/storage/v1/object/public/' + path;
    });
  }

  /* —— 文件选择 → 压缩入列 —— */
  function handleFiles(files) {
    var list = Array.prototype.slice.call(files || []);
    var room = MAX_FILES - pendingFiles.length;
    if (list.length > room) {
      setStatus('图片最多 ' + MAX_FILES + ' 张（已选 ' + pendingFiles.length + ' 张）', 'err');
      list = list.slice(0, room);
    }
    list.forEach(function (file) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        setStatus('仅支持 jpg / png / webp 图片', 'err');
        return;
      }
      if (file.size > MAX_SIZE) {
        setStatus('单张图片不能超过 5MB', 'err');
        return;
      }
      compressImage(file).then(function (compressed) {
        pendingFiles.push(compressed);
        renderUploadList();
      }).catch(function (err) {
        setStatus(err.message || '图片处理失败', 'err');
      });
    });
  }

  function renderUploadList() {
    if (!uploadList) return;
    uploadList.innerHTML = '';
    pendingFiles.forEach(function (f, i) {
      var li = document.createElement('li');
      li.className = 'upload-item';
      li.textContent = f.name + ' (' + Math.round(f.blob.size / 1024) + 'KB)';
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'upload-item__del';
      del.setAttribute('aria-label', '删除这张图片');
      del.textContent = '✕';
      del.addEventListener('click', function () {
        pendingFiles.splice(i, 1);
        renderUploadList();
      });
      li.appendChild(del);
      uploadList.appendChild(li);
    });
  }

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.className = 'form-submit__status' + (kind ? ' ' + kind : '');
    statusEl.textContent = msg;
  }

  /* ============================================================
     提交：上传图片 → 写入 applications 表
     ============================================================ */
  function insertRow(data) {
    var url = SUPABASE_URL + '/rest/v1/applications';
    return fetchRetry(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    }, 25000).then(function (res) {
      if (!res.ok) throw new Error('提交失败（' + res.status + '）');
      return res;
    });
  }

  function submitApplication(data) {
    setStatus('正在提交报名…');
    var uploads = pendingFiles.map(uploadImage);
    Promise.all(uploads)
      .then(function (urls) {
        data.portfolio_img = urls;   // 图片公开 URL 数组（无图则为空数组）
        return insertRow(data);
      })
      .then(function () {
        try { localStorage.removeItem(STORE_KEY); } catch (e) { /* 忽略 */ }
        setStatus('✓ 报名成功！你的信息已提交至团队数据库，请留意招新群的后续通知。', 'ok');
        if (uploadList) { uploadList.innerHTML = ''; }
        pendingFiles = [];
        formB.reset();
        formA.reset();
      })
      .catch(function (err) {
        // 失败兜底：草稿仍在 localStorage，页面提示重试即可
        setStatus('⚠ ' + (err && err.message ? err.message : '提交失败') + '——你的信息已暂存本机，请检查网络后重新点击提交。', 'err');
      });
  }

  formB.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = gather();
    var errs = validate(data);
    if (errs.length) {
      setStatus('请补充：' + errs.join('、') + '（请在本版上方表单内填写完整）', 'err');
      return;
    }
    submitApplication(data);
  });

  /* —— 图片选择控件 —— */
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      handleFiles(fileInput.files);
      fileInput.value = '';   // 允许重复选同一文件
    });
  }

  /* —— 焦点滚动：输入聚焦时把字段滚入可视区（防遮挡） —— */
  document.addEventListener('focusin', function (e) {
    var t = e.target;
    if (t && typeof t.matches === 'function' && t.matches('input, textarea, select')) {
      t.scrollIntoView({ block: 'nearest' });
    }
  });

  /* —— 草稿自动保存（防丢失，提交成功即清除） —— */
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
