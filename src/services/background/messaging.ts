import { DEBUGGING } from '../consts.js';
export * from '../messaging.js';
import { type Message } from '../messaging.js';

/**
 * Sends a message to a tab content script
 * @param tabId ID of the tab to send the message to
 * @param message Message to send
 * @returns A reply message from the tab's content script
 */
export async function sendToTab(tabId: number, message: Message): Promise<Message | undefined> {
  // Log: message received
  if (DEBUGGING) console.log('BACKGROUND | messaging.ts: Sending message to tab: ', tabId, message);
  // Send message and return reply
  const res = await chrome.tabs.sendMessage(tabId, message);
  // Log: response received
  if (DEBUGGING) console.log('BACKGROUND | messaging.ts: Response received: ', res);
  // Return response
  return res;
}
