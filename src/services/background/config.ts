import { DEBUGGING } from '../consts.js';
import {
  registerHandler as registerConfigurationUpdateHandler,
  triggerHandlers as triggerConfigurationUpdateHandlers,
  defaultConfiguration,
  type Configuration,
  type DocumentUrlPatternConfiguration,
  type ConfigurationUpdateMessage,
  type ConfigurationEditRequestMessage,
  type ConfigurationPartialEditRequestMessage,
  type ConfigurationUpdateHandler,
} from '../config.js';
import { type Message, MessageType, registerHandler as registerMessageHandler } from '../messaging.js';
import { sendToTab } from './messaging.js';

// Configuration background storage (TODO: Replace with persistent storage calls)
let _config: Configuration = defaultConfiguration;

// Keep track of tabs having asked for configration
let _tabIds: number[] = [];

/**
 * Initializes background configuration service
 */
export async function init() {
  // Handle configuration requests
  registerMessageHandler((message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: Message) => void) => {
    if (message.type === MessageType.ConfigurationRequest) {
      // Log: request received
      if (DEBUGGING) console.log('BACKGROUND | config.ts: Received ConfigurationRequest: ', message, sender);
      // Register known tab
      if (sender.tab?.id && !_tabIds.includes(sender.tab?.id)) _tabIds.push(sender.tab?.id);
      // Send configuration update
      const configurationUpdateMsg: ConfigurationUpdateMessage = {
        type: MessageType.ConfigurationUpdate,
        config: _config,
      };
      sendResponse(configurationUpdateMsg);
      // Log: sent update
      if (DEBUGGING) console.log('BACKGROUND | config.ts: Sent ConfigurationUpdate: ', configurationUpdateMsg);
    }
    if (message.type === MessageType.ConfigurationEditRequest) {
      // Log: update received
      if (DEBUGGING) console.log('BACKGROUND | config.ts: Received ConfigurationEditRequest: ', message, sender);
      // Update configuration
      const _message = message as ConfigurationEditRequestMessage;
      updateConfig(_message.config);
    }
    if (message.type === MessageType.ConfigurationPartialEditRequest) {
      // Log: update received
      if (DEBUGGING) console.log('BACKGROUND | config.ts: Received ConfigurationPartialEditRequest: ', message, sender);
      // Update configuration
      const _message = message as ConfigurationPartialEditRequestMessage;
      updateDocumentUrlPatternConfig(_message.documentUrlPattern, _message.config);
    } else {
      // Log: unknown received
      if (DEBUGGING) console.log('BACKGROUND | config.ts: Received UNKNOWN: ', message, sender);
    }
  });

  // Load initial configuration
  let _localStorageConfiguration = (await chrome.storage.local.get(['configuration']))['configuration'];
  _config = _localStorageConfiguration ? JSON.parse(_localStorageConfiguration as string) : defaultConfiguration;
  // Send updated configuration
  updateConfig(_config);
}

/**
 * Gets persisted configuration
 * @returns Persisted configuration
 */
export async function getConfiguration(): Promise<Configuration> {
  return Promise.resolve(_config);
}

/**
 * Updates configuration
 * @param config Updated configuration
 */
export async function updateConfig(config: Configuration) {
  // Update configuration
  _config = config;
  // Persist configuration to local storage
  await chrome.storage.local.set({ configuration: JSON.stringify(_config) });
  // Announce update change
  triggerConfigurationUpdateHandlers(_config);
  triggerConfigurationUpdateToTabs(_config);
}

/**
 * Updates document url pattern configuration
 * @param pattern Pattern to update configuration for
 * @param config Updated configuration
 */
export async function updateDocumentUrlPatternConfig(pattern: string, config: DocumentUrlPatternConfiguration) {
  // Update document pattern configuration
  _config.documentUrlPatterns[pattern] = config;
  // Update configuration
  updateConfig(_config);
}

/**
 * Registers configuration update handler
 */
export function registerHandler(handler: ConfigurationUpdateHandler) {
  registerConfigurationUpdateHandler(handler);
  handler(_config);
}

/**
 * Sends updated configuration to all tabs that had previously registered by sending a ConfigurationRequest
 * @param config Updated configuration
 */
function triggerConfigurationUpdateToTabs(config: Configuration) {
  const configurationUpdateMsg: ConfigurationUpdateMessage = {
    type: MessageType.ConfigurationUpdate,
    config: _config,
  };
  const missingTabs: number[] = [];

  // Log
  if (DEBUGGING) console.log('BACKGROUND | config.ts: Sending ConfigurationUpdateMessage to tabs: ', configurationUpdateMsg, _tabIds);

  // Send configuration update to all known tabs
  for (const tabId of _tabIds) {
    // Send configuration update to tab
    try {
      sendToTab(tabId, configurationUpdateMsg);
    } catch {
      missingTabs.push(tabId);
    }
  }

  // Unregister tabs for which sending failed
  _tabIds = _tabIds.filter(id => !missingTabs.includes(id));
}
