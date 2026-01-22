import { MessageType } from './messaging.js';

/**
 * SyncExportRequest message type
 */
export type SyncExportRequest = {
  type: MessageType.SyncExportRequest;
  documentUrlPattern: string;
};

/**
 * SyncImportRequest message type
 */
export type SyncImportRequest = {
  type: MessageType.SyncImportRequest;
  documentUrlPattern: string;
};
