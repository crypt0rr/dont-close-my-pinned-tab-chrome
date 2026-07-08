#!/bin/sh
set -eu

VERSION="0.3.1"
PACKAGE_NAME="dont-close-my-pinned-tab-chrome-v${VERSION}.zip"

mkdir -p dist
rm -f "dist/${PACKAGE_NAME}"

zip -r "dist/${PACKAGE_NAME}" \
  manifest.json \
  background.js \
  options.html \
  options.css \
  options.js \
  icons \
  README.md \
  PRIVACY.md \
  STORE_LISTING.md \
  LICENSE \
  -x "*.DS_Store"

echo "Created dist/${PACKAGE_NAME}"
