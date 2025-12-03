import { DEBUGGING } from './services/consts.js';
import { init as initMessaging } from './services/content/messaging.js';
import { init as initConfig } from './services/content/config.js';
import { init as initRefresh } from './services/content/refresh.js';
import { init as initCookies } from './services/content/cookies.js';
import { init as initSyncExport } from './services/content/sync_export.js';
import { init as initSyncImport } from './services/content/sync_import.js';

// Log: script loaded
if (DEBUGGING) console.log('content.ts: Loaded ...');

// Initialize services
(async () => {
  await initMessaging();
  await initConfig();
  await initCookies();
  await Promise.all([initRefresh(), initSyncExport(), initSyncImport()]);
})();
