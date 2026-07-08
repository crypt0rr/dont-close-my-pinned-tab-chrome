# Don't Close My Pinned Tab

A small Manifest V3 Chrome extension that keeps pinned tabs from staying closed.
When a pinned tab is closed with `Cmd+W`, `Ctrl+W`, the mouse, or another tab
close action, the extension recreates it as a pinned inactive tab and asks Chrome
to discard it from memory.

Chrome does not let extensions cancel reserved browser shortcuts like close-tab
before the browser handles them, so the tab can briefly disappear and reappear.
The restored tab keeps its pinned state and reopens at the site's base URL, but
not runtime page state such as form input, scroll position, back/forward
history, or JavaScript memory.

## Install locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository folder.

## Behavior

- Pinned tabs are restored when closed.
- Non-pinned tabs are not affected.
- Pinned tabs are not restored when their whole browser window is closing.
- Restored tabs are created inactive at the site's base URL. After Chrome commits
  that URL, the extension discards the tab when Chrome allows it, so it reloads
  when selected.
- The current visible URL is tracked for normal navigations, History API route
  changes, and hash changes, then normalized to the site base URL when restored.
- Internal or restricted URLs may not restore if Chrome refuses to create them
  from an extension.

## Permissions

- `tabs`: tracks pinned tabs and recreates them when closed.
- `storage`: keeps the pinned tab snapshot available after Chrome suspends the
  Manifest V3 background service worker.
- `webNavigation`: tracks the exact visible URL for navigations, single-page app
  route changes, and hash changes.

## Development checks

```sh
node --check background.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8'))"
```
