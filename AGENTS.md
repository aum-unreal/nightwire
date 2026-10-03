# Agent instructions — Nightwire

Several agents (Codex, Claude Code) work on this project. GitHub is the shared record:
`origin` = https://github.com/aum-unreal/nightwire (**public**), branch `main`.

## After every APK version is built: release it

Whenever you bump the version (`package.json` and the `AndroidManifest.xml` versionCode/versionName), add the README's `Nightwire <version> ...` paragraph, and `./build.sh` succeeds with the tests passing, run:

```sh
scripts/release.sh "one-line summary"
```

It refuses to run if the versions disagree, if the APK is older than the source, or if the README paragraph is missing. It then commits, runs `git pull --rebase`, pushes `main`, tags `v<version>`, and creates a GitHub release with `Nightwire-<version>.apk` attached and the README paragraph as notes. Every built version must end up as a release with its APK. If the script fails, fix the cause and rerun it. Use `--replace` only to re-upload a corrected APK for the same version.

Rules:
- Never force-push or rewrite `main` history. If the rebase conflicts, resolve it or stop and ask.
- Don't commit build outputs, APKs, logs or test screenshots. `.gitignore` covers them; don't override it with `git add -f`.
- **This repo is public.** Never commit keystores, tokens, API keys, personal documents or personal email addresses. The repo-local `user.email` is the GitHub no-reply address; keep it.
- If the push fails (no network, auth), say so in your final report. Don't skip it silently.
- Work in progress between versions may be committed locally at any time. Pushing at each built version is the minimum.
