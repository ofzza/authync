import { DEBUGGING } from '../consts.js';
import {
  registerHandler as registerConfigurationUpdateHandler,
  triggerHandlers as triggerConfigurationUpdateHandlers,
  defaultConfiguration,
  type Configuration,
  type ConfigurationUpdateMessage,
  type ConfigurationUpdateHandler,
} from '../config.js';
import { type Message, MessageType, registerHandler as registerMessageHandler } from '../messaging.js';

// Configuration background storage (TODO: Replace with persistent storage calls)
const _config: Configuration = defaultConfiguration;

/**
 * Initializes background configuration service
 */
export async function init() {
  // Handle configuration requests
  registerMessageHandler((message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: Message) => void) => {
    if (message.type === MessageType.ConfigurationRequest) {
      // Log: request received
      if (DEBUGGING) console.log('BACKGROUND | config.ts: Received ConfigurationRequest: ', message, sender);
      // Send configuration update
      const configurationUpdateMsg: ConfigurationUpdateMessage = {
        type: MessageType.ConfigurationUpdate,
        config: _config,
      };
      sendResponse(configurationUpdateMsg);
      // Log: sent update
      if (DEBUGGING) console.log('BACKGROUND | config.ts: Sent ConfigurationUpdate: ', configurationUpdateMsg);
    }
  });
}

/**
 * Gets persisted configuration
 * @returns Persisted configuration
 */
export async function getConfiguration(): Promise<Configuration> {
  return Promise.resolve(_config);
}

/**
 * Registers configuration update handler
 */
export function registerHandler(handler: ConfigurationUpdateHandler) {
  registerConfigurationUpdateHandler(handler);
  handler(_config);
}
