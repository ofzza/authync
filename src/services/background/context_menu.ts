import { getConfiguration } from './config.js';

export async function init() {
  const config = await getConfiguration();
  const documentUrlPatterns = Object.keys(config.documentUrlPatterns);

  chrome.contextMenus.create({
    id: 'authync',
    title: 'authync',
    contexts: ['all'],
    documentUrlPatterns,
  });
  chrome.contextMenus.create({
    parentId: 'authync',
    id: 'authync-refresh',
    title: 'Auto refresh when tab idle',
    contexts: ['all'],
    documentUrlPatterns,
    type: 'checkbox',
    checked: true,
  });
  chrome.contextMenus.create({
    parentId: 'authync',
    id: 'authync-sync-export',
    title: 'Export auth session(s)',
    contexts: ['all'],
    documentUrlPatterns,
    type: 'checkbox',
    checked: true,
  });
  chrome.contextMenus.create({
    parentId: 'authync',
    id: 'authync-sync-import',
    title: 'Import auth session(s)',
    contexts: ['all'],
    documentUrlPatterns,
    type: 'checkbox',
    checked: false,
  });
}
