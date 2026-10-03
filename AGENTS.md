# Agent instructions — Nightwire

Several agents (Codex, Claude Code) work on this project. GitHub is the shared record:
`origin` = https://github.com/aum-unreal/nightwire (**public**), branch `main`.

## After every APK version is built: commit and push to main

Whenever you bump the version (`package.json` and the `AndroidManifest.xml` versionCode/versionName) and `./build.sh` succeeds with the tests passing:

1. `git pull --rebase origin main` first. Another agent may have pushed.
2. `git add -A` and `git commit -m "Nightwire <version>: <one-line summary>"`.
3. `git push origin main`.
4. Check that `git status -sb` shows `## main...origin/main` with nothing ahead.

Rules:
- Never force-push or rewrite `main` history. If the rebase conflicts, resolve it or stop and ask.
- Don't commit build outputs, APKs, logs or test screenshots. `.gitignore` covers them; don't override it with `git add -f`.
- **This repo is public.** Never commit keystores, tokens, API keys, personal documents or personal email addresses. The repo-local `user.email` is the GitHub no-reply address; keep it.
- If the push fails (no network, auth), say so in your final report. Don't skip it silently.
- Work in progress between versions may be committed locally at any time. Pushing at each built version is the minimum.
