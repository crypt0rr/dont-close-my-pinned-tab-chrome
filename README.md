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
- Restored tabs are created inactive. By default, they restore at the site's base
  URL and are discarded when Chrome allows it, so they reload when selected.
- The current visible URL is tracked for normal navigations, History API route
  changes, and hash changes, then normalized to the site base URL when restored.
- Internal or restricted URLs may not restore if Chrome refuses to create them
  from an extension.

## Options

Open the extension options from `chrome://extensions`.
You can also click the extension toolbar icon to open options.

- Restore closed pinned tabs: turn protection on or off.
- Unload restored tabs until selected: ask Chrome to discard restored tabs after
  they finish loading.
- Restore URL: choose between the site base URL and the exact URL.

## Permissions

- `tabs`: tracks pinned tabs and recreates them when closed.
- `storage`: keeps the pinned tab snapshot available after Chrome suspends the
  Manifest V3 background service worker.
- `webNavigation`: tracks the exact visible URL for navigations, single-page app
  route changes, and hash changes.

## Development checks

```sh
node --check background.js
node --check options.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8'))"
```

## Release checklist

- Close a pinned tab and confirm it restores.
- Close a non-pinned tab and confirm it stays closed.
- Close a window with pinned tabs and confirm they are not recreated.
- Test base URL restore with `https://example.com/path?x=1#hash`.
- Test exact URL restore from the options page.
- Test restored-tab unload on and off from the options page.
- Test with more than one browser window.

## Store publishing

- [Privacy policy](PRIVACY.md)
- [Chrome Web Store listing draft](STORE_LISTING.md)
