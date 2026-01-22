/**
 * Holds reference to a container for showing toasts
 */
let toastsContainerEl: HTMLDivElement | undefined = undefined;

/**
 * Displays a toast to the user
 * @param type Type of toast
 * @param message Message to display
 */
export function toast(type: 'info' | 'warning' | 'error', message: string) {
  // Log
  console.log(`CONTENT | prompt.ts: ${type.toUpperCase()} - ${message}`);

  // Add toast container if not present
  if (!toastsContainerEl) {
    toastsContainerEl = document.createElement('div');
    toastsContainerEl.style.position = 'fixed';
    toastsContainerEl.style.bottom = '24px';
    toastsContainerEl.style.right = '24px';
    toastsContainerEl.style.pointerEvents = 'none';
    toastsContainerEl.style.display = 'flex';
    toastsContainerEl.style.flexDirection = 'column';
    document.body.append(toastsContainerEl);
  }

  // Add prompt/toast element
  const el = document.createElement('div');
  el.style.zIndex = '2147483647';
  el.style.display = 'flex';
  el.style.borderRadius = '0';
  el.style.margin = '4px';
  el.style.padding = '8px';
  el.style.boxShadow = '0px 1px 2px 2px rgba(230, 230, 230, 0.2)';
  el.style.background = 'rgba(128, 128, 128, 0.4)';
  el.style.justifyContent = 'start';
  el.style.alignContent = 'center';
  el.style.fontFamily = 'monospace';
  el.style.fontSize = '13px';
  el.style.fontWeight = 'bold';
  el.style.color = 'white';
  el.innerText = `${type.toUpperCase()}: ${message}`;
  toastsContainerEl.append(el);

  // Handle prompt/toast removal
  setTimeout(() => el.remove(), 10e3);
}
