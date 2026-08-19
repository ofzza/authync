import { DEBUGGING } from '../services/consts.js';
import { defaultConfiguration, type Configuration, findDocumentUrlPatternConfiguration } from '../services/config.js';
import { type SyncExportRequest, type SyncTargets } from '../services/sync.js';
import { writeToGist } from '../services/gist.js';
import type { CookiesExportRequest, CookiesExportResponse } from '../services/cookies.js';
import { registerHandler as registerMessageHandler, MessageType, type Message, sendToBackground } from '../services/content/messaging.js';
import { registerHandler as registerConfigurationUpdateHandler } from '../services/content/config.js';
import { getAllLocalStorage } from '../services/content/local_storage.js';
import { toast } from '../services/content/toast.js';
import { detectResourceOrigins } from '../services/content/origin.js';

let updateLastCookieExportToast: ReturnType<typeof toast> | undefined = undefined;

/**
 * Initializes content sync exporting refreshing service
 */
export async function init() {
  // Register for configuration updates
  registerConfigurationUpdateHandler(config => {
    // Log: config change
    if (DEBUGGING) console.log('CONTENT | sync_export.ts: Configuration change detected ...');
    // Find appropriate configuration based on URL
    const found = findDocumentUrlPatternConfiguration(window.location.toString(), config);
    if (found) {
      const [documentUrlPattern, documentUrlPatternConfig] = found;
      // Manage service
      if (documentUrlPatternConfig.sync.active && documentUrlPatternConfig.sync.direction === 'export') {
        start(config, documentUrlPattern);
      } else {
        stop();
      }
    }
  });

  // Register for cookie export response
  registerMessageHandler(async (message: Message, sender: chrome.runtime.MessageSender) => {
    if (message.type === MessageType.CookiesExportResponse) {
      // Log: update received
      if (DEBUGGING) console.log('CONTENT | config.ts: Received Cookie export update: ', message, sender);
      // Prompt
      const msg = message as CookiesExportResponse;
      if (msg.success) {
        updateLastCookieExportToast?.('success', `Exported ${msg.count} cookies`);
      } else {
        updateLastCookieExportToast?.('warning', `Failed exporting cookies!`);
      }
    }
  });

  // Register for messages
  registerMessageHandler(async (message: Message) => {
    if (message.type === MessageType.SyncExportRequest) {
      await exportAllToGist((message as SyncExportRequest).documentUrlPattern, (message as SyncExportRequest).targets);
    }
  });
}

/**
 * Starts service
 */
function start(config: Configuration, documentUrlPattern: string) {
  // Log: starting
  if (DEBUGGING) console.log('CONTENT | sync_export.ts: Starting sync exporting service ...');
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
  if (DEBUGGING) console.log('CONTENT | sync_export.ts: Stopping sync exporting service ...');
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
  // Run right away (in 5 secs) and schedule to run on an interval
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
  if (DEBUGGING) console.log('CONTENT | sync_export.ts: Interval detected - Exporting auth ...');
  // Export tab auth
  await exportAllToGist(undefined);
}

/**
 * Export all of relevant tab data to Gist
 */
async function exportAllToGist(documentUrlPattern: string | undefined, targets: SyncTargets[] = ['cookies', 'localStorage']) {
  if (targets.includes('cookies')) await exportCookiesToGist(documentUrlPattern ?? _documentUrlPattern);
  if (targets.includes('localStorage')) await exportLocalStorageToGist(documentUrlPattern ?? _documentUrlPattern);
}

/**
 * Export tab's local storage to Gist
 */
async function exportCookiesToGist(documentUrlPattern: string) {
  // Prompt exporting
  updateLastCookieExportToast = toast('info', 'Exporting cookies ...');
  // Log: exporting cookies
  if (DEBUGGING) console.log('CONTENT | sync_export.ts: Requesting cookies export to Gist ...');
  // Request cookies export
  const msg: CookiesExportRequest = { type: MessageType.CookiesExportRequest, origins: await detectResourceOrigins(), documentUrlPattern };
  await sendToBackground(msg);
}

/**
 * Export tab's local storage to Gist
 */
async function exportLocalStorageToGist(documentUrlPattern: string) {
  // Prompt exporting
  const updateToast = toast('info', 'Exporting local storage ...');
  try {
    // Get local storage data
    const data = await getAllLocalStorage();
    // Log: exporting local storage
    if (DEBUGGING) console.log('CONTENT | sync_export.ts: Exporting local storage to Gist: ', data);
    // Export to gist
    await writeToGist(`${btoa(documentUrlPattern)}_LOCALSTORAGE`, data, { documentUrlPattern, exportType: 'localStorage' });
    // Prompt
    updateToast('success', `Exported ${Object.keys(data).length} local storage records`);
  } catch {
    // Prompt
    updateToast('warning', 'Failed exporting local storage records!');
  }
}
