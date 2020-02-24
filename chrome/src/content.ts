console.log('content.ts');

const message = { onLoad: true };
const messageSendCallback = () => {};

chrome.runtime.sendMessage(message, messageSendCallback);
