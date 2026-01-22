import { DEBUGGING } from '../consts.js';
import { type SyncExportRequest } from '../sync.js';
import { writeToGist } from '../gist.js';
import { registerHandler as registerMessageHandler, MessageType } from './messaging.js';
import { defaultConfiguration, type Configuration, findDocumentUrlPatternConfiguration } from '../config.js';
import { registerHandler as registerConfigurationUpdateHandler } from './config.js';
import { exportAllCookies } from './cookies.js';
import { getAllLocalStorage } from './local_storage.js';
import { toast } from './prompt.js';

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

  // Register for messages
  registerMessageHandler(message => {
    if (message.type === MessageType.SyncExportRequest) {
      exportAllToGist((message as SyncExportRequest).documentUrlPattern);
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
  await exportAllToGist();
}

/**
 * Export all of relevant tab data to Gist
 */
async function exportAllToGist(documentUrlPattern: string = _documentUrlPattern) {
  await Promise.all([exportCookiesToGist(documentUrlPattern), exportLocalStorageToGist(documentUrlPattern)]);
}

/**
 * Export tab's local storage to Gist
 */
async function exportCookiesToGist(documentUrlPattern: string = _documentUrlPattern) {
  // Log: exporting cookies
  if (DEBUGGING) console.log('CONTENT | sync_export.ts: Requesting cookies export to Gist ...');
  // Request cookies export
  await exportAllCookies(documentUrlPattern);
}

/**
 * Export tab's local storage to Gist
 */
async function exportLocalStorageToGist(documentUrlPattern: string = _documentUrlPattern) {
  try {
    // Get local storage data
    const data = await getAllLocalStorage();
    // Log: exporting local storage
    if (DEBUGGING) console.log('CONTENT | sync_export.ts: Exporting local storage to Gist: ', data);
    // Export to gist
    await writeToGist(`${btoa(documentUrlPattern)}_LOCALSTORAGE`, data, { documentUrlPattern, exportType: 'localStorage' });
    // Prompt
    if (DEBUGGING) toast('info', `Exported ${Object.keys(data).length} local storage records`);
  } catch {
    // Prompt
    if (DEBUGGING) toast('warning', 'Failed exporting local storage records!');
  }
}
