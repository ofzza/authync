import { DEBUGGING } from './services/consts.js';
import { init as initMessaging, registerHandler as registerMessagingHandler, MessageType } from './services/messaging.js';
import { init as initConfig } from './services/background/config.js';
import { init as initCookies } from './services/background/cookies.js';

// Log: script loaded
if (DEBUGGING) console.log('BACKGROUND | background.ts: Loaded ...');

// Initialize services
(async () => {
  await initMessaging();
  await initConfig();
  await initCookies();
})();
