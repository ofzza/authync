import { DEBUGGING } from '../consts.js';
import { type Configuration } from '../config.js';
import { MessageType } from '../messaging.js';
import { type SyncExportRequest, type SyncImportRequest } from '../sync.js';
import { findDocumentUrlPatternConfiguration } from '../config.js';
import { getConfiguration, registerHandler as registerConfigurationHandler, updateDocumentUrlPatternConfig } from './config.js';
import { sendToTab } from './messaging.js';

export async function init() {
  const config = await getConfiguration();
  recreateContextMenus(config);
  registerContextMenuHandlers(config);
  registerConfigurationHandler(config => recreateContextMenus(config));
}

function recreateContextMenus(config: Configuration) {
  const documentUrlPatterns = Object.keys(config.documentUrlPatterns);
  chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: 'authync',
    title: 'authync',
    contexts: ['all'],
    documentUrlPatterns,
  });

  for (const documentUrlPattern of documentUrlPatterns) {
    const matched = findDocumentUrlPatternConfiguration(documentUrlPattern, config);

    if (!matched) continue;
    const [_, matchedConfig] = matched;

    chrome.contextMenus.create({
      parentId: 'authync',
      id: `authync-export-auto|${documentUrlPattern}`,
      title: 'Auto-Export auth session(s)',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'checkbox',
      checked: matchedConfig.sync.active && matchedConfig.sync.direction == 'export',
    });
    chrome.contextMenus.create({
      parentId: 'authync',
      id: `authync-import-auto|${documentUrlPattern}`,
      title: 'Auto-Import auth session(s)',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'checkbox',
      checked: matchedConfig.sync.active && matchedConfig.sync.direction == 'import',
    });
    chrome.contextMenus.create({
      parentId: 'authync',
      id: `authync-refresh-auto|${documentUrlPattern}`,
      title: 'Auto refresh when tab idle',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'checkbox',
      checked: matchedConfig.refresh.active,
    });

    chrome.contextMenus.create({
      parentId: 'authync',
      id: `authync-break|${documentUrlPattern}`,
      title: 'Import Auth session(s) NOW',
      type: 'separator',
      documentUrlPatterns: [documentUrlPattern],
    });

    chrome.contextMenus.create({
      parentId: 'authync',
      id: `authync-export-now|${documentUrlPattern}`,
      title: 'Export Auth session(s) NOW',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
    });
    chrome.contextMenus.create({
      parentId: 'authync',
      id: `authync-import-now|${documentUrlPattern}`,
      title: 'Import Auth session(s) NOW',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
    });
  }
}

function registerContextMenuHandlers(config: Configuration) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const [action, pattern] = (info.menuItemId as string).split('|');

    // Log: Menu item clicked
    if (DEBUGGING) console.log('BACKGROUND | context_menus.ts: Menu item clicked: ', action, pattern, info.checked);

    if (action === 'authync-export-auto') {
      const updatedConfig = config.documentUrlPatterns[pattern!];
      if (!updatedConfig) return;
      if (!!info.checked) {
        updatedConfig.sync.active = true;
        updatedConfig.sync.direction = 'export';
      } else {
        updatedConfig.sync.active = false;
        updatedConfig.sync.direction = undefined;
      }
      updateDocumentUrlPatternConfig(pattern!, updatedConfig);
    } else if (action === 'authync-import-auto') {
      const updatedConfig = config.documentUrlPatterns[pattern!];
      if (!updatedConfig) return;
      if (!!info.checked) {
        updatedConfig.sync.active = true;
        updatedConfig.sync.direction = 'import';
      } else {
        updatedConfig.sync.active = false;
        updatedConfig.sync.direction = undefined;
      }
      updateDocumentUrlPatternConfig(pattern!, updatedConfig);
    } else if (action === 'authync-refresh-auto') {
      const updatedConfig = config.documentUrlPatterns[pattern!];
      if (!updatedConfig) return;
      updatedConfig.refresh.active = !!info.checked;
      updateDocumentUrlPatternConfig(pattern!, updatedConfig);
    } else if (action === 'authync-export-now') {
      sendToTab(tab?.id!, { type: MessageType.SyncExportRequest, documentUrlPattern: pattern } as SyncExportRequest);
    } else if (action === 'authync-import-now') {
      sendToTab(tab?.id!, { type: MessageType.SyncImportRequest, documentUrlPattern: pattern } as SyncImportRequest);
    }
  });
}
