import Tab = chrome.tabs.Tab;
console.log('background.ts run.');


(() => {

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
      console.log(changeInfo.status);
    }
  });

  chrome.runtime.onMessage.addListener(receiver);

  async function receiver(request, sender, sendResponse) {
    console.log(request);
    let whitelist: string[];
    let cacheEnabled: boolean;

    await getLocalStorageData('whitelistItems').then(res => whitelist = res);
    await getLocalStorageData('cacheEnabled').then(res => cacheEnabled = res);

    if (request.cacheCleanType === 'total') {
      totalCacheClean();
    }

    if (request.onLoad) {
      if (whitelist && whitelist.length > 0) {
        whitelistCacheClean();
      } else if (cacheEnabled) {
        totalCacheClean();
      }
    }

    return true;
  }

  const getLocalStorageData = (key: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(key, (result: any) => {
          chrome.runtime.lastError
            ? reject(Error(chrome.runtime.lastError.message))
            : resolve(result[key]);
          }
        );
      }
    );
  };

  const getCurrentTabDomainAddress = (): string => {
    let url: string;
    let domain: string;

    chrome.tabs.getSelected(null, (tab: Tab) => {
      url = tab.url;
      domain = (new URL(url)).hostname;
      console.log(url, domain);
    });

    return domain;
  };

  const bypassCacheReload = (): void => {
    chrome.tabs.reload({
      bypassCache: true
    });
  };

  const cleanCacheCallback = (): void => {
    bypassCacheReload();
  };

  const totalCacheClean = (): void => {
    const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
    const oneWeekAgo = (new Date()).getTime() - millisecondsPerWeek;

    chrome.browsingData.remove({
      since: oneWeekAgo
    }, {
      appcache: true,
      cache: true,
      cookies: true,
      indexedDB: true,
      localStorage: true,
      serviceWorkers: true,
      webSQL: true
    }, cleanCacheCallback);
  };

  const whitelistCacheClean = async (): Promise<void> => {
    const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
    const oneWeekAgo = (new Date()).getTime() - millisecondsPerWeek;
    let whitelist: string[];

    await getLocalStorageData('whitelistItems').then((res: any) => whitelist = res);

    chrome.browsingData.remove({
      // @ts-ignore
      origins: [...whitelist],
      since: oneWeekAgo
    }, {
      appcache: true,
      cache: true,
      cookies: true,
      indexedDB: true,
      localStorage: true,
      serviceWorkers: true,
      webSQL: true
    }, cleanCacheCallback);


  };

  /*chrome.tabs.getSelected(null, (tab: Tab) => {
    url = tab.url;
    domain = (new URL(url)).hostname;
    console.log(url);
  });*/

})();
