/* ============================================================
   机创全息终端 CYBER 2026 · holo-term.js
   JARVIS 风格终端窗：右侧 dock 点击展开 + 自动逐行输出日志
   日志内容改 TERM_LOG 即可（t=文本 c=行色 dim/cyan/ok/warn/cn）
   ============================================================ */
(function () {
  "use strict";

  var panel = document.getElementById("termPanel");
  var core = document.getElementById("termCore");
  var screen = document.getElementById("termScreen");
  var timer = null;

  /* ============================================================
     终端日志（氛围 + 真实招新信息混合，占位信息上线前替换）
     ============================================================ */
  var TERM_LOG = [
    { t: "> JICHUANG HOLO SYSTEM v2026.08", c: "cyan" },
    { t: "> BOOT SEQUENCE INITIATED .................", c: "dim" },
    { t: "> SCANNING MODULES 01-09 .............. 9/9 OK", c: "" },
    { t: "> LOADING GROUP: MECH ............... ONLINE", c: "" },
    { t: "> LOADING GROUP: EMBED .............. ONLINE", c: "" },
    { t: "> LOADING GROUP: VISION ............. ONLINE", c: "" },
    { t: "> LOADING GROUP: MEDIA .............. ONLINE", c: "" },
    { t: "", c: "" },
    { t: "> 招新通道: 开启 ONLINE", c: "ok" },
    { t: "> 报名群号: XXXX（占位）", c: "cn" },
    { t: "> 报名截止: 9 月 X 日（占位）", c: "warn" },
    { t: "> 四组联动: MECH / EMBED / VISION / MEDIA", c: "cn" },
    { t: "", c: "" },
    { t: "> SYNC COMPLETE. WELCOME, RECRUIT.", c: "ok" }
  ];

  /* —— 输出 —— */
  function clearScreen() {
    screen.innerHTML = "";
  }

  function addLine(line) {
    var div = document.createElement("div");
    div.className = "holo-term__line" + (line.c ? " holo-term__line--" + line.c : "");
    div.textContent = line.t || " ";
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
  }

  function playLog() {
    stopLog();
    clearScreen();
    var i = 0;
    timer = window.setInterval(function () {
      if (i >= TERM_LOG.length) {
        stopLog();
        return;
      }
      addLine(TERM_LOG[i]);
      i += 1;
    }, 110);
  }

  function stopLog() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  /* —— 展开 / 收起 —— */
  function open() {
    if (!panel) return;
    panel.hidden = false;
    panel.classList.remove("is-closing");
    /* 重触发散开故障帧动画 */
    panel.classList.remove("is-opening");
    void panel.offsetWidth;
    panel.classList.add("is-opening");
    panel.classList.add("is-open");
    if (core) {
      core.classList.add("is-on");
      core.setAttribute("aria-expanded", "true");
    }
    playLog();
  }

  function close() {
    if (!panel) return;
    stopLog();
    panel.classList.remove("is-open");
    panel.classList.add("is-closing");
    if (core) {
      core.classList.remove("is-on");
      core.setAttribute("aria-expanded", "false");
    }
    window.setTimeout(function () {
      panel.classList.remove("is-opening", "is-closing");
      panel.hidden = true;
    }, 300);
  }

  /* —— 绑定 —— */
  if (core) core.addEventListener("click", function () {
    if (panel.classList.contains("is-open")) close();
    else open();
  });
  var closeBtn = document.getElementById("termClose");
  if (closeBtn) closeBtn.addEventListener("click", close);

  /* ESC 收起 */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });
})();
