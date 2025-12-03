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
 * CookiesExportResponse message type
 */
export type CookiesExportResponse = {
  type: MessageType.CookiesExportResponse;
  success: boolean;
  count: number;
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

/**
 * CookiesImportResponse message type
 */
export type CookiesImportResponse = {
  type: MessageType.CookiesImportResponse;
  success: boolean;
  count: number;
};
