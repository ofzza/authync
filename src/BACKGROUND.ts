import { DEBUGGING } from './services/consts.js';
import { init as initGist } from './services/gist.js';
import { init as initMessaging } from './services/messaging.js';
import { init as initConfig } from './services/background/config.js';
import { init as initCookies } from './services/background/cookies.js';
import { init as initContextMenu } from './services/background/context_menu.js';

// Log: script loaded
if (DEBUGGING) console.log('BACKGROUND | background.ts: Loaded ...');

// Initialize services
(async () => {
  await initGist();
  await initCookies();
  await initMessaging();
  await initConfig();
  await initContextMenu();
})();
