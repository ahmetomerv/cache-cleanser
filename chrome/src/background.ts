import Tab = chrome.tabs.Tab;

console.log('background.ts run.');

(() => {
  let cacheCleanRunning: boolean;

  chrome.runtime.onMessage.addListener(onMessageReceiver);

  async function onMessageReceiver(message, sender, sendResponse): Promise<void> {
    let whitelist: string;
    let cleanCacheEnabled: boolean;

    await getLocalStorageData('cleanCacheEnabled').then((result: any) => cleanCacheEnabled = result);
    await getLocalStorageData('whitelistItems').then((result: any) => whitelist = result);

    if (cleanCacheEnabled) {
      totalCacheClean();
    } else if (whitelist && whitelist.length > 0) {
      whitelistCacheClean();
    }
  }

  function getLocalStorageData(key: string): Promise<any> {
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

  function bypassCacheReload(): void {
    console.log('bypassCacheReload was called.');
    if (!cacheCleanRunning) {
      chrome.tabs.reload({
        bypassCache: true
      });
    }
  }

  function cleanCacheCallback(): void {
    cacheCleanRunning = false;
    console.log('cleanCacheCallback was called.');
  }

  async function totalCacheClean(): Promise<void> {
    console.log('totalCacheClean was called.');
    const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
    const oneWeekAgo = (new Date()).getTime() - millisecondsPerWeek;
    let cleanCookiesEnabled: boolean;

    await getLocalStorageData('cleanCookiesEnabled').then((result: any) => cleanCookiesEnabled = result);

    if (!cacheCleanRunning) {
      cacheCleanRunning = true;
      chrome.browsingData.remove({
        since: oneWeekAgo
      }, {
        appcache: true,
        cache: true,
        cookies: cleanCookiesEnabled,
        indexedDB: true,
        localStorage: true,
        serviceWorkers: true,
        webSQL: true
      }, cleanCacheCallback);
    }
  }

  async function whitelistCacheClean(): Promise<void> {
    console.log('whitelistCacheClean was called.');
    if (!cacheCleanRunning) {
      const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
      const oneWeekAgo = (new Date()).getTime() - millisecondsPerWeek;
      let whitelist: string;
      let cleanCookiesEnabled: boolean;

      await getLocalStorageData('whitelistItems').then((result: any) => whitelist = result);
      await getLocalStorageData('cleanCookiesEnabled').then((result: any) => cleanCookiesEnabled = result);

      if (whitelist && whitelist.length > 0) {
        cacheCleanRunning = true;

        chrome.browsingData.remove({
          // @ts-ignore
          origins: [...whitelist],
          since: oneWeekAgo
        }, {
          appcache: true,
          cache: true,
          cookies: cleanCookiesEnabled,
          indexedDB: true,
          localStorage: true,
          serviceWorkers: true,
          webSQL: true
        }, cleanCacheCallback);
      }
    }
  }

})();
