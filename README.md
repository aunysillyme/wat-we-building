# wat we building?

Five questions take a first-time builder from a finish line to a brief, one HTML app, a proof walk and a scoped repair.

Live frontend: https://aunysillyme.github.io/wat-we-building/
Worker: https://wat-we-building-bot.aunysillyme.workers.dev
Owner: Auny (`aunysillyme`). Originally built for CampAI S2E15.

## What and why

`index.html` is the whole frontend: one inline script, one style block, no framework, dependency, bundler or build step. It keeps the existing Archivo Black / Inter / IBM Plex Mono design and CSS variables. The five questions remain finish line, must-dos, angle, the box and proof.

| Feature | What the person can do |
| --- | --- |
| F1 Proof checklist | Mark each proof step Passed or Failed, see the counter, record what happened, and choose the matching must-do before preparing a repair. Proof state belongs to its version. Every new build/revision starts unverified. |
| F2 Builder export | Copy a first message for Lovable, Bolt, Claude Code, Cursor or any agent, including the bot build order when available. Download `brief.md` from either screen. Clipboard failures offer selectable text. No vendor deep links. |
| F3 Scope trimmer | See heavy must-do lines while typing. Explicitly Park for v2 or Keep it. Parking removes only the chosen line and adds a do-not-build section to the brief. |
| F4 Archetypes | Start with a paint estimator, rainy-day activity list, plant quiz or repair handoff form, then edit all five answers. The original habit-tracker sample still opens its filled brief. |
| F5 Scoped changes | Name the failed must-do and actual behavior. Send the current HTML and its original brief to `/revise`. Rebuild from scratch remains available and uses the current edited answers. |
| F6 Vague words | Get a concrete replacement suggestion for each of 18 vague words, with a non-blocking dismiss button. |
| F7 Reality card | See keyword-derived server/service needs and rough cost ranges from the build brief. Negative constraints such as “no database” are excluded. These are planning examples, not vendor quotes. |
| F8 Rewind | Switch between every build/revision from this session; each chip has the producing request as its title. A rewind restores the matching proof state and repair context. The latest five survive reload when storage allows. |
| F9 Share dossier | Copy a same-page URL containing just the five answers in `#s=<base64url UTF-8 JSON array>`. Recipients land on the editable brief. Malformed/oversize input recovers to question one. Links over 30KB direct the person to download markdown. |
| F10 Mistake mirror | See one card per session, selected when a build is first displayed: vague words, too many must-dos, kept heavy scope, unwalked proof, or the finish-line habit, in that order. Each includes one rule for next time. |

Share format clarification: the specified JSON array is minified and base64url encoded, not binary-compressed. Binary compression would change that wire format. Generated HTML, parked items, proof results and the bot plan are never put in the hash. Agent-screen exports use the selected version; result-screen exports use the edited answers. Share URLs from a local file work locally; use the public site to share a public URL.

## Trigger

The person types answers, clicks a bot/build/repair button, or opens a share URL. There are no cron jobs, background network calls, accounts, analytics or telemetry. Google Fonts remains the only external frontend asset.

## Invocation chain

1. Open `index.html`, choose a shape or enter answers, and advance through the five questions.
2. Build the brief, trim scope, optionally call `/plan`, then export or open the agent screen.
3. Build sends the assembled brief plus the extracted `## build order` from the current bot plan to `/build`.
4. The Worker validates the request, calls Workers AI and returns a complete HTML file.
5. The page creates an immutable version snapshot and previews it in an opaque sandbox with a restrictive CSP. Each proof result belongs to that snapshot.
6. Failure details prepare the repair field for review. Submitting calls `/revise` with the selected version's HTML and brief. A successful repair creates a new version with a fresh checklist.
7. Walk the new checklist, rewind if necessary, download the HTML, or export/share the brief.

Editing answers invalidates the bot one-pager so a stale build order cannot silently follow an edited brief. Revisions retain the selected version's original answers, parked scope and order. The original version is retained if a request fails or returns truncated HTML. Local-file origins are intentionally not allowed to call the Worker; open the public site (or the existing localhost:8080 allowed origin) for live AI calls. All local authoring and exports still work.

## Dependencies

- A browser with JavaScript, UTF-8 encoding and optional clipboard/localStorage access.
- The existing Google Fonts stylesheet link; system fonts remain fallbacks.
- Cloudflare Worker `wat-we-building-bot` with its unchanged `[ai]` binding `AI`.
- `/plan`: `@cf/meta/llama-3.1-8b-instruct-fast`.
- `/build` and `/revise`: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, falling back to the same 8B model on errors or incomplete output.
- Deployment only: an authenticated Wrangler v4 environment and GitHub push access. No runtime npm packages are installed.

## Reads

