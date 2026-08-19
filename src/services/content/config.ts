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
import { sendToBackground, registerHandler as registerMessageHandler, type Message, MessageType } from './messaging.js';

// Configuration content storage (TODO: Replace with persistent storage calls)
let _config: Configuration = defaultConfiguration;

/**
 * Initializes content configuration service
 */
export async function init() {
  // Handle configuration updates
  registerMessageHandler(async (message: Message, sender: chrome.runtime.MessageSender) => {
    if (message.type === MessageType.ConfigurationUpdate) {
      // Log: update received
      if (DEBUGGING) console.log('CONTENT | config.ts: Received ConfigurationUpdate: ', message, sender);
      // Store configuration update
      _config = message.config;
      // Process configuration update(s)
      triggerConfigurationUpdateHandlers(_config);
    } else {
      // Log: unknown received
      if (DEBUGGING) console.log('CONTENT | config.ts: Received UNKNOWN: ', message, sender);
    }
  });

  // Log: sending request
  if (DEBUGGING) console.log('CONTENT | config.ts: Sending ConfigurationRequest');
  // Request a configuration update
  const msg: ConfigurationRequestMessage = { type: MessageType.ConfigurationRequest };
  const configurationUpdateMsg = (await sendToBackground(msg)) as ConfigurationUpdateMessage | undefined;
  if (configurationUpdateMsg !== undefined) {
    // Log: update received
    if (DEBUGGING) console.log('CONTENT | config.ts: Received ConfigurationUpdate: ', configurationUpdateMsg);
    // Store configuration update
    _config = configurationUpdateMsg.config;
    // Process configuration update(s)
    triggerConfigurationUpdateHandlers(_config);
  }
}

/**
 * Registers configuration update handler
 */
export function registerHandler(handler: ConfigurationUpdateHandler) {
  registerConfigurationUpdateHandler(handler);
  handler(_config);
}
