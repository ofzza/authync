import { DEBUGGING } from '../consts.js';
import { defaultConfiguration, type Configuration } from '../config.js';
import { readFromGist } from '../gist.js';
import { registerHandler as registerConfigurationUpdateHandler, findDocumentUrlPatternConfiguration } from './config.js';
import { importAllCookies } from './cookies.js';
import { setAllLocalStorage } from './local_storage.js';

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
  await importAllFromGist();
}

/**
 * Import all of relevant tab data from Gist
 */
async function importAllFromGist() {
  await Promise.all([importCookiesFromGist(), importLocalStorageFromGist()]);
}

/**
 * Import tab's local storage from Gist
 */
async function importCookiesFromGist() {
  // Log: importing cookies
  if (DEBUGGING) console.log('CONTENT | sync_import.ts: Requesting cookies import from Gist ...');
  // Request cookies import
  await importAllCookies(window.location.toString(), _documentUrlPattern);
}

/**
 * Import tab's local storage from Gist
 */
async function importLocalStorageFromGist() {
  // Import from gist
  const data = await readFromGist(`${btoa(_documentUrlPattern)}_localStorage`);
  // Log: importing local storage
  if (DEBUGGING) console.log('CONTENT | sync_import.ts: Importing local storage from Gist: ', data);
  // Set local storage data
  await setAllLocalStorage(data);
}
