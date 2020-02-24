import { Component, OnInit } from '@angular/core';
import Tab = chrome.tabs.Tab;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor() {}

  private cacheEnabled: false;
  private currentDomain: string;
  private whitelistInputValue: string = null;
  private whitelist: string[] = [];

  ngOnInit(): void {
    chrome.storage.sync.get(['cacheEnabled'], (result) => {
      this.cacheEnabled = result.cacheEnabled;
      console.log('Cache Enabled: ' + this.cacheEnabled);
    });

    this.getWhitelistFromLocalStorage();
    this.setCurrentTabUrl();
  }

  connectToBackgroundScript(messagePayload): void {
    const message = { messagePayload };
    const messageSendCallback = () => {};

    chrome.runtime.sendMessage(message, messageSendCallback);
  }

  clearCacheClick(): void {
    this.connectToBackgroundScript({
      cacheCleanType: 'total'
    });
  }

  cacheEnableChange(event): void {
    this.cacheEnabled = event.target.checked;
    chrome.storage.sync.set({cacheEnabled: this.cacheEnabled}, () => {});
  }

  addToWhitelist(url: string): void {
    this.whitelist.push(url);
    this.whitelistInputValue = '';
    this.updateWhitelistInLocalStorage();
  }

  getWhitelistFromLocalStorage(): void {
    chrome.storage.sync.get(['whitelistItems'], (result) => {
      if (result.whitelistItems) {
        this.whitelist = result.whitelistItems;
        console.log(this.whitelist);
      }
    });
  }

  updateWhitelistInLocalStorage(): void {
    chrome.storage.sync.set({whitelistItems: this.whitelist}, () => {});
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

}
