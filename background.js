chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == "getCookie") {
    chrome.cookies.getAll({ domain: request.domain }, function (cookies) {
      sendResponse({ cookies: cookies, request: request });
    });
  }
  return true;
});
