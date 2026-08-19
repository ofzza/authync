import { DEBUGGING } from './consts.js';

/**
 * Messaging service message type definition
 */
export type Message = {
  type: MessageType;
  [key: PropertyKey]: any;
};

/**
 * Messaging service message types' type definition
 */
export enum MessageType {
  Log = 'log',
  PreventNavigation = 'prevent_navigation',
  ConfigurationRequest = 'configuration_request',
  ConfigurationUpdate = 'configuration_update',
  ConfigurationEditRequest = 'configuration_edit_request',
  ConfigurationPartialEditRequest = 'configuration_partial_edit_request',
  SyncExportRequest = 'sync_export_request',
  SyncImportRequest = 'sync_import_request',
  CookiesExportRequest = 'cookies_export_request',
  CookiesExportResponse = 'cookies_export_response',
  CookiesImportRequest = 'cookies_import_request',
  CookiesImportResponse = 'cookies_import_response',
}

/**
 * Message handler function type
 */
export type MessageHandlerFn = (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: Message) => void) => void;

/**
 * Initialize background message router
 */
export async function init() {
  // Listen to all incoming messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Log: message received
    if (DEBUGGING) console.log('COMMON | messaging.ts: Received message: ', message, sender);
    // Route to all handlers
    for (const handler of handlers) handler(message as Message, sender, sendResponse);
  });
}

// Stores all registered message handlers
const handlers: MessageHandlerFn[] = [];

/**
 * Registers a message handler
 */
export function registerHandler(handler: MessageHandlerFn) {
  handlers.push(handler);
}
