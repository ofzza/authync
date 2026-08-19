import { DEBUGGING } from '../consts.js';
import { type Configuration } from '../config.js';
import { MessageType } from '../messaging.js';
import { type SyncExportRequest, type SyncImportRequest } from '../sync.js';
import { findDocumentUrlPatternConfiguration } from '../config.js';
import { getConfiguration, registerHandler as registerConfigurationHandler, updateDocumentUrlPatternConfig } from './config.js';
import { sendToTab } from './messaging.js';
import type { PreventNavigationMessage } from '../navigation.js';

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
      id: `authync-prevent-navigation|${documentUrlPattern}`,
      title: 'Prevent page navigation',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'normal',
    });

    chrome.contextMenus.create({
      parentId: 'authync',
      id: `authync-auto|${documentUrlPattern}`,
      title: 'Automate authync for this domain',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'normal',
    });
    chrome.contextMenus.create({
      parentId: `authync-auto|${documentUrlPattern}`,
      id: `authync-export-auto|${documentUrlPattern}`,
      title: 'Auto-Export auth session(s)',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'checkbox',
      checked: matchedConfig.sync.active && matchedConfig.sync.direction == 'export',
    });
    chrome.contextMenus.create({
      parentId: `authync-auto|${documentUrlPattern}`,
      id: `authync-import-auto|${documentUrlPattern}`,
      title: 'Auto-Import auth session(s)',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'checkbox',
      checked: matchedConfig.sync.active && matchedConfig.sync.direction == 'import',
    });
    chrome.contextMenus.create({
      parentId: `authync-auto|${documentUrlPattern}`,
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
      documentUrlPatterns: [documentUrlPattern],
      type: 'separator',
    });

    chrome.contextMenus.create({
      parentId: 'authync',
      id: `authync-export|${documentUrlPattern}`,
      title: 'Manual export',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'normal',
    });
    chrome.contextMenus.create({
      parentId: `authync-export|${documentUrlPattern}`,
      id: `authync-export-all|${documentUrlPattern}`,
      title: 'Export All',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'normal',
    });
    chrome.contextMenus.create({
      parentId: `authync-export|${documentUrlPattern}`,
      id: `authync-export-cookies|${documentUrlPattern}`,
      title: 'Export Cookies',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'normal',
    });
    chrome.contextMenus.create({
      parentId: `authync-export|${documentUrlPattern}`,
      id: `authync-export-local-storage|${documentUrlPattern}`,
      title: 'Export Local Storage',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'normal',
    });

    chrome.contextMenus.create({
      parentId: 'authync',
      id: `authync-import|${documentUrlPattern}`,
      title: 'Manual import',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'normal',
    });
    chrome.contextMenus.create({
      parentId: `authync-import|${documentUrlPattern}`,
      id: `authync-import-all|${documentUrlPattern}`,
      title: 'Import All',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'normal',
    });
    chrome.contextMenus.create({
      parentId: `authync-import|${documentUrlPattern}`,
      id: `authync-import-cookies|${documentUrlPattern}`,
      title: 'Import Cookies',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'normal',
    });
    chrome.contextMenus.create({
      parentId: `authync-import|${documentUrlPattern}`,
      id: `authync-import-local-storage|${documentUrlPattern}`,
      title: 'Import Local Storage',
      contexts: ['all'],
      documentUrlPatterns: [documentUrlPattern],
      type: 'normal',
    });
  }
}

function registerContextMenuHandlers(config: Configuration) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const [action, pattern] = (info.menuItemId as string).split('|');

    // Log: Menu item clicked
    if (DEBUGGING) console.log('BACKGROUND | context_menus.ts: Menu item clicked: ', action, pattern, info.checked);

    if (action === 'authync-prevent-navigation') {
      sendToTab(tab?.id!, { type: MessageType.PreventNavigation } as PreventNavigationMessage);
    } else if (action === 'authync-export-auto') {
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
    } else if (action === 'authync-export-all') {
      sendToTab(tab?.id!, { type: MessageType.SyncExportRequest, documentUrlPattern: pattern, targets: ['cookies', 'localStorage'] } as SyncExportRequest);
    } else if (action === 'authync-export-cookies') {
      sendToTab(tab?.id!, { type: MessageType.SyncExportRequest, documentUrlPattern: pattern, targets: ['cookies'] } as SyncExportRequest);
    } else if (action === 'authync-export-local-storage') {
      sendToTab(tab?.id!, { type: MessageType.SyncExportRequest, documentUrlPattern: pattern, targets: ['localStorage'] } as SyncExportRequest);
    } else if (action === 'authync-import-all') {
      sendToTab(tab?.id!, { type: MessageType.SyncImportRequest, documentUrlPattern: pattern, targets: ['cookies', 'localStorage'] } as SyncImportRequest);
    } else if (action === 'authync-import-cookies') {
      sendToTab(tab?.id!, { type: MessageType.SyncImportRequest, documentUrlPattern: pattern, targets: ['cookies'] } as SyncImportRequest);
    } else if (action === 'authync-import-local-storage') {
      sendToTab(tab?.id!, { type: MessageType.SyncImportRequest, documentUrlPattern: pattern, targets: ['localStorage'] } as SyncImportRequest);
    }
  });
}
