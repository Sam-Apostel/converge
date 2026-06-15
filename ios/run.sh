#!/usr/bin/env bash
# Build Converge, install on Sam's iPhone, and launch it.
# Usage: ios/run.sh
set -euo pipefail

export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEVICE="${CONVERGE_DEVICE:-35F0A5C0-C274-568C-8DEC-03A5166EDDA1}" # Sam's iPhone
BUNDLE=land.sams.converge

cd "$DIR"
xcodegen generate

xcodebuild \
  -project Converge.xcodeproj \
  -scheme Converge \
  -destination 'generic/platform=iOS' \
  -derivedDataPath build \
  -allowProvisioningUpdates \
  -quiet \
  build

APP="$DIR/build/Build/Products/Debug-iphoneos/Converge.app"
xcrun devicectl device install app --device "$DEVICE" "$APP"
xcrun devicectl device process launch --device "$DEVICE" "$BUNDLE"
