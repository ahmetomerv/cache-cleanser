import Tab = chrome.tabs.Tab;
import DataTypeSet = chrome.browsingData.DataTypeSet;
import Port = chrome.runtime.Port;

console.log('background.ts run.');

(() => {
  let whitelist: string[];
  let cleanRunning: boolean;
  let cacheCleanEnabled: boolean;
  let cookiesCleanEnabled: boolean;
  let runtimePort: Port;

  chrome.runtime.onConnect.addListener((port: Port): void => {
    runtimePort = port;
    console.log(port.name);
    port.onMessage.addListener((msg): any => {
      console.log(msg);
      if (msg.onLoad || msg.cleanButtonClick) {
        getLocalStorageData('whitelistItems').then((result: any) => whitelist = result);
        getLocalStorageData('cleanRunning').then((result: any) => cleanRunning = result);
        getLocalStorageData('cacheCleanEnabled').then((result: any) => cacheCleanEnabled = result);
        getLocalStorageData('cookiesCleanEnabled').then((result: any) => cookiesCleanEnabled = result);
        clean();
      }

      return true;
    });
  });

  function getLocalStorageData(key: string): Promise<any> {
    if (key && typeof key === 'string') {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, (result: any) => {
          chrome.runtime.lastError
              ? reject(Error(chrome.runtime.lastError.message))
              : resolve(result[key]);
            }
          );
        }
      );
    }
  }

  function getCurrentTabDomainAddress(): string {
    let url: string;
    let domain: string;

    chrome.tabs.getSelected(null, (tab: Tab) => {
      url = tab.url;
      domain = (new URL(url)).hostname;
      console.log(url, domain);
    });

    return domain;
  }

  function sendOneTimeRequest(messagePayload: any): void {
    if (messagePayload) {
      const message = messagePayload;
      const messageSendCallback = () => {};

      chrome.runtime.sendMessage(message, messageSendCallback);
    }
  }

  function sendRuntimeMessage(messagePayload: any): void {
    if (messagePayload && runtimePort) {
      chrome.runtime.connect({ name: 'background'} );
      runtimePort.postMessage(messagePayload);
    }
  }

  function cleanCallback(): void {
    cleanRunning = false;
    sendOneTimeRequest({
      canReload: true
    });
    console.log('cleanCallback called.');
  }

  function clean(): void {
    if (!cleanRunning && cacheCleanEnabled) {
      getLocalStorageData('whitelistItems').then((result: any) => whitelist = result);
      getLocalStorageData('cleanRunning').then((result: any) => cleanRunning = result);
      getLocalStorageData('cacheCleanEnabled').then((result: any) => cacheCleanEnabled = result);
      getLocalStorageData('cookiesCleanEnabled').then((result: any) => cookiesCleanEnabled = result);

      const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
      const oneWeekAgo = (new Date()).getTime() - millisecondsPerWeek;
      const dataToRemove: DataTypeSet = {
        appcache: true,
        cache: true,
        cookies: cookiesCleanEnabled,
        indexedDB: true,
        localStorage: true,
        serviceWorkers: true,
        webSQL: true
      };

      if (whitelist && whitelist.length > 0) {
        console.log('whitelist clean called');
        console.log(whitelist);
        cleanRunning = true;
        chrome.browsingData.remove({
          // @ts-ignore
          origins: [...whitelist],
          since: oneWeekAgo
        }, dataToRemove, cleanCallback);
      } else {
        console.log('default clean called');
        cleanRunning = true;
        chrome.browsingData.remove({
          // @ts-ignore
          since: oneWeekAgo
        }, dataToRemove, cleanCallback);
      }
    }
  }

})();
