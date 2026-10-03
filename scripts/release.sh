#!/data/data/com.termux/files/usr/bin/bash
# Publish the built APK as a GitHub release. Run after ./build.sh and the tests pass.
#   scripts/release.sh ["commit summary"]   commit, push main, tag v<version>, attach Nightwire-<version>.apk
#   scripts/release.sh --replace            also overwrite the APK on an existing release
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=aum-unreal/nightwire APK=nightwire.apk REPLACE=0 SUMMARY=""
for a in "$@"; do case "$a" in --replace) REPLACE=1;; -*) echo "unknown option $a" >&2; exit 2;; *) SUMMARY="$a";; esac; done
die() { echo "release: $*" >&2; exit 1; }

# 1. Versions must agree: package.json, manifest and the built APK.
VER=$(node -p 'require("./package.json").version')
MAN_NAME=$(grep -o 'versionName="[^"]*"' AndroidManifest.xml | cut -d'"' -f2)
MAN_CODE=$(grep -o 'versionCode="[^"]*"' AndroidManifest.xml | cut -d'"' -f2)
[ -f "$APK" ] || die "$APK missing; run ./build.sh"
BADGE=$(aapt2 dump badging "$APK" | head -1)
APK_NAME=$(sed -n "s/.*versionName='\([^']*\)'.*/\1/p" <<<"$BADGE")
APK_CODE=$(sed -n "s/.*versionCode='\([^']*\)'.*/\1/p" <<<"$BADGE")
[ "$VER" = "$MAN_NAME" ] || die "package.json $VER != manifest versionName $MAN_NAME"
[ "$APK_NAME" = "$VER" ] && [ "$APK_CODE" = "$MAN_CODE" ] || die "APK is $APK_NAME ($APK_CODE), source is $VER ($MAN_CODE); rebuild"
apksigner verify "$APK" >/dev/null || die "APK signature does not verify"

# 2. The APK must be newer than every shipped source file (docs and tests excluded).
STALE=$(git ls-files -co --exclude-standard -- AndroidManifest.xml assets res src classifier package.json build.sh | while read -r f; do [ "$f" -nt "$APK" ] && echo "$f"; done || true)
[ -z "$STALE" ] || die "APK is older than: $(echo $STALE) — rebuild"

# 3. Release notes come from the README's version paragraph.
NOTES=$(grep -m1 "^Nightwire $VER " README.md || true)
[ -n "$NOTES" ] || die "README has no 'Nightwire $VER ...' paragraph"
SHA=$(sha256sum "$APK" | cut -d' ' -f1)

# 4. Commit, sync with origin, push.
git add -A
git diff --cached --quiet || git commit -q -m "Nightwire $VER: ${SUMMARY:-release}"
git pull -q --rebase origin main
git push -q origin main

# 5. Tag the released commit.
TAG="v$VER"
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  [ "$(git rev-parse "$TAG^{commit}")" = "$(git rev-parse HEAD)" ] || [ "$REPLACE" = 1 ] || die "$TAG already tags another commit"
else
  git tag -a "$TAG" -m "Nightwire $VER (versionCode $MAN_CODE)"
fi
git push -q origin "refs/tags/$TAG"

# 6. Create the release, or attach the APK to an existing one.
ASSET="build/Nightwire-$VER.apk"
cp "$APK" "$ASSET"
BODY=$(printf '%s\n\nversionCode %s · SHA-256 `%s`\n\nSigned with the same key as earlier releases, so it installs over them.' "$NOTES" "$MAN_CODE" "$SHA")
if gh release view "$TAG" -R "$REPO" >/dev/null 2>&1; then
  if gh release view "$TAG" -R "$REPO" --json assets --jq '.assets[].name' | grep -qx "Nightwire-$VER.apk"; then
    [ "$REPLACE" = 1 ] || die "release $TAG already has an APK; use --replace to overwrite"
  fi
  gh release upload "$TAG" "$ASSET" -R "$REPO" --clobber
  gh release edit "$TAG" -R "$REPO" --notes "$BODY" >/dev/null
else
  gh release create "$TAG" "$ASSET" -R "$REPO" --title "Nightwire $VER" --notes "$BODY" --latest >/dev/null
fi
echo "released $TAG: https://github.com/$REPO/releases/tag/$TAG ($SHA)"
