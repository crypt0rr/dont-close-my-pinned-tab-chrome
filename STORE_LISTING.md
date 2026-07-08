# Chrome Web Store Listing

## Short Description

Keep pinned tabs from staying closed.

## Detailed Description

Don't Close My Pinned Tab restores pinned tabs when they are closed with
`Cmd+W`, `Ctrl+W`, the mouse, or another tab close action.

Chrome does not let extensions cancel reserved browser shortcuts before the
browser handles them, so a pinned tab may briefly disappear before being
restored. The extension recreates closed pinned tabs as pinned and inactive, then
asks Chrome to unload them until selected.

By default, restored tabs reopen at the site's base URL, such as
`https://example.com/`. You can change this in the extension options and restore
the exact URL instead. You can also add per-site rules when a specific web app
needs different restore behavior.

## Key Features

- Restores closed pinned tabs automatically.
- Leaves non-pinned tabs alone.
- Skips restoration when an entire browser window is closing.
- Supports base URL or exact URL restore.
- Can unload restored tabs until selected.
- Supports per-site restore rules by origin.
- Stores settings in Chrome sync storage.

## Privacy

The extension does not collect, sell, transmit, or share personal data. It stores
tab restore state locally in the browser and stores user preferences through
Chrome sync storage.
