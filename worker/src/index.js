// wat we building? bot: turns five answers into a one-page build plan on Workers AI.
const ORIGINS = ["https://aunysillyme.github.io", "http://localhost:8080", "http://127.0.0.1:8080"];
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const BUILD_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const cors = (o) => ({
  "Access-Control-Allow-Origin": ORIGINS.includes(o) ? o : ORIGINS[0],
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Content-Type": "application/json; charset=utf-8",
});
const clip = (s, n) => String(s || "").split("").filter((c) => c === "\n" || c === "\t" || c.charCodeAt(0) >= 32).join("").slice(0, n);

const SYSTEM = `You write one-page build plans for beginners building with an AI coding agent. Plain words, short lines, no hype, no emoji. Never invent features the answers did not ask for. Where an answer is vague, say what to pin down instead of guessing. Output markdown with exactly these headings, in this order:
# <a short name for the build, lowercase, max 4 words>
## one line
## what exists when it's done
## must-dos (each one is a test)
## the angle
## the box
## build order
## proof walk
## what will sink it
## first message to your agent
Under "build order", give 4 to 6 numbered steps a beginner can do in one sitting each. Under "what will sink it", give 3 specific mistakes drawn from these answers. Under "first message to your agent", write the exact prompt to paste, in a fenced code block, under 120 words.`;

export default {
  async fetch(req, env) {
    const h = cors(req.headers.get("Origin") || "");
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") return new Response(JSON.stringify({ ok: true, bot: "wat we building?", model: MODEL }), { headers: h });
    if (req.method === "POST" && url.pathname === "/build") return build(req, env, h);
    if (req.method !== "POST" || url.pathname !== "/plan") return new Response(JSON.stringify({ error: "POST /plan" }), { status: 404, headers: h });
    let body;
    try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "bad json" }), { status: 400, headers: h }); }
    const a = Array.isArray(body.answers) ? body.answers.map((x) => clip(x, 900)) : [];
    if (a.length !== 5 || a.some((x) => !x.trim())) return new Response(JSON.stringify({ error: "five answers required" }), { status: 400, headers: h });
    const user = `Answers:\n1. Finish line: ${a[0]}\n2. Must-dos: ${a[1]}\n3. Angle: ${a[2]}\n4. The box: ${a[3]}\n5. Proof: ${a[4]}`;
    try {
      const out = await env.AI.run(MODEL, {
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }],
        max_tokens: 1100, temperature: 0.4,
      });
      const text = typeof out === "string" ? out : (out && out.response) || "";
      if (!text.trim()) throw new Error("empty model reply");
      return new Response(JSON.stringify({ plan: text, model: MODEL }), { headers: h });
    } catch (e) {
      return new Response(JSON.stringify({ error: "bot unavailable: " + (e && e.message ? e.message : e) }), { status: 502, headers: h });
    }
  },
};

const BUILD_SYSTEM = `You are a careful coding agent. You will receive a build brief written by a beginner. Build EXACTLY what the brief says, nothing more.
Output ONE complete, self-contained HTML file and nothing else: no explanation, no markdown fences. Start with <!doctype html>.
Rules: no external scripts, fonts or stylesheets; no frameworks; no network calls; all CSS and JS inline; works when opened as a local file; works at phone width; if the brief needs saving, use localStorage; show sample content on first load so it is not empty; every screen says what to do next; keep it under 300 lines.
At the very top of the <body>, add a small fixed banner: "built by wat we building? from your brief · walk your proof before you trust it".
Do not add features the brief did not ask for. If a must-do is unclear, build the simplest reading and note it in an HTML comment at the top.`;

async function build(req, env, h) {
  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "bad json" }), { status: 400, headers: h }); }
  const brief = clip(body.brief, 6000);
  if (!brief.trim()) return new Response(JSON.stringify({ error: "brief required" }), { status: 400, headers: h });
  const msgs = [{ role: "system", content: BUILD_SYSTEM }, { role: "user", content: "Brief:\n\n" + brief + "\n\nReturn the HTML file now." }];
  const tryModel = async (m) => {
    const out = await env.AI.run(m, { messages: msgs, max_tokens: 4000, temperature: 0.2 });
    let t = typeof out === "string" ? out : (out && out.response) || "";
    const fence = t.match(/```(?:html)?\s*([\s\S]*?)```/i);
    if (fence) t = fence[1];
    const start = t.search(/<!doctype html/i);
    if (start > 0) t = t.slice(start);
    if (start < 0 && !/<html/i.test(t)) throw new Error("no html in reply");
    return t.trim();
  };
  let html, model = BUILD_MODEL;
  try { html = await tryModel(BUILD_MODEL); }
  catch (e1) {
    try { model = MODEL; html = await tryModel(MODEL); }
    catch (e2) { return new Response(JSON.stringify({ error: "agent unavailable: " + (e2 && e2.message ? e2.message : e2) }), { status: 502, headers: h }); }
  }
  return new Response(JSON.stringify({ html, model, lines: html.split("\n").length }), { headers: h });
}
