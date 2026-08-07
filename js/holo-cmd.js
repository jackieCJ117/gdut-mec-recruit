/* ============================================================
   机创全息终端 CYBER 2026 · holo-cmd.js（v4，集成到小机终端）
   终端底部输入框输入命令 → 输出滚进终端屏幕（与启动日志同屏）
   命令：help / groups / status / join / 报名 / whoami / clear
   依赖：book.js（join 跳转 08 屏）
   ============================================================ */
(function () {
  "use strict";

  var input = document.getElementById("termCmdInput");
  var screen = document.getElementById("termScreen");
  if (!input || !screen) return;

  var GROUPS = [
    ["MECH", "结构组"],
    ["EMBED", "电控组"],
    ["VISION", "视觉识别组"],
    ["MEDIA", "运营组"]
  ];

  /* —— 输出一行（复用终端屏幕行样式 + 行色类） —— */
  function line(text, cls) {
    var div = document.createElement("div");
    div.className = "holo-term__line" + (cls ? " " + cls : "");
    div.textContent = text;
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
  }

  /* —— 命令表 —— */
  function run(cmd) {
    var c = cmd.trim().toLowerCase();
    line("> " + (cmd.trim() || "(空)"), "cmd-echo");
    switch (c) {
      case "help":
        line("可用命令: help / groups / status / join / whoami / clear");
        break;
      case "groups":
        GROUPS.forEach(function (g) {
          line("[" + g[0] + "] " + g[1] + " .......... ONLINE", "cmd-ok");
        });
        break;
      case "status":
        line("SYSTEM STATUS: ACTIVE", "cmd-ok");
        line("DATA STREAM: 78%");
        line("MODULES: 09/09 LOADED");
        line("四组联动: MECH / EMBED / VISION / MEDIA");
        break;
      case "join":
      case "报名":
        line("正在跳转 08 报名模块...", "cmd-ok");
        line("填写表单 → 提交 → 我们会在招新群联系你。");
        window.setTimeout(function () {
          var chip = document.querySelector('.chip[data-go="8"]');
          if (chip) chip.click();
        }, 600);
        break;
      case "whoami":
        line("你: 机创 2026 届准成员 (待认证)", "cmd-gold");
        break;
      case "clear":
        screen.innerHTML = "";
        return;
      default:
        line("未知命令: " + c + " — 输入 help 查看可用命令", "cmd-warn");
    }
  }

  /* —— 绑定 —— */
  input.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    run(input.value);
    input.value = "";
  });
})();
