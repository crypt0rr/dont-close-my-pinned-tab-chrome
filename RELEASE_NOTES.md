# Don't Close My Pinned Tab v0.3.0

## Added

- Added an options page.
- Added a toggle to enable or disable pinned tab restoration.
- Added a toggle to unload restored tabs until selected.
- Added restore URL mode:
  - Site base URL
  - Exact URL
- Added extension icon assets and toolbar icon support.
- Added privacy policy draft.
- Added Chrome Web Store listing draft.
- Added release QA checklist to the README.

## Changed

- Bumped extension version to `0.3.0`.
- Restored tabs now follow the configured restore behavior.
- Clicking the toolbar icon opens the options page.
- Documentation now covers options, permissions, privacy, store publishing, and manual release checks.

## Notes

Chrome does not allow extensions to cancel reserved browser shortcuts before Chrome handles them, so pinned tabs may briefly disappear before being restored.
