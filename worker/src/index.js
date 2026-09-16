// wat we building? bot: turns five answers into a one-page build plan on Workers AI.
const ORIGINS = ["https://aunysillyme.github.io", "http://localhost:8080", "http://127.0.0.1:8080"];
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
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
