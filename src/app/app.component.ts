import { Component, OnInit } from '@angular/core';
import Tab = chrome.tabs.Tab;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor() {}

  private cacheCleanEnabled: false;
  private cookiesCleanEnabled: false;
  private currentDomain: string;
  private whitelistInputValue: string = null;
  private whitelist: string[] = [];

  ngOnInit(): void {
    this.getLocalStorageData('cacheCleanEnabled').then((result: any) => this.cacheCleanEnabled = result);
    this.getLocalStorageData('cookiesCleanEnabled').then((result: any) => this.cookiesCleanEnabled = result);
    this.getLocalStorageData('whitelistItems').then((result: any) => this.whitelist = result && result.length ? result : []);
    this.setCurrentTabUrl();

    setTimeout(() => this.cacheCleanEnabled = this.cacheCleanEnabled, 0);
  }

  sendRuntimeMessage(messagePayload: any): void {
    if (messagePayload) {
      const port = chrome.runtime.connect({ name: 'extension'} );
      port.postMessage(messagePayload);
    }
  }

  clearClick(): void {
    this.sendRuntimeMessage({
      cleanButtonClick: true
    });
  }

  settingsInputChange(event: any): void {
    this.setLocalStorageData({
      cacheCleanEnabled: this.cacheCleanEnabled,
      cookiesCleanEnabled: this.cookiesCleanEnabled
    });
  }

  addToWhitelist(url: string): void {
    if (url) {
      this.whitelist.push(url);
      this.whitelistInputValue = '';
      this.updateWhitelistInLocalStorage();
    }
  }

  updateWhitelistInLocalStorage(): void {
    this.setLocalStorageData({ whitelistItems: this.whitelist });
  }

  removeWhitelistItemClick(url: string): void {
    this.whitelist = this.whitelist.filter(x => x !== url);
    this.updateWhitelistInLocalStorage();
  }

  setCurrentTabUrl(): void {
    chrome.tabs.getSelected(null, (tab: Tab) => {
      const domain = (new URL(tab.url)).hostname;
      this.currentDomain = domain;
    });
  }

  getLocalStorageData(key: string): Promise<any> {
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

  setLocalStorageData(dataObj: any): void {
    if (dataObj && typeof dataObj !== null) {
      chrome.storage.sync.set(dataObj, () => {});
    }
  }

}
