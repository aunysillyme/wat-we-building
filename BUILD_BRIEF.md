# BUILD BRIEF — wat we building? v2 (ten features)

You are implementing, not advising. Write the code, run it, report a coverage table.

## Repo layout (read these first)
- `index.html` — the whole frontend. One file, no framework, no build step, no bundler. Vanilla JS in one `<script>` at the bottom. CSS is one `<style>` block over CSS variables at the top. KEEP IT THAT WAY.
- `worker/src/index.js` — Cloudflare Worker on Workers AI. `POST /plan` (one-pager, `@cf/meta/llama-3.1-8b-instruct-fast`) and `POST /build` (one self-contained HTML file from the brief, `@cf/meta/llama-3.3-70b-instruct-fp8-fast` with 8B fallback). CORS allowlist at the top.
- `worker/wrangler.toml` — name `wat-we-building-bot`, `[ai]` binding.
- Live: https://aunysillyme.github.io/wat-we-building/ (GitHub Pages, branch `main`, root). Worker: https://wat-we-building-bot.aunysillyme.workers.dev

## What the product is
A first-time builder answers five questions before their AI builds anything:
1 finish line · 2 must-dos (one per line) · 3 angle (obvious version vs what really goes wrong) · 4 the box (stack + what it is NOT allowed to need) · 5 proof walk.
It assembles a brief, optionally has a bot write a one-pager, then an in-app agent builds one HTML file from the brief and pins the user's own proof walk under the preview.

Existing globals you must reuse, not re-invent: `Q` (question defs), `ans` (answers array, persisted to `localStorage` key `wwb.answers`), `save()`, `go(i)`, `finish()`, `brief()`, `md(t)`, `showAgent()`, `runBuild()`, `SAMPLE`, `lastHtml`, `lastPlan`, `BOT`, `BUILD`.

## Non-negotiable constraints
- No framework, no build step, no npm, no bundler, no external JS/CSS except the existing Google Fonts `<link>`.
- Keep the existing design system: CSS variables only (`--cream #FAF5EE`, `--navy #0B1121`, `--red #8B1E2D`, `--line`, `--muted`), Archivo Black display face, Inter body, IBM Plex Mono for code/labels. Do not introduce new colours outside those variables.
- Must work at 400px wide. Single column below 640px.
- Every screen says what to do next. No dead ends.
- `localStorage` access wrapped in try/catch everywhere (the preview iframe blocks it).
- Do not add analytics, accounts, or any third-party network call.
- Deterministic, working code. If a feature cannot be done inside these constraints, implement the closest version that can and say so in the coverage table.

## The ten features, in build order

### F1 — Proof-walk checklist (highest value)
Today question 5's text is pinned under the preview as static prose. Make it real:
- Split answer 5 into steps: by line if multi-line, else by sentence (`. ` / `; ` / ` then `). Render as a checklist with **Passed** / **Failed** buttons per step.
- State persists per build in memory and in `localStorage` (`wwb.walk`).
- A header counter: `2 of 4 steps passed`.
- Pressing **Failed** reveals a one-line "what happened instead?" input and a **Send this back to the agent** button, which feeds F5's repair loop with: the failed step, the user's text, and the matching must-do line.
- Until every step is either passed or failed, show `Not verified yet` in red under the preview. When all pass, show `You walked it. This one is real.` in the ship colour.

### F2 — Export to a real builder
Under the brief and under the agent preview, a row of buttons: **Lovable · Bolt · Claude Code · Cursor · Copy for any agent**.
- Each copies a builder-shaped first message to the clipboard: the brief, plus (if the bot one-pager exists) its build order, plus a one-line note naming the target tool's conventions (e.g. Lovable/Bolt: "start with a single page, no auth until I ask"; Claude Code/Cursor: "create the files in this repo, run it, and show me the output").
- Also offer **Download brief.md**. Do not deep-link to any vendor URL (they change); copy-to-clipboard only, with a confirmation toast.

### F3 — Scope trimmer (v2 parking lot)
While typing must-dos (question 2), detect heavy scope by keyword: login, sign up, auth, account, users, stripe, payment, checkout, subscription, database, backend, api key, realtime, chat, notifications, email, upload, admin, dashboard, multiplayer, social feed, ai, search.
- Show an inline banner under the field: `"login" is heavy for a v1. Park it?` with **Park for v2** and **Keep it**.
- Parked items move to a `v2 parking lot` list shown on the result screen and appended to the brief under `## Parked for v2 (do not build)`.
- Never block typing. Never auto-remove a line.

### F4 — Archetype starters
On question 1, above the input: **Not sure? Start from a shape** — four chips: **Calculator / estimator · Curated list · Interactive quiz · Form to summary**.
- Picking one pre-fills all five answers with a realistic worked example for that shape (different content per archetype, not the same sample reworded), lands the user on question 1 with the text editable, and shows `Prefilled from the calculator shape. Edit anything.`
- Keep the existing `show me a filled one` behaviour working (it is the habit tracker example).

### F5 — Scoped change loop
Replace "Build again" (which today resends the identical brief) with a real repair loop.
- New worker endpoint `POST /revise`: takes `{ html, brief, request }` where `request` names the failed must-do and what happened. System prompt: edit ONLY what the request names, return the COMPLETE updated HTML file, change nothing else, never drop existing working features. Same model/fallback pair and the same fence/doctype extraction as `/build`.
- Frontend: under the preview, **What went wrong?** with a required one-line input, optionally pre-filled by F1. On submit, send the current `lastHtml` plus the request, swap the preview to the result.
- Keep a plain **Rebuild from scratch** as a secondary button.

