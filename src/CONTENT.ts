import { DEBUGGING } from './services/consts.js';
import { init as initMessaging } from './services/content/messaging.js';
import { init as initConfig } from './services/content/config.js';
import { init as initRefresh } from './features/refresh.js';
import { init as initSyncExport } from './features/sync_export.js';
import { init as initSyncImport } from './features/sync_import.js';

// Log: script loaded
if (DEBUGGING) console.log('content.ts: Loaded ...');

// Initialize services
(async () => {
  await initMessaging();
  await initConfig();
  await Promise.all([initRefresh(), initSyncExport(), initSyncImport()]);
})();
