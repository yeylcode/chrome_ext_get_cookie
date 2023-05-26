> 上一篇：  [chrome扩展程序（一） 拦截、修改网络请求](https://juejin.cn/post/7234735713803321401)

# 需求背景：

有两个网站[网易buff](https://buff.163.com/) 和 [IGXE](https://igxe.cn)  都是卖游戏装备的网站，我想开发一个程序，将两个网站的商品合并成到一个系统中，这样就可以很方便的看出同一个商品在哪个平台的卖价更低，而这两个网站的商品列表需要登录才能查询，所以我的程序必须得获取到对应网站的cookie，然后拿上cookie在去伪装请求相关商品列表的接口，最后把多平台的数据合并到自己的程序中，实现查询，筛选，比价等功能。

# Chrome扩展简介：

扩展程序是基于网络技术（如 HTML、CSS 和 JavaScript）构建的软件程序。用来增强浏览器网页的功能，它是利用浏览器提供的已有功能和和各种API，进行功能组合，从而改善浏览器体验。

自 2022 年 1 月 17 日起，Chrome 网上应用店已停止接受新的 Manifest V2 扩展。强烈建议尽快将您的扩展迁移到 Manifest V3；[在Manifest V2 于 2024 年逐步淘汰](https://developer.chrome.com/docs/extensions/mv3/mv2-sunset/)后，这将成为强制性要求。
v3版本API : <https://developer.chrome.com/docs/extensions/reference/>

# 扩展基本结构：

1.  `manifest.json`：扩展程序的清单文件，必须包含在扩展根目录下。该文件定义了扩展程序的名称、版本号、图标、权限等信息。（必须）
2.  `background.js`：扩展程序的后台脚本文件，在扩展初始化时会被加载并持续运行。可用于处理网络请求、消息通信等任务。（必须）
3.  `popup.html` 和 `popup.js`：用于创建浮窗（Popup）界面的 HTML 文件和 JavaScript 脚本文件。浮窗是扩展程序中常见的交互方式，可以用来显示一些简单的用户界面或者帮助信息。（非必须）
4.  `content_scripts` 目录：包含了一系列 JavaScript、CSS 或者 HTML 文件，用于向页面注入自定义的样式和脚本。这些文件将会在扩展所设置的特定页面上执行。（非必须）
5.  `icons` 目录：包含了扩展所需的各种尺寸的图标文件，以供在 Chrome 浏览器工具栏、应用商店等位置使用。（非必须）

# 获取网站cookie：

使用到的核心API :

` chrome.cookies.getAll()`

`chrome.runtime.onMessage.addListener()`

` chrome.runtime.sendMessage`

大致原理： 在自己开发的网站中刷新页面时，扩展程序利用消息通信和chrome扩展的一些api获取到指定网站cookie，并存储到自己网站的cookie中，然后发起一个网络请求到服务端并把获取到的cookie当参数 发送到服务端

# 发送请求到服务端：

上一步已经获取到buff网站的cookie并存到了自己网站的cookie中，现在就可以在扩展程序中发起网络请求，把cookie存到服务器，另外chrome 扩展程序中发起网络请求是无视跨域问题的，这块下篇文章细说

# 核心代码

```js
//manifest.json
{
  "name": "获取指定网站cookie-chrome扩展程序",
  "version": "1.0",
  "manifest_version": 3,
  "description": "获取指定网站cookie-chrome扩展程序",

  "background": {
    "service_worker": "background.js"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "css": ["css/css.css"],
      "run_at": "document_start"
    }
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  },
  "permissions": ["scripting", "cookies", "storage"],
  "host_permissions": ["<all_urls>"]
}


```

```js
//background.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == "getCookie") {
    chrome.cookies.getAll({ domain: request.domain }, function (cookies) {
      sendResponse({ cookies: cookies, request: request });
    });
  }
  return true;
});

```

```js
//content-script.js
window.addEventListener("message", (event) => {
  if (event.data.code == "getBuffCookie") {
    chrome.runtime.sendMessage(
      {
        action: "getCookie",
        domain: "buff.163.com",
      },
      (res) => {
        localStorage.setItem("buff_cookie", JSON.stringify(res));
      }
    );
  }
});

```

通过在页面中调用 `javascript:window.postMessage({ cmd: "invoke", code: "getBuffCookie" }, "*")`,会触发`content-script.js` 中的监听函数`window.addEventListener("message"）`,在参数event.data.code 中根据业务自己处理

`chrome.runtime.sendMessage(params,function(e){})` 会向 `background.js` 中发送消息，用 `chrome.runtime.onMessage.addListener`接受, `background.js`中收到消息，用 `sendResponse({ cookies: cookies, request: request });`返回，这时`content-script.js`中的回调函数就会收到返回值

这些写的不太明白。。。。不懂可以多百度，关键词： chrome扩展程序 消息通信

# 程序源码

<https://github.com/hanpanapn/chrome_ext_get_cookie>

# 安全考虑：

```
通过如上手段，我们经过安装扩展程序，完全可以获取到任意已经打开的网站的cookie，因此还是不要安装来历不明的扩展,安装之后可以看看扩展程序详情页，会自动访问哪些地址

```

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c04b45c272ef49f4b72b889a77d82ca5~tplv-k3u1fbpfcp-watermark.image?)

 

# 总结：

本文主要分享如何利用chrome扩展程序的消息通信，和扩展的一些API获取指定网站的Cookie,但在实际开发中可能会遇到一些问题：如获取到cookie如何实时通过网络请求发送到服务端，目前的做法是获取到之后，是存到了自己网站中的cookie中，因为自己网站的cookie自己是有全部的权限的，在通过对自己网站cookie操作发送到服务器，下一篇文章，我将会探索一下获取的cookie不经过自己网站存储直接发送到服务器

> Tips：获取他人cookie并将其存储在自己的网站中可能会涉及法律方面的问题，同时也存在潜在的安全风险。此类行为可能会违反个人隐私规定，并被视为网络攻击或犯罪行为。建议遵守相关的法律法规，并避免从事任何非法或有害的活动。
