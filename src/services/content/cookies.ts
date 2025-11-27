import { MessageType } from '../messaging.js';
import { type CookiesExportRequest, type CookiesImportRequest } from '../cookies.js';
import { send } from './messaging.js';

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
