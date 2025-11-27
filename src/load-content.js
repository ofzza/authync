// Inject content module
const src = chrome.runtime.getURL('./CONTENT.js');
import(src);
