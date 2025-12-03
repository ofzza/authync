import { DEBUGGING } from '../consts.js';
import { send, registerHandler as registerMessageHandler, type Message, MessageType } from './messaging.js';
import { type CookiesExportRequest, type CookiesExportResponse, type CookiesImportRequest, type CookiesImportResponse } from '../cookies.js';
import { toast } from './prompt.js';

/**
 * Initializes content configuration service
 */
export async function init() {
  // Handle cookie updates
  registerMessageHandler(async (message: Message, sender: chrome.runtime.MessageSender) => {
    if (message.type === MessageType.CookiesExportResponse) {
      // Log: update received
      if (DEBUGGING) console.log('CONTENT | config.ts: Received Cookie export update: ', message, sender);
      // Prompt
      const msg = message as CookiesExportResponse;
      if (msg.success) {
        toast('info', `Exported ${msg.count} cookies`);
      } else {
        toast('warning', `Failed exporting cookies!`);
      }
    }
    if (message.type === MessageType.CookiesImportResponse) {
      // Log: update received
      if (DEBUGGING) console.log('CONTENT | config.ts: Received Cookie import update: ', message, sender);
      // Prompt
      const msg = message as CookiesImportResponse;
      if (msg.success) {
        toast('info', `Imported ${msg.count} cookies`);
      } else {
        toast('warning', `Failed importing cookies!`);
      }
    }
  });
}

/**
 * Sends a request to the background service, requesting export of cookies for the current tab's domain
 * @param domain Current tab's domain
 */
export async function exportAllCookies(documentUrlPattern: string) {
  const msg: CookiesExportRequest = { type: MessageType.CookiesExportRequest, origins: await detectResourceOrigins(), documentUrlPattern };
  await send(msg);
}

/**
 * Sends a request to the background service, requesting import of cookies for the current tab's domain
 * @param domain Current tab's domain
 */
export async function importAllCookies(url: string, documentUrlPattern: string) {
  const msg: CookiesImportRequest = { type: MessageType.CookiesImportRequest, origins: await detectResourceOrigins(), url, documentUrlPattern };
  await send(msg);
}

async function detectResourceOrigins(): Promise<string[]> {
  const originsSet = new Set([
    window.location.toString(),
    ...performance
      .getEntriesByType('resource')
      .filter(r => !!r.name)
      .map(r => new URL(r.name).origin),
  ]);
  return Array.from(originsSet);
}
