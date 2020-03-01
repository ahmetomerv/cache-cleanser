console.log('content.ts');

const message = { onLoaded: true };
const messageSendCallback = () => {};

chrome.runtime.sendMessage(message, messageSendCallback);
