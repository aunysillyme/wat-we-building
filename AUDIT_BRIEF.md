# wat we building v2: independent Claude code-reviewer audit

Read-only review requested before deployment/push. Codex authored this patch; challenge it using Claude, not another Codex round. Do not edit files, access secrets, deploy or write elsewhere.

## Purpose and runtime
Extend index.html (one inline vanilla script/style, file-openable) and worker/src/index.js (Cloudflare Workers AI) per BUILD_BRIEF.md. Frontend publishes through main on GitHub Pages; existing Worker name and AI binding remain unchanged.

## Threat model and callers
Public visitors and arbitrary HTTP clients. Treat answers, share hashes, stored JSON, generated HTML and repair requests as untrusted. No auth or external state. Strict Origin allowlist plus best-effort 10 requests/IP/60s per isolate; Origin is not authentication. Generated preview has opaque sandbox and a network-blocking CSP. Downloads remain generated code, user must walk it. No payload/IP logging.

## Design choices to challenge
- Version snapshots carry answers, brief, build order, parking lot and independent proof state, so repairing a rewind uses its original brief.
- New revision resets proof states. Latest five versions/walks persist; all session versions stay in memory.
- Explicit Park moves a whole must-do line, never an automatic edit. Must-do matching is heuristic with a user override.
- Share uses the requested base64url compact JSON array, not binary compression. No generated HTML in hash. Input over 30KB is rejected with markdown fallback.
- Worker validates UTF-8 lengths, typed payloads, bounded streaming JSON, and complete HTML; truncated primary model results trigger the same fallback as build failures.
- Cost heuristics strip negative clauses. Ranges are the supplied planning examples, not current quotes.
- Mirror is one session card, selected on first displayed build by the requested priority.

## Verified so far
node --check extracted frontend and worker passed.
node tests/worker.mjs passed endpoint, model fallback/truncation, origin rejection, per-IP limit/reset, body caps and typed input tests.
Headless Chromium launch was rejected by macOS sandbox (MachPortRendezvous Permission denied). Scripted DOM verification is next.

## Attack focus
Find reproducible correctness or security issues in the changed frontend and Worker. Prioritize stale async state, version/proof mismatch, share parsing/XSS, caps bypass, DOM injection, network access, storage failures and reachable feature regressions. Report file/line, reproduction, impact and suggested fix. Read BUILD_BRIEF.md, git diff and tests. Do not claim a finding without reproduction or clearly label it unverified.

## Verification and review status

- `node tests/dom.mjs`: PASS. Full scripted event journey, priority rules, storage denial, latest-five persistence, malformed/oversize share and incomplete frontend output.
- `node tests/worker.mjs`: PASS. All endpoint/security/fallback tests described above.
- `node --check tests/frontend-extracted.js` and `node --check worker/src/index.js`: PASS.
- `wrangler deploy --dry-run --outdir ../tests/worker-bundle`: PASS with unchanged `env.AI` binding.
- Independent review command: `claude --agent code-reviewer -p 'Read AUDIT_BRIEF.md in this repository and perform its read-only review. Return findings only. Do not write files or use secrets.'`
- Review result: `Not logged in · Please run /login`. No review findings were produced; the review gate is NOT satisfied.
- A local verification correction makes fully failed checklists count as walked for the mirror, while retaining the red failed-proof verdict. The regression is included in `tests/dom.mjs`.
- Production deployment/push must wait for an authenticated independent review and writable Git metadata. No production changes were made in this session.

## ROUND 1 — 2026-09-20
Reviewer: Claude code-reviewer (Sonnet). Code author: codex (GPT), so the challenge went to a different model family per the standing rule. Read-only review of the uncommitted diff plus both full files.

| # | Finding | Severity | Disposition |
|---|---|---|---|
| 1 | `positiveText()` strips a negation greedily to end of clause, so a real requirement stated after "except" is erased and the reality card wrongly says "Runs free in the browser". Trigger: "No login except for admin, who needs an account." | should-fix | REPRODUCED (tests/negation.mjs, failed before). FIXED: the strip now stops at except / apart from / aside from / other than / unless. Regression test added and proven to fail before the fix. |
| 2 | `/revise` accepted 200KB of HTML, likely past the model's usable context, which would surface as a generic "agent unavailable" rather than a size problem. Not reproducible read-only. | note | FIXED anyway: cap lowered to 60KB with a specific message ("This build is too big to revise in one pass"). `requireText` gained an optional message argument; the custom and default paths were both exercised. |

Checked and reported clean, with reasoning: XSS sinks (only two innerHTML uses, `md()` escapes < and & on every segment before building markup; everything else is textContent), iframe sandbox (no allow-same-origin, plus a new CSP meta prepended to every srcdoc, no postMessage bridge), Worker input handling (typed validation rejects arrays/nulls, streamed byte counting rather than trusting Content-Length, system prompts are hardcoded constants so no attacker-controlled system role), localStorage (all four keys read through try/catch with shape validation), and the page's own claims.

Standing limitation named, not a defect of this diff: the Origin allowlist stops browser cross-site abuse but is not authentication, since a scripted caller sets its own Origin header. The rate limit is per-isolate and best-effort by design.

One round only. The harness verifies the fixes from here.
