<p align="center">
  <img src="src/res/logo-128.png" alt="authync logo" width="96" height="96" />
</p>

<h1 align="center">authync</h1>

<p align="center">
  Carry your logged-in web sessions between your own browsers by syncing cookies and <code>localStorage</code> through a private GitHub Gist.
</p>

---

## Why

You're signed in to a web app in one browser, perhaps on another machine, and you want the same session in a different browser you also use. Signing in again isn't always practical: SSO flows, device checks or short-lived sessions can get in the way.

**authync** is a small Chromium extension that exports a site's session state (cookies and `localStorage`) from one browser to a GitHub Gist and imports it into another. It can do this on demand or automatically on a schedule.

## Disclaimer & security

> ⚠️ **Read this before using the extension.**

- **Cookies are credentials.** The exported data includes session cookies, `httpOnly` cookies among them. Anyone who can read your Gist, or who has your token, can take over those sessions.
- **A secret Gist is unlisted, not encrypted.** Data is only gzipped and base64-encoded before upload. Treat the Gist like a password vault that has no lock.
- **The GitHub token is stored in plain text** in the extension's `chrome.storage.local`. Use a token limited to the `gist` scope and nothing else.
- **Respect the rules that apply to you.** Moving sessions between devices may violate your organization's security policies or a service's terms of use. Use authync only with your own accounts, at your own risk. The author takes no responsibility for misuse or for any consequences.
- Setting the `DEBUGGING` flag to `true` (see [Development](#development)) logs cookie data to the browser console.

## Features

- **Gist-backed sync:** cookies and `localStorage` are serialized, gzipped and stored in a GitHub Gist of your choice. Large payloads are split across several files automatically.
- **Cross-origin cookie capture:** on export, authync collects cookies for every origin the page loaded resources from, not only the page's own domain. This captures auth cookies set on API or identity subdomains as well.
- **Per-site configuration:** you choose which pages authync acts on with URL patterns (`https://example.com/*`), each with its own settings:
  - **Auto-sync:** periodically **export** (source browser) or **import** (target browser).
  - **Auto-refresh when idle:** reloads the tab after a period with no mouse or keyboard activity, to keep sessions from expiring.
- **Context menu** on matching pages for one-off actions: manual export and import (all, cookies only, or `localStorage` only), toggles for automation, and *Prevent page navigation*.
- **Settings popup** for the Gist ID and token and for managing URL patterns.
- **In-page toasts** that report what was exported or imported.

<!-- TODO: screenshot of popup + context menu -->

## How it works

```
 Browser A (exporter)                    GitHub Gist                     Browser B (importer)
┌──────────────────────┐            ┌──────────────────┐            ┌──────────────────────┐
│ page matches pattern │   export   │ <id>_COOKIES     │   import   │ page matches pattern │
│  ├ cookies (all      │ ─────────► │ <id>_COOKIES-0…  │ ─────────► │  ├ chrome.cookies.set│
│  │  resource origins)│  gzip +    │ <id>_LOCALSTORAGE│  decode +  │  └ localStorage.set  │
│  └ localStorage      │  base64    │ <id>_LOCALST…-0… │  gunzip    │                      │
└──────────────────────┘            └──────────────────┘            └──────────────────────┘
```

- `<id>` is the **base64-encoded URL pattern**. The exporting and importing browsers must therefore use **exactly the same pattern string** for a site.
- Each export writes a small index file (`<id>_COOKIES` / `<id>_LOCALSTORAGE`) with metadata and the number of sections. The payload itself goes into numbered chunk files (`-00000`, `-00001`, …) of up to 512 KB each, which keeps GitHub from truncating it.
- Cookies are read and written by the extension's background service worker through the `chrome.cookies` API. `localStorage` is read and written by the content script inside the page.

## Requirements

- A Chromium-based browser: tested on **Google Chrome**, **Microsoft Edge** and other Chromium browsers. Firefox is not supported.
- [Node.js](https://nodejs.org/) and npm (to build the extension)
- A GitHub account (for the Gist)

## Installation

authync isn't published to an extension store. You build it and load it unpacked:

```sh
git clone https://github.com/ofzza/authync.git
cd authync
npm install
npm run build
```

Then:

1. Open `chrome://extensions` (or `edge://extensions`, etc.).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the `dist/` folder.

Repeat this in every browser you want to sync between.

## Setup

1. **Create a secret Gist** at <https://gist.github.com>. Its content doesn't matter (a placeholder file is fine). Copy the Gist ID from the URL: `https://gist.github.com/<user>/<GIST_ID>`.
2. **Create a GitHub token** with access to Gists only. Either:
   - a [classic personal access token](https://github.com/settings/tokens) with only the `gist` scope, or
   - a [fine-grained token](https://github.com/settings/personal-access-tokens) with **Gists: Read and write** account permission.
3. **Open the authync popup** (toolbar icon), paste the **Gist ID** and **token**, add the **URL patterns** for the sites you want to sync, and click **Save**.

Use the same Gist ID, token and URL patterns in each browser.

## Usage

### Manual sync

On a page matching one of your patterns, right-click and open the **authync** menu:

| Menu item | What it does |
| --- | --- |
| **Manual export** → Export All / Cookies / Local Storage | Uploads the current session state to the Gist |
| **Manual import** → Import All / Cookies / Local Storage | Downloads the session state from the Gist and applies it |
| **Automate authync for this domain** → Auto-Export / Auto-Import / Auto refresh when tab idle | Toggles automation for the matching pattern |
| **Prevent page navigation** | Makes the browser ask for confirmation before the tab navigates away or reloads (useful to stop a page from logging itself out or redirecting while you export) |

Typical flow:

1. In the browser where you're **already signed in**, use **Manual export → Export All**.
2. In the other browser, open the same site and use **Manual import → Import All**.
3. **Reload the page** in the importing browser to pick up the imported session.

### Automatic sync

Set up a pattern for **Auto-sync → Export** in the source browser and **Auto-sync → Import** in the target browser, either in the popup or through the context menu. As long as a matching tab is open, authync syncs on the configured interval and once immediately when the tab loads.

Turn on **Auto-refresh when idle** in the importing browser if you want tabs to reload, and so pick up fresh state, after a period of inactivity.

## Configuration reference

All configuration lives in the popup and is stored in `chrome.storage.local`.

| Setting | Scope | Default | Description |
| --- | --- | --- | --- |
| Gist ID | global | — | ID of the Gist used for storage |
| Gist auth token | global | — | GitHub token with Gist read/write access |
| URL pattern | per pattern | — | Pages the extension acts on. `*` is a wildcard, e.g. `https://example.com/*` |
| Auto-refresh when idle | per pattern | off, 5 min | Reload the tab after N minutes with no mouse or keyboard activity |
| Auto-sync | per pattern | off, 10 min | Periodically **export** or **import** session state every N minutes |

The popup's **Reset to defaults** button restores the built-in example patterns. Changes apply only after you click **Save**.

## Development

```sh
npm install
npm run watch   # copies static resources, then runs tsc in watch mode
```

After each rebuild, click the reload icon for the extension in `chrome://extensions`. Content scripts only reload when the page is refreshed.

Set `DEBUGGING` in [`src/services/consts.ts`](src/services/consts.ts) to `true` for verbose logging in the service worker and page consoles. **This logs cookie values**, so don't leave it on.

Code is formatted with [Prettier](https://prettier.io/) (see `.prettierrc`).

### Project layout

```
src/
├── manifest.json            # MV3 manifest
├── load-background.js       # service worker entry → BACKGROUND.js
├── load-content.js          # content script entry → dynamically imports CONTENT.js as an ES module
├── BACKGROUND.ts            # initializes background services
├── CONTENT.ts               # initializes content services and features
├── popup.{html,css,ts}      # settings popup
├── features/                # content-side features
│   ├── refresh.ts           #   auto-refresh on idle
│   ├── sync_export.ts       #   manual/auto export
│   └── sync_import.ts       #   manual/auto import
├── services/
│   ├── config.ts            # configuration types, defaults, URL pattern matching
│   ├── gist.ts              # Gist read/write, compression, chunking
│   ├── messaging.ts         # message types and router
│   ├── background/          # service worker: config persistence, cookies, context menu
│   └── content/             # page side: config, localStorage, toasts, navigation, origin detection
└── res/                     # icons
```

The background service worker and the content scripts communicate through `chrome.runtime` messages (see `MessageType` in `services/messaging.ts`). The background owns and persists the configuration and broadcasts updates to every tab that has requested it.

## Limitations

- Chromium browsers only.
- No end-to-end encryption of synced data (see [Disclaimer & security](#disclaimer--security)).
- The cookies' `SameSite` attribute is not restored on import.
- `sessionStorage` and IndexedDB are not synced, so sites that keep auth tokens there won't transfer.
- Sessions bound to a device or IP address (token binding, device fingerprinting and similar) may still be rejected by the service.

## License

[MIT](LICENSE) © ofzza
