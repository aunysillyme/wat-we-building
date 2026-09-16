# wat we building?

Five questions to answer before your AI builds anything. Answer them, copy the brief, paste it as the first message to any coding agent.

Live: https://aunysillyme.github.io/wat-we-building/

Built live in 30 minutes for CampAI Season 2 Episode 15 ("teach someone how to code with AI agents") with Claude Code (Claude Fable 5.1). One HTML file, no framework, no build step, no accounts. Answers stay in your browser (localStorage).

The five questions are the first five steps of the build method in Auny's vault, cut to what a beginner needs:

1. Finish line: what exists when it's done
2. Must-dos: every clause of the ask, as a list you walk before shipping
3. Angle: the obvious version, and what actually goes wrong
4. The box: the stack, and what it is not allowed to need
5. Proof: what you open cold and do to call it working

## The bot

`worker/` is a Cloudflare Worker on Workers AI (`@cf/meta/llama-3.1-8b-instruct-fast`, free tier). `POST /plan` with the five answers returns a one-page build plan: name, finish line, must-dos as tests, angle, box, build order, proof walk, what will sink it, and the first message to paste to your agent. Live at `https://wat-we-building-bot.aunysillyme.workers.dev`. Deploy with `cd worker && npx wrangler deploy`.
