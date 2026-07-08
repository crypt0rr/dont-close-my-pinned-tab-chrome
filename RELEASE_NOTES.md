# Don't Close My Pinned Tab v0.4.0

## Added

- Added per-site restore rules.
- Added origin-based rule matching for sites such as `https://example.com` and
  `http://localhost:3000`.
- Added options UI for adding and removing site rules.
- Added per-site overrides for restore enabled, restore URL mode, and unload
  restored tabs.

## Changed

- Bumped extension version to `0.4.0`.
- Global options now act as defaults when no site rule matches.
- Documentation now covers per-site rules and release checks for rule behavior.

## Notes

Site rules match URL origins only. A rule for `https://example.com` does not
match `https://sub.example.com` or `https://example.com:8443`.
