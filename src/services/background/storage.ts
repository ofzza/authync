/**
 * Writes to extension local storage
 * @param key Key identifying stored data
 * @param value Stored data
 */
export async function set(key: string, value: unknown) {
  await chrome.storage.local.set({ [key]: JSON.stringify(value) });
}

/**
 * Reads from extension local storage
 * @param key
 * @returns
 */
export async function get<T extends unknown>(key: string): Promise<T | undefined> {
  try {
    const storage = await chrome.storage.local.get<{ [key]: string }>([key]);
    return JSON.parse(storage[key] as string) as T;
  } catch {
    return undefined;
  }
}
