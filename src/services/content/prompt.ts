import { DEBUGGING } from '../consts.js';

/**
 * Displays a toast to the user
 * @param type Type of toast
 * @param message Message to display
 */
export function toast(type: 'info' | 'warning' | 'error', message: string) {
  alert(`${type.toUpperCase()}: ${message}`);
}
