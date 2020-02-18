import { Component, OnInit } from '@angular/core';
import Tab = chrome.tabs.Tab;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor() {}

  cacheEnabled: false;
  currentDomain: string;
  whitelistInputValue: string = null;
  whitelist: string[] = [];

  ngOnInit(): void {
    chrome.storage.sync.get(['cacheEnabled'], (result) => {
      this.cacheEnabled = result.cacheEnabled;
    });

    this.getWhitelistFromLocalStorage();
    this.setCurrentTabHostname();
  }

  clearCacheClick(): void {
    if (this.cacheEnabled) {
      this.clearCache();
    }
  }
  
  cacheEnableChange(event): void {
    this.cacheEnabled = event.target.checked;
    
    chrome.storage.sync.set({cacheEnabled: this.cacheEnabled}, () => {});
  }

  addToWhitelist(url: string): void {
    this.whitelist.push(url);
    this.whitelistInputValue = '';

    chrome.storage.sync.set({whitelistItems: this.whitelist}, () => {});
  }

  getWhitelistFromLocalStorage(): void {
    chrome.storage.sync.get(['whitelistItems'], (result) => {
      if (result.whitelistItems) {
        this.whitelist = result.whitelistItems;
      }
    });
  }

  removeWhitelistItemClick(url: string): void {
    this.whitelist = this.whitelist.filter(x => x !== url);
  }

  clearCache(): void {
    const callback = () => {
      alert('cache cleared.');
    };

    const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
    const oneWeekAgo = (new Date()).getTime() - millisecondsPerWeek;

    chrome.browsingData.remove({
      since: oneWeekAgo
    }, {
      appcache: true,
      cache: true,
      cookies: true,
      downloads: true,
      fileSystems: true,
      formData: true,
      history: false,
      indexedDB: true,
      localStorage: true,
      pluginData: true,
      passwords: false,
      serviceWorkers: true,
      webSQL: true
    }, callback);

  }

  setCurrentTabHostname(): void {
    let url: string;
    let domain: string;

    chrome.tabs.getSelected(null, (tab: Tab) => {
      url = tab.url;
      domain = (new URL(url)).hostname;
      this.currentDomain = domain;
    });
  }

}
