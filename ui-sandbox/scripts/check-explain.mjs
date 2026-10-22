import fs from 'node:fs';
// Node's ESM resolver does not follow the extensionless re-export shim that Turbopack
// resolves. Import the canonical module directly here; the app imports the shim.
import { explainStatus } from '../../lib-ui/explain-status.ts';

const data = JSON.parse(fs.readFileSync(new URL('../../fixtures/spend-requests.json', import.meta.url), 'utf8'));
let passed = 0;
let failed = 0;

for (const scenario of data.scenarios) {
  const got = explainStatus(scenario.request);
  const progressOk = got.progress === scenario.expectedProgress;
  const explanationOk = got.explanation === scenario.expectedExplanation;
  const consistencyOk = got.derivedStatus === scenario.request.status && got.matchesServerStatus === true;
  const ok = progressOk && explanationOk && consistencyOk;
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? 'MATCH' : 'MISMATCH'} ${scenario.fixtureId} | progress=${JSON.stringify(got.progress)} | derivedStatus=${got.derivedStatus} | matchesServerStatus=${got.matchesServerStatus}`);
  console.log(`  explanation: ${JSON.stringify(got.explanation)}`);
  if (!progressOk) console.log(`  expected progress: ${JSON.stringify(scenario.expectedProgress)}`);
  if (!explanationOk) console.log(`  expected explanation: ${JSON.stringify(scenario.expectedExplanation)}`);
}

console.log(`RESULT: ${passed} matched, ${failed} failed, ${data.scenarios.length} fixtures`);
if (failed > 0) process.exitCode = 1;
