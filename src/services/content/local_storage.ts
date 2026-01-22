import { DEBUGGING } from '../consts.js';

/**
 * Gets all keys and values out of local storage
 * @returns All keys and values out of local storage
 */
export async function getAllLocalStorage() {
  // Collect all keys and values from local storage
  const localStorage: Record<string, string> = {};
  for (let i = 0; true; i++) {
    const key = window.localStorage.key(i);
    if (key === null) break;
    const value = window.localStorage.getItem(key);
    if (value) localStorage[key] = value;
  }
  return localStorage;
}

/**
 * Sets all keys and values to local storage
 * @param local Keys and values to set
 */
export async function setAllLocalStorage(local: Record<string, string>) {
  if (local)
    for (const key of Object.keys(local)) {
      try {
        window.localStorage.setItem(key, local[key]!);
        // Log: succeeded writing cookie
        if (DEBUGGING) console.log('BACKGROUND | local_storage.ts: Writing local storage: ', key);
      } catch {
        // Log: failed writing cookie
        if (DEBUGGING) console.warn('BACKGROUND | local_storage.ts: Failed writing local storage: ', key);
      }
    }
}
