# Validation evidence

Checked 22 October 2026 on Windows, Node 22.14.0, Next.js 16.4.2 and Tide SDK/verifier 0.13.33. Local branch: `codex/person-2-starter`; no GitHub push is implied.

## Executed

- `npm test`: **20 tests passed, 0 failed**, plus **8/8 shared display fixtures**. Tests contain synthetic actors and ephemeral keys only; the running app has no test authentication path.
- Rules: zero/one/two/three approvals, rejection at every slot, rejection after approvals, terminal denial, self-review, unassigned subject, wrong role/slot, duplicate votes, read scoping and invalid reviewer configuration.
- Token verification: actual cryptographic signatures, expected issuer, `azp`, audience, expiry and subject; malformed, expired, wrong-key, tampered and unsupported-algorithm tokens rejected. Another client's roles do not grant authority here.
- JSON boundary: wrong media type, malformed JSON, oversized streamed body without content-length, unknown authority fields and invalid amounts/lengths.
- SQLite: persistence after reopening; atomic audit/status/decision commit; rollback under an injected failure; separate concurrent connections attempting duplicate votes, distinct approvals and mixed approval/rejection.
- UI transport: fresh token lookup for each call, bearer header, cookies omitted, no identity fields invented, encoded IDs, API error mapping and network/non-JSON handling.
- Production compilation and TypeScript checking passed for the integrated app.
- Live HTTP: all five spending endpoints return **401** without a token; `/api/me` returns **401** for an invalid bearer token.
- Real existing Tide session: the integrated UI displayed the server-verified username and an empty scoped request list. Current audience-enforced identity/list calls succeeded. No fake account selector or fixture adapter is present in the integrated app.
- Live permission negative: a $1.00 fictional test submitted by the signed-in account without `spend_requester` was refused with **403**. No request was created. [Screenshot](../demo/evidence/live-missing-role.png).
- Local `.env.local` contains the three existing reviewer user IDs. Adapter configuration, environment files, SQLite/WAL data, dependencies and build output are ignored by Git.

## Not yet established

- Four-account enrollment and actual spending roles in live tokens. The user records exist; the last realm-role inspection found no configured spending roles.
- Live successful create/vote flows, below-quorum and at-quorum role effectiveness, alternate grant paths, PKCE enforcement and revocation latency.
- Independent human control of reviewer/governance accounts. One person operating four demo identities demonstrates application behavior, not independent real-world review.
- A completed Challenge 2 recording or production deployment.

See [REMAINING.md](REMAINING.md) for the ordered live checks. Automated tests do not substitute for this evidence.

## Accepted limits

App/database operators can rewrite decisions and audit records. A malicious authorized governance quorum can grant roles; legitimate reviewers can collude. Removed roles can remain in unexpired tokens. Node's SQLite module is experimental on this tested Node 22 version. A single app instance and persistent local disk are required; queue scans are suitable for the small demo, not large-volume deployment.
