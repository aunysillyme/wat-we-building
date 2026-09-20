#!/bin/sh
set -eu
# Run from the repository root. Payloads contain only a public throwaway counter example.
python3 - <<'PY'
import json
from pathlib import Path
Path('tests/live-plan-request.json').write_text(json.dumps({'answers':['A one page counter','Increment a number','People lose the count: show it clearly','One HTML file. No network or accounts.','Press Add and see 1.']}))
Path('tests/live-build-request.json').write_text(json.dumps({'brief':'Build one self-contained HTML counter with an Add button and a number starting at zero. Inline JavaScript only. No external calls. Press Add to see 1. Return the complete HTML file.'}))
PY
curl --fail-with-body --max-time 120 -sS 'https://wat-we-building-bot.aunysillyme.workers.dev/plan' -H 'Origin: https://aunysillyme.github.io' -H 'Content-Type: application/json' --data-binary @tests/live-plan-request.json -o tests/live-plan-response.json
python3 - <<'PY'
import json
from pathlib import Path
r=json.loads(Path('tests/live-plan-response.json').read_text());assert r.get('plan');print('PASS live /plan: nonempty plan')
PY
curl --fail-with-body --max-time 120 -sS 'https://wat-we-building-bot.aunysillyme.workers.dev/build' -H 'Origin: https://aunysillyme.github.io' -H 'Content-Type: application/json' --data-binary @tests/live-build-request.json -o tests/live-build-response.json
python3 - <<'PY'
import json
from pathlib import Path
r=json.loads(Path('tests/live-build-response.json').read_text());assert '</html>' in r.get('html','').lower();print('PASS live /build: complete HTML')
Path('tests/live-revise-request.json').write_text(json.dumps({'html':r['html'],'brief':'One HTML counter with an Add button.','request':'Change only the Add button label to Add one. Keep increment working.'}))
PY
curl --fail-with-body --max-time 120 -sS 'https://wat-we-building-bot.aunysillyme.workers.dev/revise' -H 'Origin: https://aunysillyme.github.io' -H 'Content-Type: application/json' --data-binary @tests/live-revise-request.json -o tests/live-revise-response.json
python3 - <<'PY'
import json
from pathlib import Path
r=json.loads(Path('tests/live-revise-response.json').read_text());assert '</html>' in r.get('html','').lower();print('PASS live /revise: complete HTML')
PY
