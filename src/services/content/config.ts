import { DEBUGGING } from '../consts.js';
import {
  registerHandler as registerConfigurationUpdateHandler,
  triggerHandlers as triggerConfigurationUpdateHandlers,
  verifyUrlAgainstDocumentUrlPatterns,
  defaultConfiguration,
  type Configuration,
  type DocumentUrlPatternConfiguration,
  type ConfigurationRequestMessage,
  type ConfigurationUpdateMessage,
  type ConfigurationUpdateHandler,
} from '../config.js';
import { send, registerHandler as registerMessageHandler, type Message, MessageType } from './messaging.js';

// Configuration content storage (TODO: Replace with persistent storage calls)
let _config: Configuration = defaultConfiguration;

/**
 * Initializes content configuration service
 */
export async function init() {
  // Log: sending request
  if (DEBUGGING) console.log('CONTENT | config.ts: Sending ConfigurationRequest');
  // Request a configuration update
  const msg: ConfigurationRequestMessage = { type: MessageType.ConfigurationRequest };
  const configurationUpdateMsg = (await send(msg)) as ConfigurationUpdateMessage | undefined;
  if (configurationUpdateMsg !== undefined) {
    // Log: update received
    if (DEBUGGING) console.log('BACKGROUND | config.ts: Received ConfigurationUpdate: ', configurationUpdateMsg);
    // Store configuration update
    _config = configurationUpdateMsg.config;
  }

  // Handle configuration updates
  registerMessageHandler(async (message: Message, sender: chrome.runtime.MessageSender) => {
    if (message.type === MessageType.ConfigurationUpdate) {
      // Log: update received
      if (DEBUGGING) console.log('BACKGROUND | config.ts: Received ConfigurationUpdate: ', message, sender);
      // Store configuration update
      _config = message.config;
      // Process configuration update(s)
      triggerConfigurationUpdateHandlers(_config);
    }
  });
}

/**
 * Registers configuration update handler
 */
export function registerHandler(handler: ConfigurationUpdateHandler) {
  registerConfigurationUpdateHandler(handler);
  handler(_config);
}

/**
 * Gets configuration for a tab based off of its URL
 * @param url Tab URL to match against configuration document URL patterns
 * @returns Appropriate configuration if one is found
 */
export function findDocumentUrlPatternConfiguration(url: string, config: Configuration = _config): [string, DocumentUrlPatternConfiguration] | undefined {
  for (const pattern of Object.keys(config.documentUrlPatterns)) {
    if (verifyUrlAgainstDocumentUrlPatterns(url, [pattern])) {
      return config.documentUrlPatterns[pattern] !== undefined ? [pattern, config.documentUrlPatterns[pattern]] : undefined;
    }
  }
}
