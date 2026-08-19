import { MessageType } from './messaging.js';

/**
 * SyncTargets targets type
 */
export type SyncTargets = 'cookies' | 'localStorage';

/**
 * SyncExportRequest message type
 */
export type SyncExportRequest = {
  type: MessageType.SyncExportRequest;
  documentUrlPattern: string;
  targets: SyncTargets[];
};

/**
 * SyncImportRequest message type
 */
export type SyncImportRequest = {
  type: MessageType.SyncImportRequest;
  documentUrlPattern: string;
  targets: SyncTargets[];
};
