import { MessageType } from './messaging.js';

/**
 * CookiesExportRequest message type
 */
export type CookiesExportRequest = {
  type: MessageType.CookiesExportRequest;
  origins: string[];
  documentUrlPattern: string;
};

/**
 * CookiesImportRequest message type
 */
export type CookiesImportRequest = {
  type: MessageType.CookiesImportRequest;
  url: string;
  origins: string[];
  documentUrlPattern: string;
};
