import { DEBUGGING } from '../consts.js';
export * from '../messaging.js';
import { type Message } from '../messaging.js';

/**
 * Sends a message to the extension background script
 * @param message Message to send
 * @returns A reply message from the background script
 */
export async function send(message: Message): Promise<Message | undefined> {
  // Log: message received
  if (DEBUGGING) console.log('CONTENT | messaging.ts: Sending message: ', message);
  // Send message and return reply
  const res = await chrome.runtime.sendMessage(message);
  // Log: response received
  if (DEBUGGING) console.log('CONTENT | messaging.ts: Response received: ', res);
  // Return response
  return res;
}
