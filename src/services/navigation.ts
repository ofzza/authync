import type { MessageType } from './messaging';

/**
 * Prevent navigation message type
 */
export type PreventNavigationMessage = {
  type: MessageType.PreventNavigation;
};