- `wwb.answers`: five strings, validated on load.
- `wwb.parked`: explicit parked must-do lines.
- `wwb.versions`: the latest five HTML snapshots, requests, answers, brief, build order and parked scope.
- `wwb.walk`: proof status, failure note and selected must-do keyed by version ID.
- Share hash: exactly five nonblank strings, decoded inside try/catch with a 30KB encoded limit.

All localStorage reads and writes are inside try/catch. Invalid records are ignored. Dismissed vague words, kept scope decisions and the once-only mirror are session state.

## Writes

The same localStorage keys, clipboard text, downloaded `brief.md`/`index.html`, and the sandboxed preview. No backend store. Worker calls contain only the answers, brief or selected HTML/repair request needed for that button. The rate-limit Map holds IP counters for one minute in each isolate and never logs them.

| Endpoint | POST JSON | Success JSON |
| --- | --- | --- |
| `/plan` | `{ "answers": ["finish", "must-dos", "angle", "box", "proof"] }` | `{ "plan": "markdown", "model": "..." }` |
| `/build` | `{ "brief": "brief plus optional bot build order" }` | `{ "html": "complete HTML", "model": "...", "lines": 1 }` |
| `/revise` | `{ "html": "current complete HTML", "brief": "this version's brief plus order", "request": "failed must-do and actual behavior" }` | `{ "html": "complete updated HTML", "model": "...", "lines": 1 }` |

Protection applies before AI execution: reject missing/disallowed Origin (`403`), share a best-effort per-IP 10-request/60-second limit across all three endpoints (`429`, Retry-After), validate types and blank values (`400`), cap `brief` at 6144 UTF-8 bytes and revision `html` at 204800 bytes (`413`). Plan answers together are capped at 6144 bytes; repair requests at 8192 bytes. The JSON stream has a bounded envelope before parsing. Allowed origins remain GitHub Pages, `http://localhost:8080` and `http://127.0.0.1:8080`. This is not authentication or a global quota guarantee.

## The closed loop

The user is the verifier: every version begins with “Not verified yet”, failed steps produce scoped repair context, and only all Passed yields “You walked it. This one is real.” Model completion alone is not proof of functionality.

What watches it: **nothing automated**. There is no uptime monitor, scheduled test, or alert. Auny owns failures. Report the endpoint, response status and reproduction to the calling session; do not include credentials or private payloads.

## Failure modes

- Worker origin rejection for file URLs: use the public page or export the brief.
- Rate limit: wait for the one-minute window; retries do not bypass it.
- Brief too large: trim answers/build order or download markdown for another agent. No silent truncation.
- Model timeout/failure/incomplete HTML: preserve the previous version; retry or export.
- Sandbox storage: downloaded HTML can use localStorage; preview storage is blocked. Walk persistence-dependent features in the downloaded file.
- Storage quota or denial: keep versions in memory, show a notice if version persistence fails, and download before closing. Only five versions persist; all session versions remain in memory.
- Heuristics: must-do matching can be corrected in the failure selector. Scope/cost rules do not semantically understand every sentence. AI preservation of working features requires a new proof walk.
- Malformed share/stored state: ignore invalid data and keep navigation usable.

## Run and verify by hand

No application setup or server is required. Open `index.html`. For real Worker calls, use the public frontend.

```sh
node tests/dom.mjs
node --check tests/frontend-extracted.js
node --check worker/src/index.js
node tests/worker.mjs
```

`tests/dom.mjs` executes the actual inline script and event listeners in a dependency-free scripted DOM harness. It covers the requested archetype-to-share journey and feature edge cases with mock AI/clipboard responses. It cannot verify pixel layout, iframe execution, browser CSP or native clipboard behavior.

Optional real headless browser walkthrough using an already-installed Playwright (no project dependency):

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/browser.mjs
```

It opens the file at 400px with mocked endpoint responses and can save `tests/mobile-agent.png`. An environment that permits Chromium launch is required. Check the actual generated app yourself after a live build.

Before shipping, complete the independent Claude code-reviewer challenge in `AUDIT_BRIEF.md`, reproduce findings, fix them, and rerun the affected harness checks. Then, from an authenticated environment:

```sh
cd worker
npx wrangler@4 deploy
```

Probe each endpoint with real JSON and the allowed Origin header, then commit and push `main` without rewriting history. `tests/live-probe.sh` runs the three curl probes in order and passes the built HTML into the repair request. It creates only files under `tests/`.

## Source of truth

`BUILD_BRIEF.md` is the requested behavior, `index.html` is the frontend, `worker/src/index.js` is the endpoint implementation and `worker/wrangler.toml` preserves the deployment name and binding. This README is the single end-to-end operating document. Verification evidence and any environment blockers are recorded in `VERIFICATION.md`; unrun live behavior is UNVERIFIED.
