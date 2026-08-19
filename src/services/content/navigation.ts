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

/**
 * Initializes content configuration service
 */
export async function init() {
  // Handle configuration updates
  registerMessageHandler(async (message: Message, sender: chrome.runtime.MessageSender) => {
    if (message.type === MessageType.PreventNavigation) {
      // Log: update received
      if (DEBUGGING) console.log('CONTENT | navigation.ts: Received PreventNavigation: ', message, sender);
      // Prevent navigation
      window.onbeforeunload = () => false;
    }
  });
}
