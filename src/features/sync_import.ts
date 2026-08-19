import { DEBUGGING } from '../services/consts.js';
import { defaultConfiguration, type Configuration, findDocumentUrlPatternConfiguration } from '../services/config.js';
import { type SyncImportRequest, type SyncTargets } from '../services/sync.js';
import { readFromGist } from '../services/gist.js';
import type { CookiesImportRequest, CookiesImportResponse } from '../services/cookies.js';
import { registerHandler as registerMessageHandler, MessageType, type Message, sendToBackground } from '../services/content/messaging.js';
import { registerHandler as registerConfigurationUpdateHandler } from '../services/content/config.js';
import { setAllLocalStorage } from '../services/content/local_storage.js';
import { toast } from '../services/content/toast.js';
import { detectResourceOrigins } from '../services/content/origin.js';

let updateLastCookieImportToast: ReturnType<typeof toast> | undefined = undefined;

/**
 * Initializes content sync importing refreshing service
 */
export async function init() {
  // Register for configuration updates
  registerConfigurationUpdateHandler(config => {
    // Log: config change
    if (DEBUGGING) console.log('CONTENT | sync_import.ts: Configuration change detected ...');
    // Find appropriate configuration based on URL
    const found = findDocumentUrlPatternConfiguration(window.location.toString(), config);
    if (found) {
      const [documentUrlPattern, documentUrlPatternConfig] = found;
      // Manage service
      if (documentUrlPatternConfig.sync.active && documentUrlPatternConfig.sync.direction === 'import') {
        start(config, documentUrlPattern);
      } else {
        stop();
      }
    }
  });

  // Register for cookie import response
  registerMessageHandler(async (message: Message, sender: chrome.runtime.MessageSender) => {
    if (message.type === MessageType.CookiesImportResponse) {
      // Log: update received
      if (DEBUGGING) console.log('CONTENT | config.ts: Received Cookie import update: ', message, sender);
      // Prompt
      const msg = message as CookiesImportResponse;
      if (msg.success) {
        updateLastCookieImportToast?.('success', `Imported ${msg.count} cookies`);
      } else {
        updateLastCookieImportToast?.('warning', `Failed importing cookies!`);
      }
    }
  });

  // Register for messages
  registerMessageHandler(async (message: Message) => {
    if (message.type === MessageType.SyncImportRequest) {
      await importAllFromGist((message as SyncImportRequest).documentUrlPattern, (message as SyncImportRequest).targets);
    }
  });
}

/**
 * Starts service
 */
function start(config: Configuration, documentUrlPattern: string) {
  // Log: starting
  if (DEBUGGING) console.log('CONTENT | sync_import.ts: Starting sync importing service ...');
  // Store configuration
  _config = config;
  _documentUrlPattern = documentUrlPattern;
  // Register interval handler
  scheduleInterval();
}

/**
 * Stops service
 */
function stop() {
  // Log: stopping
  if (DEBUGGING) console.log('CONTENT | sync_import.ts: Stopping sync importing service ...');
  // Unregister interval handler
  unscheduleInterval();
}

// Holds latest configuration
let _config: Configuration = defaultConfiguration;
// Holds matched document url pattern
let _documentUrlPattern: string = '';

// Holds registered idle timeout
let _interval: any;

/**
 * Schedules idle timeout handler
 */
function scheduleInterval() {
  // Unschedule any previously scheduled syncs
  unscheduleInterval();
  // Run right away and schedule to run on an interval
  onInterval();
  const time = _config.documentUrlPatterns[_documentUrlPattern]!.sync.interval;
  _interval = setInterval(onInterval, time);
}
/**
 * Un-schedules idle timeout handler
 */
function unscheduleInterval() {
  if (_interval !== undefined) clearTimeout(_interval);
  _interval = undefined;
}

/**
 * Idle timeout handler
 */
async function onInterval() {
  // Log: starting
  if (DEBUGGING) console.log('CONTENT | sync_import.ts: Interval detected - Importing auth ...');
  // Import tab auth
  await importAllFromGist(undefined);
}

/**
 * Import all of relevant tab data from Gist
 */
async function importAllFromGist(documentUrlPattern: string | undefined, targets: SyncTargets[] = ['cookies', 'localStorage']) {
  if (targets.includes('cookies')) await importCookiesFromGist(documentUrlPattern ?? _documentUrlPattern);
  if (targets.includes('localStorage')) await importLocalStorageFromGist(documentUrlPattern ?? _documentUrlPattern);
}

/**
 * Import tab's local storage from Gist
 */
async function importCookiesFromGist(documentUrlPattern: string) {
  // Prompt importing
  updateLastCookieImportToast = toast('info', 'Importing cookies ...');
  // Log: importing cookies
  if (DEBUGGING) console.log('CONTENT | sync_import.ts: Requesting cookies import from Gist ...');
  // Request cookies import
  const msg: CookiesImportRequest = {
    type: MessageType.CookiesImportRequest,
    origins: await detectResourceOrigins(),
    url: window.location.toString(),
    documentUrlPattern,
  };
  await sendToBackground(msg);
}

/**
 * Import tab's local storage from Gist
 */
async function importLocalStorageFromGist(documentUrlPattern: string) {
  // Prompt
  const updateToast = toast('info', `Importing local storage ...`);
  try {
    // Import from gist
    const data = await readFromGist(`${btoa(documentUrlPattern)}_LOCALSTORAGE`);
    // Log: importing local storage
    if (DEBUGGING) console.log('CONTENT | sync_import.ts: Importing local storage from Gist: ', data);
    // Set local storage data
    await setAllLocalStorage(data);
    // Prompt
    updateToast('success', `Imported ${Object.keys(data).length} local storage records`);
  } catch {
    // Prompt
    updateToast('warning', 'Failed importing local storage records!');
  }
}