### F6 — Vague-word teardown
As the user types any answer, flag empty words: modern, simple, clean, intuitive, seamless, nice, good, beautiful, user-friendly, robust, scalable, easy, fast, professional, sleek, polished, engaging, innovative.
- Inline chip under the field: `"modern" tells the agent nothing. Say what it should do instead.` with one concrete swap suggestion per word (a small static map, no model call).
- Non-blocking. A **dismiss** on each chip.

### F7 — Stack and cost reality card
On the result screen, a small card derived from answers 2 and 4 by keyword rules (no model call):
- `Runs free in the browser` when nothing needs a server.
- Otherwise name what it needs and the honest range: database ($0-25/mo), auth provider ($0 to start), an AI API key (~$0.01-0.10 per run), email sending, file storage, a domain (~$12/yr).
- One line under it: `Anything here is a thing you have to set up yourself. Park what you do not need yet.`

### F8 — Version rewind strip
Above the preview, `v1 v2 v3 …` chips, one per build or revision. Clicking one restores that HTML into the preview and marks it current. Keep every version in memory and the latest 5 in `localStorage` (`wwb.versions`). Show the request that produced each version on hover (`title` attribute).

### F9 — Shareable build dossier
A **Share this build** button that produces a URL to the same page carrying the five answers, compressed, in the URL hash (`#s=<base64url of a JSON array>`), no backend.
- On load, if the hash is present, parse it, fill `ans`, and open the result screen with a banner: `Someone shared their build with you. Edit anything and make it yours.`
- Guard against a hash over ~30KB (say so and offer the .md download instead). Never put the generated HTML in the URL.
- Wrap all parsing in try/catch; a malformed hash must land on question 1, not a broken page.

### F10 — Mistake mirror
At the end (on the agent screen once a build exists), a single card naming the one habit the session showed, chosen by simple rules in this order:
- Any vague word left undismissed → `You left "modern" in the brief. Vague words are where agents guess.`
- More than 5 must-dos → `You asked for 7 things at once. Beginners who ship start with 2.`
- Parked nothing while typing heavy scope → `You kept login in a v1. That is the single most common reason a first build never finishes.`
- Built without walking the proof steps → `You looked at it and called it done. Walking it is the whole skill.`
- None of the above → `You wrote a finish line and walked it. That is the habit.`
Show it once, with a **one rule for next time** line.

## Also fix, same pass
- `/build` currently receives the templated brief even when the bot one-pager exists. If a one-pager has been generated, pass its build order along with the brief.
- Add basic abuse protection to the Worker: per-IP rate limit (use the `cf-connecting-ip` header, an in-memory Map with a 60s window, 10 requests; it is best-effort per isolate and that is fine), a 6KB cap on `brief`, a 200KB cap on `html` in `/revise`, and reject any request whose Origin is not on the allowlist.
- Reject an incomplete model reply (no `</html>`) rather than previewing it.
- Update `README.md` to describe the ten features and the three endpoints.

## Verification you must do before reporting
1. `node --check` on the extracted `<script>` from `index.html`.
2. Open `index.html` locally (no server) and walk: archetype chip → five questions → brief → export copy → agent build → proof checklist → a revision → a version rewind → share link round-trip. Use a headless run or a scripted DOM harness if you cannot open a browser; say which you used.
3. Deploy the worker: `cd worker && npx wrangler@4 deploy`. Then curl `/plan`, `/build` and `/revise` with a real payload and confirm each returns HTML/plan, not an error.
4. Commit on `main` with a clear message, push. Do not force-push, do not rewrite history.

## Report format (required)
A coverage table: each of F1-F10 and each "also fix" item → IMPLEMENTED / PARTIAL / MISSING, plus the proof (the command you ran and what it returned). Then anything you chose not to do and why.

## Task bundle
**Purpose.** Implement ten named features (F1-F10) plus four fixes in the live `wat we building?` repo at https://github.com/aunysillyme/wat-we-building, so a first-time builder is walked from a vague idea to a brief, a built app, a verified proof walk and a scoped repair loop. Owner: Auny (aunysillyme). This is a real public site on GitHub Pages plus a live Cloudflare Worker; both must still work when you finish.

**Denied actions.** Absence is not permission.
- No framework, bundler, npm dependency, build step, or external script/stylesheet beyond the Google Fonts link already in `index.html`.
- No new colours, fonts or design language outside the existing CSS variables.
- No accounts, analytics, telemetry, cookies, or any third-party network call.
- No secrets, tokens or keys in code, output or commit. Never print a secret value.
- No force-push, no history rewrite, no branch deletion, no repo settings change, no new repo.
- Do not touch any path outside this repo clone. Do not deploy anything except the existing `wat-we-building-bot` Worker.
- Do not change the Worker's name, routes, or the `[ai]` binding, and do not add a paid binding or service.
- Do not delete or rewrite `index.html` wholesale; extend the existing structure and globals.
- Do not put generated HTML in a URL, and do not add a backend store for the share feature.
- Do not remove existing working features (the five questions, the sample, the brief, `/plan`, `/build`).

**Report contract.** A coverage table: each of F1-F10 and each of the four "also fix" items → IMPLEMENTED / PARTIAL / MISSING, each with its proof (the exact command run and what it returned). Then: the commit SHA you pushed, the Worker deploy output line, the results of the four verification steps above, and an explicit list of anything you chose NOT to do and why. State plainly if a verification step could not be run rather than implying it passed.
