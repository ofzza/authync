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
  sync: {
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
    gistId: '',
    gistToken: '',
  },
  documentUrlPatterns: {
    // Test
    'https://ofzza.com/*': {
      refresh: { active: false, interval: 5 * 60e3 },
      sync: { active: false, interval: 10 * 60e3, direction: undefined },
    },
    // Microsoft (GitHub)
    'https://github.com/*': {
      refresh: { active: false, interval: 5 * 60e3 },
      sync: { active: false, interval: 10 * 60e3, direction: undefined },
    },
    // Microsoft (Teams)
    'https://teams.cloud.microsoft/*': {
      refresh: { active: false, interval: 5 * 60e3 },
      sync: { active: false, interval: 10 * 60e3, direction: undefined },
    },
    'https://teams.microsoft.com/*': {
      refresh: { active: false, interval: 5 * 60e3 },
      sync: { active: false, interval: 10 * 60e3, direction: undefined },
    },
    // Attlasian
    'https://opswat.atlassian.net/*': {
      refresh: { active: false, interval: 5 * 60e3 },
      sync: { active: false, interval: 10 * 60e3, direction: undefined },
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
 * ConfigurationPartialEditRequestMessage message type
 */
export type ConfigurationEditRequestMessage = {
  type: MessageType.ConfigurationEditRequest;
  config: Configuration;
};

/**
 * ConfigurationPartialEditRequestMessage message type
 */
export type ConfigurationPartialEditRequestMessage = {
  type: MessageType.ConfigurationPartialEditRequest;
  documentUrlPattern: string;
  config: DocumentUrlPatternConfiguration;
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

/**
 * Gets configuration for a tab based off of its URL
 * @param url Tab URL to match against configuration document URL patterns
 * @returns Appropriate configuration if one is found
 */
export function findDocumentUrlPatternConfiguration(url: string, config: Configuration): [string, DocumentUrlPatternConfiguration] | undefined {
  for (const pattern of Object.keys(config.documentUrlPatterns)) {
    if (verifyUrlAgainstDocumentUrlPatterns(url, [pattern])) {
      return config.documentUrlPatterns[pattern] !== undefined ? [pattern, config.documentUrlPatterns[pattern]] : undefined;
    }
  }
}
