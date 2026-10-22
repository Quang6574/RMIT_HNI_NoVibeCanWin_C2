# Validation evidence

Checked 22 October 2026 on Windows, Node 22.14.0, Next.js 16.4.2 and Tide SDK/verifier 0.13.33. Local branch: `codex/person-2-starter`; no GitHub push is implied.

## Executed

- `npm test`: **27 tests passed, 0 failed**, plus **8/8 shared display fixtures**. Cryptographic test keys are never accepted by the live app. The separately enabled local simulation uses four declared demo identities, never fake bearer tokens.
- Rules: zero/one/two/three approvals, rejection at every slot, rejection after approvals, terminal denial, self-review, unassigned subject, wrong role/slot, duplicate votes, read scoping and invalid reviewer configuration.
- Token verification: actual cryptographic signatures, expected issuer, `azp`, audience, expiry and subject; malformed, expired, wrong-key, tampered and unsupported-algorithm tokens rejected. Another client's roles do not grant authority here.
- JSON boundary: wrong media type, malformed JSON, oversized streamed body without content-length, unknown authority fields and invalid amounts/lengths.
- SQLite: persistence after reopening; atomic audit/status/decision commit; rollback under an injected failure; separate concurrent connections attempting duplicate votes, distinct approvals and mixed approval/rejection.
- UI transport: fresh token lookup for each call, bearer header, cookies omitted, no identity fields invented, encoded IDs, API error mapping and network/non-JSON handling.
- Production compilation and TypeScript checking passed for the integrated app.
- Live HTTP: all five spending endpoints return **401** without a token; `/api/me` returns **401** for an invalid bearer token.
- Real existing Tide session: before the reported outage, the integrated UI displayed the server-verified username and an empty scoped request list. Audience-enforced identity/list calls succeeded. Live mode has no identity selector or fixture fallback.
- Live permission negative: a $1.00 fictional test submitted by the signed-in account without `spend_requester` was refused with **403**. No request was created. [Screenshot](../demo/evidence/live-missing-role.png).
- Local `.env.local` contains the three existing reviewer user IDs. Adapter configuration, environment files, SQLite/WAL data, dependencies and build output are ignored by Git.
- Simulation browser run: submitted two requests through the actual UI. One stayed pending at one and two approvals, then became approved at the CEO's third approval. The second stayed pending after both senior approvals and became denied on the CEO's rejection. The simulation disclosure remained visible.
- Direct requests to the running demo returned 403 for requester self-review and the wrong reviewer slot, and 409 for duplicate/final votes and approval after denial. Both stored histories remained at exactly three decisions.
- Restarted the demo process: both request outcomes and histories persisted. The demo database contained two requests; the live database still contained zero. Live port 3000 refused a demo identity with 401. Missing and unknown demo identities returned 401, and a cross-origin demo request returned 403.
- A cached store could previously throw an error from a different development module instance, causing a policy refusal to appear as 500. Added a stable error brand, a module-reload regression test and verified 403/409 responses against the running server after restart.

Simulation screenshots: [three approvals](../demo/evidence/simulation-approved.png), [request list](../demo/evidence/simulation-workspace.png). These are simulated identity sessions, not live Tide verification evidence.

## Not yet established

The user explicitly approved a local simulation after relaying updated organizer guidance during Tide network congestion. In that mode, identity verification and governance are simulated; decision rules, validation, transactions and persistence run on the real application backend. The banner discloses this on every screen. Live mode is still the default.

Simulation checks cover exact opt-in, production-disabled behavior, loopback port 3001, same-origin restrictions, missing/unknown/mixed identities, refusal of demo headers by live authentication, separate database paths and reviewer assignments, and successful use without a Tide adapter file. No automatic fallback from failed real authentication exists.

- Four-account enrollment and actual spending roles in live tokens. The user records exist; the last realm-role inspection found no configured spending roles.
- Live successful create/vote flows, below-quorum and at-quorum role effectiveness, alternate grant paths, PKCE enforcement and revocation latency.
- Independent human control of reviewer/governance accounts. One person operating four demo identities demonstrates application behavior, not independent real-world review.
- A completed Challenge 2 recording or production deployment.

See [REMAINING.md](REMAINING.md) for the ordered live checks. Automated tests do not substitute for this evidence.

## Accepted limits

App/database operators can rewrite decisions and audit records. A malicious authorized governance quorum can grant roles; legitimate reviewers can collude. Removed roles can remain in unexpired tokens. Node's SQLite module is experimental on this tested Node 22 version. A single app instance and persistent local disk are required; queue scans are suitable for the small demo, not large-volume deployment.
