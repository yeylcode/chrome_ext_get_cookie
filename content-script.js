// 注意，必须设置了run_at=document_start 此段代码才会生效
document.addEventListener("DOMContentLoaded", function () {
  // 注入自定义JS
  initCustomPanel();
});

function initCustomPanel() {
  let s_top_wrap = document.getElementById("s_top_wrap");
  s_top_wrap && s_top_wrap.remove();
  var panel = document.createElement("div");
  panel.className = "chrome-plugin-demo-panel";
  panel.innerHTML = `
		<h2> 演示区：</h2>
    <div>你也可以删除这段代码注入，在自己的网站中调用：javascript:window.postMessage({ cmd: "invoke", code: "getTldwCookie" }, "*")</div>
    <div>调用完本段代码之后，tldw的cookie便会存储到localStore中</div>
		<div class="btn-area" style="margin-bottom:100px">
			<a id="btn_get_tldw_cookie" href='javascript:window.postMessage({ cmd: "invoke", code: "getTldwCookie" }, "*")'>点我获取TldwCookie</a><br>
			<a id="btn_get_steam_cookie" href='javascript:window.postMessage({ cmd: "invoke", code: "getSteamCookie" }, "*")'>点我获取SteamCookie</a><br>
		</div>
 
	`;
  // panel.style = "display:none;";
  document.body.appendChild(panel);
}

window.addEventListener("message", (event) => {
  if (event.data.code == "getTldwCookie") {
    chrome.runtime.sendMessage(
      {
        action: "getCookie",
        domain: "172.30.6.14",
      },
      (res) => {
        localStorage.setItem("tldw_cookie", JSON.stringify(res));
      }
    );
  }
});
