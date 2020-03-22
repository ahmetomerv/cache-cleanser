(() => {
  const message = { onLoad: true };
  // sendRuntimeMessage(message);
  // onBeforeUnloadEvent();

  chrome.runtime.onMessage.addListener(onMessageReceiver);

  function onMessageReceiver(res): any {
    console.log(res);
    if (res.canReload) {
      bypassCacheReload();
    }

    return true;
  }

  function sendRuntimeMessage(messagePayload: any): void {
    if (messagePayload) {
      const messageSendCallback = () => {};
      chrome.runtime.sendMessage(message, messageSendCallback);
    }
  }

  function bypassCacheReload(): void {
    console.log('bypassCacheReload was called.');
    chrome.tabs.reload({
      bypassCache: true
    });
  }

  function onBeforeUnloadEvent(): void {
    console.log('interceptLoad called.');

    window.confirm = () => {
      return true;
    };

    window.onbeforeunload = () => {
      console.log('onbeforeunload event');
      bypassCacheReload();
    };
  }

})();

