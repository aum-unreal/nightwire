#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
PROJECT_DIR="$PWD"
ANDROID_JAR="$HOME/dev/sdk/android.jar"
node scripts/vendor.cjs
node node_modules/typescript/bin/tsc -p classifier/tsconfig.json
mkdir -p build
rm -rf build/res build/gen build/classes build/dex
mkdir -p build/{res,gen,classes,dex}
aapt2 compile --dir res -o build/res/resources.zip
aapt2 link -o build/base.apk -I "$ANDROID_JAR" --manifest AndroidManifest.xml --java build/gen -A assets --min-sdk-version 26 --target-sdk-version 35 build/res/resources.zip
javac --release 17 -encoding UTF-8 -d build/classes -classpath "$ANDROID_JAR" src/dev/nightwire/*.java build/gen/dev/nightwire/R.java
d8 --lib "$ANDROID_JAR" --min-api 26 --output build/dex build/classes/dev/nightwire/*.class
python "$HOME/dev/mkapk.py" build/base.apk build/aligned.apk build/dex/classes*.dex
apksigner sign --ks "$HOME/dev/sdk/debug.keystore" --ks-pass pass:android --key-pass pass:android --ks-key-alias debug --out nightwire.apk build/aligned.apk
apksigner verify --verbose nightwire.apk
ls -lh nightwire.apk
