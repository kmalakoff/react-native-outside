#!/usr/bin/env bash
set -eu

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PATH="$HOME/.maestro/bin:$PATH"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-600000}"
mkdir -p "$REPO_ROOT/.tmp"
collect_diagnostics() {
  result=$?
  adb devices -l > "$REPO_ROOT/.tmp/android-devices.txt" || true
  adb logcat -d > "$REPO_ROOT/.tmp/android-logcat.txt" || true
  exit "$result"
}
trap collect_diagnostics EXIT

cd "$REPO_ROOT/examples/native-test-app"
APP_ID="$(node -p 'require("./app.json").android.package')"
npm run android -- --no-packager --appId "$APP_ID"
ANDROID_DEVICE="${ANDROID_SERIAL:-$(adb devices | awk 'NR > 1 && $2 == "device" { print $1; exit }')}"
test -n "$ANDROID_DEVICE"
maestro --device "$ANDROID_DEVICE" test "$REPO_ROOT/test/integration/maestro/native-outside.yaml"
