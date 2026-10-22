# Handoff from Person 1 → Person 2

> Simulation update: the user explicitly approved the organizer's network-congestion workaround. `npm run demo` in `spend-approval/` now runs a labelled four-identity simulation on localhost:3001, using the real decision backend and separate data. Real Tide verification remains the default on the live app. See `demo/SIMULATION-DEMO.md` and the validation report.

> Integration update, 22 October 2026: the live application now resides in `spend-approval/`, with real bearer-authenticated APIs and SQLite. The sandbox remains a development reference. See `spend-approval/SECURITY-TESTS.md` and `spend-approval/REMAINING.md` for current evidence and outstanding live checks. The historical handoff below describes Person 1's delivery before integration.

**Status as of 2026-10-22.** Person 1's scope is built: a working UI sandbox, the frozen
contract, verified display logic, fixtures, and the demo plan. **Nothing has ever been run
against a real server or a real login** — Person 1 has no Docker. Integration is yours.

---

## 1. What you are receiving

| Path | What it is | Verified |
|---|---|---|
| `contract.ts` | **Frozen** shared contract, types only. | Field-for-field against `MASTER-PLAN.md` §4. You agreed to it. |
| `lib-ui/explain-status.ts` | Display-only module: request → progress + plain-language explanation. | 8/8 fixtures byte-exact, plus 13 edge/regression cases. See §3. |
| `ui-sandbox/` | Next.js 16.4.2 / React 19.3.0 UI with all five screens and the API seam. | `next build` passes, TypeScript clean, `eslint` clean. See §4. |
| `fixtures/spend-requests.json` | 8 synthetic requests covering every approval state. | Each carries `expectedStatus`/`expectedProgress`/`expectedExplanation`. Reusable as server-side test data. |
| `demo/DEMO-SCRIPT.md` | 9-beat, 120-second plan with hard preconditions and a "do not say or show" list. | Beat sheet sums to exactly 120s. |
| `README.md` | Five-prompt overview (296 words) + honest limitations. | Word count independently re-measured. |
| `.mcp.json` | Tide agent-pack MCP (`@tideorg/mcp` v1.9.33). | Restart Claude Code and approve the trust prompt to load it. |

---

## 2. What is NOT done

- **No integration.** The UI has never talked to a real server.
- **No TideCloak anywhere in `ui-sandbox/`** — no auth library, no login, by design.
- **No demo video.** (`Video.mp4` at the repo root is an unrelated pre-existing file.)
- **No server-side anything** — that is your half: API routes, token verification, governed
  roles, the atomic decision write, and the negative tests.
- **Browser rendering was not independently verified.** Build, typecheck, lint and the
  fixture checks pass, and the binding rules were confirmed by code inspection, but nobody
  has signed off on the rendered pixels.

---

## 3. `lib-ui/explain-status.ts`

Pure and display-only. Never decides, gates, persists, or authorizes. No `fetch`, no
`localStorage`, no status writes.

```ts
explainStatus(request: SpendRequest) =>
  { progress, explanation, derivedStatus, matchesServerStatus }
```

Encodes the exact rule: any `reject` is terminal and outranks every approval in any order
or timestamp; approval needs all three distinct slots; the CEO never substitutes for a
senior; a decision whose `reviewerSub` is not the sub assigned to that slot is **not
counted**; duplicates collapse per slot with reject beating approve.

**Verified independently:** 8/8 fixtures byte-identical; terminal denial survives array
reversal; an approval timestamped exactly equal to the rejection is described, not dropped;
wrong-sub votes ignored; degrades without throwing on an out-of-contract status string,
missing `assignedReviewers`, and `undefined` decisions.

**Binding rule, implemented in the UI:** the badge renders `request.status` **from the
server**, never `derivedStatus`. `matchesServerStatus` exists so a disagreement between the
server's status and the decision log is **surfaced visibly** rather than silently resolved.

---

## 4. The UI sandbox — structure and how to port it

```
ui-sandbox/
  app/page.tsx                        request list
  app/requests/[id]/page.tsx          request detail (+ RequestDetailClient.tsx)
  app/requests/new/page.tsx           new request form
  app/state-lab/page.tsx              SANDBOX ONLY - error-state lab
  components/   AppHeader, StatusBadge, ReviewerProgress,
                DecisionResultPanel, ReviewerControls,
                NewRequestForm, ApiErrorNotice
  lib-ui/api-client.ts                the ONLY place the UI touches data
  lib-ui/slots.ts                     slot labels/state, money and date helpers
  types/contract.ts                   re-export shim -> ../../contract
  lib-ui/explain-status.ts            re-export shim -> ../../lib-ui/explain-status
```

**Single canonical source.** The two shims are one-line `export * from` re-exports, and the
fixtures are imported from the canonical `../../fixtures/spend-requests.json`. There are no
duplicate copies to drift. (An earlier hard-link approach was rejected because git does not
preserve hard links — a clone would have produced two independent files.)

### The integration switch

