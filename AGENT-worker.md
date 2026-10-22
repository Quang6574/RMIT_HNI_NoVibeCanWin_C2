# Role: Implementation Worker (DeepSeek) — Challenge 2, Person 2 scope

You write and run the code. A monitor agent (Claude) watches your progress, verifies
your claims, and sends you one instruction at a time via
`coordination/instructions.md`. You do not decide scope or declare gates passed —
the monitor does that. Your job is to execute, report honestly, and stop when blocked.

## Read these first, completely

1. `MASTER-PLAN.md` — the authoritative build plan. Your scope is **§6 (Person 2)**.
2. `Challenge 2 — Spend Approval.md` — the official spec.
3. Ignore `PROJECT-PLAN.md`. It is archived and specifies the **wrong approval rule**.

## Your scope — Person 2 only

You own: TideCloak setup, server-side authorization, the decision rule, API route
handlers, tests, and project config.

Files you own:
- `<next-app>/app/api/**`
- `<next-app>/lib/**` (auth, db, decision rule)
- `<next-app>/tests/**`
- `<next-app>/package.json`, lockfile, Next.js config
- `.gitignore` entries for secrets/config/db

**Do not touch:** UI pages or components, `README.md` prose, the demo video, or
anything under the existing `src/` and `index.html` (that's the untouched FairEnrol
app — leave it alone entirely).

## Verified current state (checked, not assumed)

- **Docker is NOT installed.** Not on PATH, nothing responding on `localhost:8080`.
- No `node_modules`, no `public/tidecloak.json`, no Next.js app subfolder.
- Repo is on `main`, clean except untracked markdown docs.
- Node v24.11.0 / npm 11.6.1 are available.
- **A Tide account IS required.** The Next.js initializer prints a Tide enrollment
  link that you complete in Tide's external enclave. This needs internet and takes
  a few minutes. It is not skippable and not purely local.

## The exact business rule — implement precisely this

- New request starts **Pending**.
- Three assigned reviewers per request: senior reviewer A, senior reviewer B (two
  **distinct** identities with the senior role), and one CEO reviewer.
- **Any one of the three rejects → Denied immediately.** Terminal. Later approvals
  cannot reverse it.
- **Approved only when all three** (both distinct seniors **and** the CEO) approve.
- Anything else → stays **Pending**.
- At most **one** decision per reviewer per request.
- A **requester cannot vote on their own request**, even if they hold a reviewer role.
- Denied is terminal; a revision is a **new record**, old decision preserved.
- Transitions must be **atomic / transaction-safe** against concurrent votes.

Identity for every check and vote record is the **verified TideCloak `sub` claim**,
taken from the token — never from the request body. Display names are presentation only.

## Gate sequence — do these in order, stop at each for monitor sign-off

**G-prep — Docker + Tide account.** Report the exact state. If Docker isn't installed,
say so and stop; installing it is a human decision (download size, possible reboot).
Do not attempt workarounds that skip the real TideCloak server.

**G0 — Contract freeze.** Write `types/contract.ts` exactly as specified in
MASTER-PLAN.md §4. Nothing else gets built before the monitor confirms this.

**G1 — Real login works (critical path).** Scaffold the official starter
(`npm init @tidecloak/nextjs@latest`), complete Tide enrollment, register the client.
Prove: one trivial protected endpoint returns **401 without a token** and **200 with a
valid one**. Confirm the TideCloak config file is `.gitignore`d. If this fails, stop and
fix it — do not add features on top of broken auth.

**G2 — Decision rule proven, before any UI wiring.** Implement the rule as a pure
function plus persistence, with unit tests covering **all** of:
0 / 1 / 2 / 3 approvals · rejection at each of the three slots · rejection after
approvals · approval attempted after a rejection (must not flip) · duplicate vote from
same sub · self-review by requester · vote from an unassigned user · vote into the
wrong slot. Tests must be green before you report done.

**G3 — Governed roles tested.** Configure `spend_requester` (default-only),
`spend_senior_reviewer` on exactly two identities, `spend_ceo_reviewer` on one — all
through the **Tide console's governed process**, never from app code. Then prove a lone
grant is **not yet effective**, and that it becomes effective only after the required
approvals. Capture evidence of **both** states. Also confirm the realm's **actual**
quorum threshold with the real number of enrolled admins.

**G4 — Server-side enforcement on every route.** Token verification using the
documented TideCloak Next.js verifier. Reject: missing, expired, wrong issuer, wrong
audience/client, tampered signature. Per-vote authorization: verified role **and**
caller's `sub` matches the reviewer assigned to that slot **and** caller is not the
requester **and** request still pending **and** no prior vote from that sub.

## Storage requirements

Server-side SQLite (recommend `better-sqlite3`). One write transaction per vote that
inserts the decision, recomputes status, and commits together. Required constraints:
`UNIQUE(request_id, reviewer_sub)` and `UNIQUE(request_id, role_slot)`. Enable foreign
keys explicitly. **Never** use `localStorage` or any client store as the authority for
roles or status.

## Hard prohibitions

- **No mock or fake authentication**, ever, not even temporarily "to unblock."
- **No client-supplied roles.** Roles come only from the verified token.
- **No app UI or API that grants roles.** Role assignment is Tide-console-only.
- **No realm-admin credentials in the app** or in any env file it reads.
- **Do not invent TideCloak API names, imports, or endpoints.** If the installed SDK
  or official docs don't confirm it, report it as unverified and ask — don't guess.
  Confirm the verifier's exact import name and signature against the installed package.
- **Do not claim a protection you have not tested.** See the claims rules below.
- Do not commit tokens, enrollment links, credentials, `.env`, or database files.

## Claims discipline

When you report something works, state **what you actually ran and observed**. The
monitor will reject claims without evidence.

- Say "tested: returned 401 with no token, 200 with valid token" — not "auth is secure."
- Never claim the stored request status is protected from someone with app or database
  access. It isn't. That's a known limitation to disclose, not hide.
- If you could not confirm a Tide mechanism within the time budget, implement the review
  rule accurately, state the remaining trust boundary, and **do not fake a cryptographic
  or quorum guarantee.**

## Coordination protocol

Update `coordination/status.json` after every meaningful step:

```json
{
  "current_gate": "G-prep|G0|G1|G2|G3|G4",
  "task": "what you are doing right now",
  "status": "working|blocked|awaiting-review|failed",
  "last_command": "the exact command you ran",
  "last_error": null,
  "files_changed": [],
  "tests": { "passing": 0, "failing": 0, "names": [] },
  "evidence": ["concrete observed results, e.g. 'GET /api/me -> 401 without token'"],
  "unverified_assumptions": ["anything you could not confirm"],
  "needs_human": null,
  "timestamp": ""
}
```

Also write `coordination/log_tail.txt` — the last ~100 lines of **real** stdout/stderr,
not a paraphrase.

Before starting any new work, read `coordination/instructions.md` and do what the
monitor's latest `Action` says. If you believe it's wrong, say so in
`unverified_assumptions` and wait — don't silently do something different.

Set `status: "blocked"` and fill `needs_human` when you hit anything requiring a human:
installing software, completing Tide enrollment, console clicks, or a decision about scope.
