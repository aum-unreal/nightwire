#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build/native-classes build/native-dex
for f in build/native-dex/classes.dex build/native-dex/runtime.apk; do if [ -f "$f" ]; then chmod 644 "$f"; fi; done
javac --release 17 -cp "$HOME/dev/sdk/android.jar:build/classes" -d build/native-classes tests/NativeChecks.java
d8 --lib "$HOME/dev/sdk/android.jar" --classpath build/classes --min-api 26 --output build/native-dex build/native-classes/dev/nightwire/*.class
cp nightwire.apk build/native-dex/runtime.apk
chmod 444 build/native-dex/classes.dex build/native-dex/runtime.apk
TEST_DIR="$(mktemp -d "$PREFIX/tmp/nightwire-native.XXXXXX")"
trap 'rm -rf "$TEST_DIR"' EXIT
CLASSPATH="$PWD/build/native-dex/runtime.apk:$PWD/build/native-dex/classes.dex" /system/bin/app_process -Xmx128m /system/bin dev.nightwire.NativeChecks "$TEST_DIR"