`lib-ui/api-client.ts` is the only module that touches data. Components never call `fetch`
and never read fixtures. It already contains a `fetch` adapter targeting **your** endpoints:

```
GET  /api/me
GET  /api/requests
GET  /api/requests/:id
POST /api/requests
POST /api/requests/:id/decisions
```

**To integrate, change one line:**

```ts
export const DATA_SOURCE: DataSource = 'fixtures';   // -> 'fetch'
```

No component should need to change. If one does, the seam has been bypassed — fix that
rather than working around it.

### Stub-only machinery — delete at integration

| Thing | Why it must go |
|---|---|
| `setActingSub` / `ACTING_SUB_EVENT` | In-memory viewer switcher. Real identity comes from the verified token, server-side. |
| `forceError` option | Injects fake error codes for the state lab. |
| `app/state-lab/` | Sandbox-only error demo page. |
| `fixtures/divergent-status.json` (`r-ui-900`) | Sandbox-only fixture proving the mismatch warning. |
| The `fixtures` adapter in `api-client.ts` | Replaced by the `fetch` adapter. |
| The `SANDBOX STUB` banner in `AppHeader` | Must not survive into the demo. |

### Error states already built

`ApiErrorNotice` renders a distinct, deliberate state for **401, 403, 404, 409, 422**. A
403 is treated as a normal expected outcome, not a crash. Wire your real codes to these.

### Integration risks to check early

1. **Framework version.** Sandbox is Next **16.4.2** / React **19.3.0**. Your TideCloak
   starter pins its own. If it is older, App Router APIs may differ. Confirm before porting.
2. **Client components.** The screens are client-side, so they cannot call
   token-authenticated server code directly. The API seam absorbs much of this, but plan
   for it — you may want server components fetching with the token and passing data down.
3. **Scoping difference.** The fixture adapter returns **all** requests regardless of
   viewer; your real API must scope by identity (requester sees own, reviewer sees their
   queue). Do not assume the sandbox's behaviour is the target behaviour.
4. **Multiple lockfiles.** Next warns that it infers the workspace root from the repo-root
   lockfile. Harmless in the sandbox; set `turbopack.root` if it bothers you.
5. **npm audit** reports 5 high-severity findings from `create-next-app`. Left alone
   deliberately — `npm audit fix` can bump majors and break the build, and the sandbox is
   never deployed. Your app's dependencies are a separate question.

---

## 5. The contract you implement server-side

| Method & path | Who | Behaviour |
|---|---|---|
| `GET /api/me` | any valid token | caller's sub, display name, effective roles |
| `GET /api/requests` | valid token | requester sees own; reviewers see their queue |
| `POST /api/requests` | `spend_requester` | requester derived **from token**, not body |
| `GET /api/requests/:id` | owner or assigned reviewer | object-level access check |
| `POST /api/requests/:id/decisions` | assigned reviewer for that slot | verify role + assigned sub + pending + no prior vote + not requester; atomic; recompute status |

Errors: `401` invalid/missing token · `403` insufficient role, not the assigned reviewer, or
self-review · `404` not found/not visible · `409` duplicate vote or already terminal ·
`422` invalid input.

**The business rule, exactly:** three assigned reviewers — two **distinct** seniors and one
CEO. Any one rejection → **Denied immediately and terminally**; later approvals cannot
reverse it. **Approved only when all three approve.** Otherwise Pending. One decision per
reviewer. A requester cannot vote on their own request. Transitions atomic against
concurrent votes.

---

## 6. Open items

1. **Fixture `sub` values are stand-ins** (`senior_reviewer_01`, `ceo_reviewer_01`, …), not
   real TideCloak `sub` claims. Reconcile with your realm before reusing the fixtures.
2. **`r-007` is deliberately inconsistent** — a rejection followed by two recorded
   approvals. A correct server returns `409` for a vote after denial and would never persist
   that shape. It exists only to prove the UI reads it as finally denied. Not a valid server
   state.
3. **Nothing here is type-checked against your app's tsconfig.** The sandbox typechecks
   clean on its own.
4. **Agree who records the demo.** Person 1 cannot run TideCloak locally, so either expose
   yours through a tunnel or record on your machine. See `demo/DEMO-SCRIPT.md` — it must not
   be recorded until its preconditions are true.

---

## 7. Claims discipline — please keep this

The README's limitations section and the demo script's "do not say or show" list were
written deliberately. This challenge is judged partly on honesty about what TideCloak
actually protects.

**May be claimed, once tested:** identity is verified by TideCloak; reviewer authority comes
from a governed role that one administrator could not make effective alone **in our tested
realm**; the app enforces the three-reviewer rule **server-side** against verified identities.

**Must not be claimed:** that the UI prevents unauthorised actions — it does not, and it was
built on the explicit assumption that the server is the only gate; that the stored status is
immune to an app or database operator (it is a normal database field); that role changes are
quorum-protected, until the real realm quorum has been tested.

If a protection cannot be confirmed and tested in time, implement the rule accurately,
disclose the trust boundary, and do not fake a cryptographic or quorum guarantee.
