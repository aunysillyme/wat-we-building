# Verification: wat we building v2

Implemented in this clone on 2026-09-20. **Not deployed, not committed, not pushed.** The original Worker configuration is unchanged.

## Coverage

D = exact command `node tests/dom.mjs`, dependency-free scripted DOM/event harness with mocked Worker/clipboard responses.
W = exact command `node tests/worker.mjs`, real Worker handler with mocked Workers AI.

| Item | Status | Proof |
| --- | --- | --- |
| F1 Proof checklist | IMPLEMENTED | D: PASS pass/fail, matching must-do repair context, rewind restores notes/status, all-pass verdict, storage persistence. |
| F2 Builder export | IMPLEMENTED | D: PASS all five target messages contain the generated build order. Both screens have target/export/download controls. |
| F3 Scope trimmer | IMPLEMENTED | D: PASS explicit Park removes only the selected line and records it in brief/storage; Keep preserves it. |
| F4 Archetypes | IMPLEMENTED | D: PASS calculator through five question buttons, all four starters, retained habit-tracker sample. |
| F5 Scoped repair | IMPLEMENTED | D: PASS current HTML + named failure sent to `/revise`, new version preview. W: PASS revise prompt and payload. |
| F6 Vague words | IMPLEMENTED | D: PASS suggestion/dismiss and mirror priority. |
| F7 Reality card | IMPLEMENTED | D: PASS negated server needs produce browser-only card, positive needs produce service ranges. |
| F8 Versions | IMPLEMENTED | D: PASS rewind restores HTML/proof, seven versions remain in memory and latest five reload. |
| F9 Share dossier | PARTIAL | D: PASS round-trip/banner, malformed hash recovery and 30KB guard. Exact requested compact base64url JSON format is implemented; no binary compression. |
| F10 Mistake mirror | IMPLEMENTED | D: PASS all five priority branches, failed steps count as walked, one card and next-time rule. |
| Fix: build order | IMPLEMENTED | D + W: PASS build request includes generated build order. Answer edits invalidate a stale one-pager. |
| Fix: abuse protection | IMPLEMENTED | W: PASS forbidden/missing/null Origin, shared 10/60s limit/reset, byte caps, malformed JSON/type validation and bounded request envelope. |
| Fix: incomplete replies | IMPLEMENTED | D: PASS previous preview survives incomplete output. W: PASS both models incomplete -> 502; primary incomplete -> valid fallback succeeds. |
| Fix: README | IMPLEMENTED | README describes F1-F10, all three endpoints and the complete operating chain, failure modes and manual verification. |

## Required checks

1. **Syntax: PASS.** `node tests/dom.mjs` writes the extracted inline script. `node --check tests/frontend-extracted.js` and `node --check worker/src/index.js` both exited 0.
2. **Walkthrough: PASS in scripted DOM only.** `node tests/dom.mjs` exited 0 with PASS lines for F1-F10 and guards. `node tests/browser.mjs` was attempted but Chromium failed before opening the file: `bootstrap_check_in ... Permission denied (1100)`. Actual 400px rendering, iframe execution, CSP enforcement, native clipboard/download and a live generated app are UNVERIFIED. The harness confirms the single-column media rule exists, not that pixels fit.
3. **Production deployment: NOT RUN.** The standing independent-review gate could not complete: the Claude code-reviewer command returned `Not logged in · Please run /login`. No `npx wrangler@4 deploy` was run. Validation command from `worker/`: `WRANGLER_LOG_PATH="$PWD/tests/wrangler-dry-run.log" wrangler deploy --dry-run --outdir ../tests/worker-bundle`. Wrangler 4.118.0 exited 0, listed `env.AI AI`, and ended with `--dry-run: exiting now.` This is not deployment evidence.
4. **Commit/push: BLOCKED.** `git add index.html worker/src/index.js README.md .gitignore AUDIT_BRIEF.md tests/dom.mjs tests/worker.mjs tests/browser.mjs tests/live-probe.sh` exited 128: `.git/index.lock: Operation not permitted`. Git metadata is read-only in this environment. No commit SHA was created or pushed; no push was attempted.

## Live probes

Each command below was attempted with a real, non-secret payload. All three exited 6 with `Could not resolve host: wat-we-building-bot.aunysillyme.workers.dev` and `HTTP 000`. They did not reach the existing live Worker and are not proof of the patch in production.

```sh
curl --max-time 15 -sS -o tests/live-plan-response.json -w 'HTTP %{http_code}\n' 'https://wat-we-building-bot.aunysillyme.workers.dev/plan' -H 'Origin: https://aunysillyme.github.io' -H 'Content-Type: application/json' --data '{"answers":["One page counter","Increment a number","Keep the count visible","One HTML file","Press Add and see 1"]}'
curl --max-time 15 -sS -o tests/live-build-response.json -w 'HTTP %{http_code}\n' 'https://wat-we-building-bot.aunysillyme.workers.dev/build' -H 'Origin: https://aunysillyme.github.io' -H 'Content-Type: application/json' --data '{"brief":"Build one self-contained HTML counter with an Add button that increments zero to one. Inline JS only. Return complete HTML."}'
curl --max-time 15 -sS -o tests/live-revise-response.json -w 'HTTP %{http_code}\n' 'https://wat-we-building-bot.aunysillyme.workers.dev/revise' -H 'Origin: https://aunysillyme.github.io' -H 'Content-Type: application/json' --data '{"html":"<!doctype html><html><body><button>Add</button></body></html>","brief":"One HTML page with an Add button","request":"Change only the Add button label to Add one"}'
```

After an authorized deployment, `sh tests/live-probe.sh` performs the proper ordered live plan/build/revise check using the actual built HTML for the repair.

## Choices and limits

- Kept the specified share wire format. Compact JSON/base64url is not binary compression, so F9 is PARTIAL.
- Kept `Origin: null` disallowed. A local file can author/export; live bot calls require the public page or the existing allowed localhost origin. Local walkthrough uses fixtures.
- Kept the requested in-isolate rate limit; added no paid binding, database or backend store.
- Did not claim the generated app's functionality from structural HTML validation. The user must walk each result.
- Did not bypass the missing independent review, network restriction or read-only Git metadata.
- Added no application dependencies, third-party assets, analytics, account flow or cron. The only browser assets remain the existing Google Fonts link.

Docs retrieval lane used: `/llms.txt` first, then direct web fetch of official Cloudflare Worker best practices and Wrangler commands. No Firecrawl fallback was used. Commands were checked against https://developers.cloudflare.com/workers/wrangler/commands/ and the installed Wrangler dry run.
