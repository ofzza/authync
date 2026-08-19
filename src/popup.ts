import { MessageType } from './services/messaging.js';
import { defaultConfiguration, type Configuration, type ConfigurationEditRequestMessage } from './services/config.js';

/**
 * Reads the persisted configuration from local storage, falling back to the default configuration
 * @returns Currently persisted (or default) configuration
 */
async function loadConfiguration(): Promise<Configuration> {
  try {
    const stored = (await chrome.storage.local.get(['configuration']))['configuration'];
    if (stored) return JSON.parse(stored as string) as Configuration;
  } catch {
    // Ignore malformed storage and fall through to the default configuration
  }
  return structuredClone(defaultConfiguration);
}

/**
 * Initializes the configuration popup
 */
async function init() {
  const input = document.getElementById('gist-id') as HTMLInputElement | null;
  const tokenInput = document.getElementById('gist-token') as HTMLInputElement | null;
  const toggleButton = document.getElementById('toggle-token') as HTMLButtonElement | null;
  const saveButton = document.getElementById('save') as HTMLButtonElement | null;
  const status = document.getElementById('status') as HTMLParagraphElement | null;
  if (!input || !tokenInput || !toggleButton || !saveButton || !status) return;

  // Load current configuration and display the stored Gist ID and auth token
  let config = await loadConfiguration();
  input.value = config.sync.gistId ?? '';
  tokenInput.value = config.sync.gistToken ?? '';

  // Toggle token visibility
  toggleButton.addEventListener('click', () => {
    const revealed = tokenInput.type === 'text';
    tokenInput.type = revealed ? 'password' : 'text';
    toggleButton.textContent = revealed ? 'Show' : 'Hide';
    toggleButton.setAttribute('aria-pressed', String(!revealed));
    toggleButton.setAttribute('aria-label', revealed ? 'Show token' : 'Hide token');
  });

  // Persist the Gist ID and auth token on save
  saveButton.addEventListener('click', async () => {
    saveButton.disabled = true;
    status.textContent = '';

    // Update the Gist ID and auth token on the current configuration
    config = { ...config, sync: { ...config.sync, gistId: input.value.trim(), gistToken: tokenInput.value.trim() } };

    // Send the updated configuration to the background, which persists it and re-broadcasts it
    const message: ConfigurationEditRequestMessage = { type: MessageType.ConfigurationEditRequest, config };
    try {
      await chrome.runtime.sendMessage(message);
      status.textContent = 'Saved';
    } catch {
      status.textContent = 'Failed to save';
    } finally {
      saveButton.disabled = false;
    }
  });
}

init();
