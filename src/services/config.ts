import { MessageType } from './messaging.js';

/**
 * Extension configuration type
 */
export type Configuration = {
  sync: {
    gistId: string;
    gistToken: string;
  };
  documentUrlPatterns: Record<string, DocumentUrlPatternConfiguration>;
};
/**
 * Extension per document URL pattern configuration
 */
export type DocumentUrlPatternConfiguration = {
  refresh: {
    active: boolean;
    interval: number;
  };
  sync:
    | {
        active: boolean;
        interval: number;
      } & (
        | {
            active: true;
            direction: 'export' | 'import';
          }
        | {
            active: false;
            direction: undefined;
          }
      );
};

/**
 * Default configuration value
 */
export const defaultConfiguration: Configuration = {
  sync: {
    gistId: '32a3e8282388a14272dc3a2c0450afd7',
    gistToken: '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',
  },
  documentUrlPatterns: {
    'https://teams.microsoft.com/v2/*': {
      refresh: { active: true, interval: 30 * 60 * 1000 },
      sync: { active: true, interval: 10 * 60 * 1000, direction: 'import' },
    },
  },
};

/**
 * ConfigurationRequest message type
 */
export type ConfigurationRequestMessage = {
  type: MessageType.ConfigurationRequest;
};

/**
 * ConfigurationUpdate message type
 */
export type ConfigurationUpdateMessage = {
  type: MessageType.ConfigurationUpdate;
  config: Configuration;
};

/**
 * Configuration update handler function type
 */
export type ConfigurationUpdateHandler = (config: Configuration) => void;

// Stores all configuration update handlers
const handlers: ConfigurationUpdateHandler[] = [];

/**
 * Registers configuration update handler
 */
export function registerHandler(handler: ConfigurationUpdateHandler) {
  handlers.push(handler);
}

/**
 * Triggers all registered configuration update handlers
 * @param config Updated configuration
 */
export function triggerHandlers(config: Configuration) {
  for (const handler of handlers) handler(config);
}

/**
 * Verifies if a URL matches any od the provided URL patterns
 * @param url URL to match
 * @param patterns URL patterns to match against
 * @returns If URL matches any od the provided URL patterns
 */
export function verifyUrlAgainstDocumentUrlPatterns(url: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (!!url.match(new RegExp(pattern.replace(/\*/g, '.*')))) {
      return true;
    }
  }
  return false;
}
