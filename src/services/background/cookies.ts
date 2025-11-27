import { DEBUGGING } from '../consts.js';
import { type Message, MessageType, registerHandler as registerMessageHandler } from '../messaging.js';
import { writeToGist, readFromGist } from '../gist.js';
import { type CookiesExportRequest, type CookiesImportRequest } from '../cookies.js';

/**
 * Initializes background cookies service
 */
export async function init() {
  // Handle configuration requests
  registerMessageHandler((message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: Message) => void) => {
    if (message.type === MessageType.CookiesExportRequest) {
      // Log: request received
      if (DEBUGGING) console.log('BACKGROUND | cookies.ts: Received CookiesExportRequest: ', message, sender);
      // export cookies
      const origins = (message as CookiesExportRequest).origins;
      const documentUrlPattern = (message as CookiesExportRequest).documentUrlPattern;
      exportCookiesToGist(origins, documentUrlPattern);
    } else if (message.type === MessageType.CookiesImportRequest) {
      // Log: request received
      if (DEBUGGING) console.log('BACKGROUND | cookies.ts: Received CookiesImportRequest: ', message, sender);
      // export cookies
      const documentUrlPattern = (message as CookiesImportRequest).documentUrlPattern;
      importCookiesFromGist(documentUrlPattern);
    }
  });
}

/**
 * Collects all cookies for a domain and exports them to Gist
 */
async function exportCookiesToGist(origins: string[], documentUrlPattern: string) {
  // Get cookies for the requested domain
  const cookies: any[] = [];
  for (const origin of origins) cookies.push(...(await chrome.cookies.getAll({ domain: new URL(origin).host })));
  // Log: writing cookies
  if (DEBUGGING) console.log('BACKGROUND | cookies.ts: Writing cookies for requested domain to Gist: ', documentUrlPattern, cookies);
  // Export to gist
  writeToGist(`${btoa(documentUrlPattern)}_cookies`, cookies);
}

/**
 * Reads cookies from Gist and sets them for a requested domain
 */
async function importCookiesFromGist(documentUrlPattern: string) {
  // Get cookies from Gist for the requested domain
  const cookies = await readFromGist(`${btoa(documentUrlPattern)}_cookies`);
  // Log: reading cookies
  if (DEBUGGING) console.log('BACKGROUND | cookies.ts: Reading and updating cookies for requested domain from Gist: ', documentUrlPattern, cookies);

  // Import cookies
  for (const cookie of cookies) {
    const url = `https://${(cookie.domain as string).startsWith('.') ? (cookie.domain as string).substring(1) : cookie.domain}${cookie.path}`;
    try {
      const updated = await chrome.cookies.set({
        url,
        name: `${cookie.name}`,
        value: cookie.value,
        domain: cookie.hostOnly ? undefined : cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        // sameSite: cookie.sameSite,
        expirationDate: cookie.expirationDate,
      });
      if (updated) {
        // Log: succeeded writing cookie
        if (DEBUGGING) console.log('BACKGROUND | cookies.ts: Updated cookie: ', url, cookie);
      } else {
        // Log: failed writing cookie
        if (DEBUGGING) console.warn('BACKGROUND | cookies.ts: Failed while updating cookie: ', url, cookie);
      }
    } catch (err) {
      // Log: failed writing cookie
      if (DEBUGGING) console.warn('BACKGROUND | cookies.ts: Error while updating cookie: ', url, cookie, err);
    }
  }
}
