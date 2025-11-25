// Inject content module
const s = document.createElement('script');
s.src = chrome.runtime.getURL('./content.mjs');
s.type = 'module';
s.onload = () => s.remove();
(document.head || document.documentElement).append(s);
