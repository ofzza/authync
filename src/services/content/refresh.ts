import { DEBUGGING } from '../consts.js';
import { registerHandler as registerConfigurationUpdateHandler, findDocumentUrlPatternConfiguration } from './config.js';

/**
 * Initializes content tab refreshing service
 */
export async function init() {
  // Register for configuration updates
  registerConfigurationUpdateHandler(config => {
    // Log: config change
    if (DEBUGGING) console.log('CONTENT | refresh.ts: Configuration change detected ...');
    // Find appropriate configuration based on URL
    const found = findDocumentUrlPatternConfiguration(window.location.toString(), config);
    if (found) {
      const [_, documentUrlPatternConfig] = found;
      // Manage service
      if (documentUrlPatternConfig.refresh.active) {
        start(documentUrlPatternConfig.refresh.interval);
      } else {
        stop();
      }
    }
  });
}

/**
 * Starts service
 */
export function start(idle: number) {
  // Log: starting
  if (DEBUGGING) console.log('CONTENT | refresh.ts: Starting refresh service ...');
  // Store idle value
  _time = idle;
  // Register user interaction handlers to detect page activity
  document.body.addEventListener('mousemove', documentBodyMouseMoveHandler);
  document.body.addEventListener('keydown', documentBodyKeyDownHandler);
  // Register idle timeout handler
  scheduleIdleTimeout();
}

/**
 * Stops service
 */
export function stop() {
  // Log: stopping
  if (DEBUGGING) console.log('CONTENT | refresh.ts: Stopping refresh service ...');
  // Unregister user interaction handlers to detect page activity
  document.body.removeEventListener('mousemove', documentBodyMouseMoveHandler);
  document.body.removeEventListener('keydown', documentBodyKeyDownHandler);
  // Unregister idle timeout handler
  unscheduleIdleTimeout();
}

// Holds idle timeout value
let _time: number = 0;

/**
 * Mouse move handler
 */
function documentBodyMouseMoveHandler() {
  scheduleIdleTimeout();
}
/**
 * Key down handler
 */
function documentBodyKeyDownHandler() {
  scheduleIdleTimeout();
}

// Holds registered idle timeout
let _timeout: any;

/**
 * Schedules idle timeout handler
 */
function scheduleIdleTimeout() {
  unscheduleIdleTimeout();
  _timeout = setTimeout(onIdleTimeout, _time);
}
/**
 * Un-schedules idle timeout handler
 */
function unscheduleIdleTimeout() {
  if (_timeout !== undefined) clearTimeout(_timeout);
  _timeout = undefined;
}

/**
 * Idle timeout handler
 */
function onIdleTimeout() {
  // Log: starting
  if (DEBUGGING) console.log('CONTENT | refresh.ts: Idle interval detected - REFRESHING TAB!');
  // Reschedule (in case refresh fails)
  scheduleIdleTimeout();
  // Refresh tab
  window.location.reload();
}
