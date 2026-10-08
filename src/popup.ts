import { MessageType } from './services/messaging.js';
import {
  defaultConfiguration,
  createDefaultDocumentUrlPatternConfiguration,
  DEFAULT_REFRESH_INTERVAL,
  DEFAULT_SYNC_INTERVAL,
  type Configuration,
  type DocumentUrlPatternConfiguration,
  type ConfigurationEditRequestMessage,
} from './services/config.js';

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
 * Converts a millisecond interval into whole minutes (for display in the popup)
 * @param ms Interval in milliseconds
 * @returns Interval in minutes
 */
function msToMinutes(ms: number): number {
  return Math.max(1, Math.round(ms / 60e3));
}

/**
 * Converts a minutes value (as edited in the popup) into a millisecond interval,
 * falling back to a default when the value is missing or invalid
 * @param value Raw input value (minutes)
 * @param fallbackMs Default interval (in milliseconds) to use when the value is invalid
 * @returns Interval in milliseconds
 */
function minutesToMs(value: string, fallbackMs: number): number {
  const minutes = Number.parseFloat(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return fallbackMs;
  return Math.round(minutes * 60e3);
}

// Holds references to the popup's pattern list DOM
let patternsContainer: HTMLDivElement;
let rowTemplate: HTMLTemplateElement;

/**
 * Keeps a pattern row's controls in sync with the sync-active checkbox state
 * (disabling the direction/interval controls when auto-sync is off)
 * @param row Pattern row element
 */
function updateRowSyncState(row: HTMLElement) {
  const syncActive = row.querySelector<HTMLInputElement>('.popup__pattern-sync-active')!;
  const direction = row.querySelector<HTMLSelectElement>('.popup__pattern-sync-direction')!;
  const interval = row.querySelector<HTMLInputElement>('.popup__pattern-sync-interval')!;
  direction.disabled = !syncActive.checked;
  interval.disabled = !syncActive.checked;
}

/**
 * Keeps a pattern row's refresh interval control in sync with the refresh-active checkbox state
 * @param row Pattern row element
 */
function updateRowRefreshState(row: HTMLElement) {
  const refreshActive = row.querySelector<HTMLInputElement>('.popup__pattern-refresh-active')!;
  const interval = row.querySelector<HTMLInputElement>('.popup__pattern-refresh-interval')!;
  interval.disabled = !refreshActive.checked;
}

/**
 * Builds and appends a single editable pattern row to the list
 * @param pattern URL pattern string
 * @param config Per document URL pattern configuration for the pattern
 */
function addPatternRow(pattern: string, config: DocumentUrlPatternConfiguration) {
  const fragment = rowTemplate.content.cloneNode(true) as DocumentFragment;
  const row = fragment.querySelector('.popup__pattern') as HTMLElement;

  const url = row.querySelector<HTMLInputElement>('.popup__pattern-url')!;
  const refreshActive = row.querySelector<HTMLInputElement>('.popup__pattern-refresh-active')!;
  const refreshInterval = row.querySelector<HTMLInputElement>('.popup__pattern-refresh-interval')!;
  const syncActive = row.querySelector<HTMLInputElement>('.popup__pattern-sync-active')!;
  const syncDirection = row.querySelector<HTMLSelectElement>('.popup__pattern-sync-direction')!;
  const syncInterval = row.querySelector<HTMLInputElement>('.popup__pattern-sync-interval')!;
  const remove = row.querySelector<HTMLButtonElement>('.popup__remove')!;

  // Populate the row from the provided configuration
  url.value = pattern;
  refreshActive.checked = config.refresh.active;
  refreshInterval.value = String(msToMinutes(config.refresh.interval));
  syncActive.checked = config.sync.active;
  syncDirection.value = config.sync.direction ?? 'export';
  syncInterval.value = String(msToMinutes(config.sync.interval));

  // Wire up enable/disable of dependent controls
  refreshActive.addEventListener('change', () => updateRowRefreshState(row));
  syncActive.addEventListener('change', () => updateRowSyncState(row));
  remove.addEventListener('click', () => row.remove());

  updateRowRefreshState(row);
  updateRowSyncState(row);

  patternsContainer.appendChild(row);
}

/**
 * Renders the given document URL patterns as editable rows, replacing any existing rows
 * @param documentUrlPatterns Map of URL pattern to per-pattern configuration
 */
function renderPatterns(documentUrlPatterns: Configuration['documentUrlPatterns']) {
  patternsContainer.replaceChildren();
  for (const [pattern, config] of Object.entries(documentUrlPatterns)) {
    addPatternRow(pattern, config ?? createDefaultDocumentUrlPatternConfiguration());
  }
}

/**
 * Reads the current pattern rows back into a document URL patterns map
 * @returns The collected patterns map, or an error describing why collection failed
 */
function collectPatterns(): { patterns: Configuration['documentUrlPatterns'] } | { error: string } {
  const patterns: Configuration['documentUrlPatterns'] = {};
  const rows = Array.from(patternsContainer.querySelectorAll('.popup__pattern')) as HTMLElement[];

  for (const row of rows) {
    const pattern = row.querySelector<HTMLInputElement>('.popup__pattern-url')!.value.trim();
    // Skip blank rows entirely
    if (!pattern) continue;
    // Reject duplicate patterns
    if (patterns[pattern]) return { error: `Duplicate pattern: ${pattern}` };

    const refreshActive = row.querySelector<HTMLInputElement>('.popup__pattern-refresh-active')!.checked;
    const refreshInterval = minutesToMs(row.querySelector<HTMLInputElement>('.popup__pattern-refresh-interval')!.value, DEFAULT_REFRESH_INTERVAL);
    const syncActive = row.querySelector<HTMLInputElement>('.popup__pattern-sync-active')!.checked;
    const syncDirection = row.querySelector<HTMLSelectElement>('.popup__pattern-sync-direction')!.value as 'export' | 'import';
    const syncInterval = minutesToMs(row.querySelector<HTMLInputElement>('.popup__pattern-sync-interval')!.value, DEFAULT_SYNC_INTERVAL);

    patterns[pattern] = {
      refresh: { active: refreshActive, interval: refreshInterval },
      sync: syncActive
        ? { active: true, interval: syncInterval, direction: syncDirection }
        : { active: false, interval: syncInterval, direction: undefined },
    };
  }

  return { patterns };
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
  const addButton = document.getElementById('add-pattern') as HTMLButtonElement | null;
  const resetButton = document.getElementById('reset-patterns') as HTMLButtonElement | null;
  patternsContainer = document.getElementById('patterns') as HTMLDivElement;
  rowTemplate = document.getElementById('pattern-row-template') as HTMLTemplateElement;
  if (!input || !tokenInput || !toggleButton || !saveButton || !status || !addButton || !resetButton || !patternsContainer || !rowTemplate) return;

  /**
   * Displays a status message in the popup
   * @param text Message text
   * @param isError Whether the message represents an error
   */
  function setStatus(text: string, isError = false) {
    status!.textContent = text;
    status!.classList.toggle('popup__status--error', isError);
  }

  // Load current configuration and display the stored Gist ID, auth token and URL patterns
  let config = await loadConfiguration();
  input.value = config.sync.gistId ?? '';
  tokenInput.value = config.sync.gistToken ?? '';
  renderPatterns(config.documentUrlPatterns ?? {});

  // Toggle token visibility
  toggleButton.addEventListener('click', () => {
    const revealed = tokenInput.type === 'text';
    tokenInput.type = revealed ? 'password' : 'text';
    toggleButton.textContent = revealed ? 'Show' : 'Hide';
    toggleButton.setAttribute('aria-pressed', String(!revealed));
    toggleButton.setAttribute('aria-label', revealed ? 'Show token' : 'Hide token');
  });

  // Add a new, empty pattern row using default per-pattern settings
  addButton.addEventListener('click', () => {
    addPatternRow('', createDefaultDocumentUrlPatternConfiguration());
    setStatus('');
  });

  // Reset the pattern list to the built-in defaults (applied on Save)
  resetButton.addEventListener('click', () => {
    renderPatterns(structuredClone(defaultConfiguration).documentUrlPatterns);
    setStatus('Defaults restored — press Save to apply');
  });

  // Persist the Gist ID, auth token and URL patterns on save
  saveButton.addEventListener('click', async () => {
    setStatus('');

    // Collect and validate the edited URL patterns
    const collected = collectPatterns();
    if ('error' in collected) {
      setStatus(collected.error, true);
      return;
    }

    saveButton.disabled = true;

    // Assemble the full updated configuration
    config = {
      ...config,
      sync: { ...config.sync, gistId: input.value.trim(), gistToken: tokenInput.value.trim() },
      documentUrlPatterns: collected.patterns,
    };

    // Send the updated configuration to the background, which persists it and re-broadcasts it
    const message: ConfigurationEditRequestMessage = { type: MessageType.ConfigurationEditRequest, config };
    try {
      await chrome.runtime.sendMessage(message);
      setStatus('Saved');
    } catch {
      setStatus('Failed to save', true);
    } finally {
      saveButton.disabled = false;
    }
  });
}

init();
