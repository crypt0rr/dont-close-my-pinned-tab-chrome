# Privacy Policy

Don't Close My Pinned Tab does not collect, sell, transmit, or share personal
data.

The extension stores a small amount of local browser state so it can restore
closed pinned tabs:

- pinned tab IDs, window IDs, tab positions, and URLs in `chrome.storage.session`
- user preferences in `chrome.storage.sync`

This data is used only by the extension. It is not sent to any external server.

The extension uses Chrome extension APIs to observe tabs and navigation events
so it can restore pinned tabs after they are closed.
