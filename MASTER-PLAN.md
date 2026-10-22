# Master Plan — Spend Approval (RMIT Hackathon 2026, Challenge 2)

Authoritative build plan for the two-person team. Supersedes `PROJECT-PLAN.md`.

> Update, 22 October 2026: the user relayed organizer guidance permitting simulated Tide protections during network congestion and explicitly requested local simulation. The implementation in `spend-approval/` supports a clearly labelled, opt-in simulation on localhost:3001, with four fixed demo identities and separate SQLite data. Live Tide verification remains the default and is never silently bypassed on failure. This supersedes the earlier prohibition on a disclosed simulation for this prototype; the approval rule and server-side decision checks below remain unchanged. Simulated identity/governance is not evidence of live Tide security or independent quorum protection.

---

## 0. Locked decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **Build on the official TideCloak Next.js starter**, in a new subfolder (`app/` — name TBD by Person 2). | The challenge requires *server-side* authorization. The current Vite app has no backend at all, and the documented TideCloak server-side verifier is the Next.js path. Avoids inventing an unsupported verification approach. |
| D2 | **`PROJECT-PLAN.md` is archived — do not build from it.** | It specifies a different rule (department manager + finance manager, 2 approvers, no CEO). Following it would silently break our required rule. Its threat-model section may still be *read* for README honesty material. |
| D3 | **Existing FairEnrol app (`src/`, `index.html`, `vite.config.js`) stays untouched.** | The spec says don't overwrite existing work. It's a different domain (course enrolment) and is explicitly client-side-simulated, so nothing in it is reusable for the decision logic. Styling may be copied *out* of it by Person 1 if useful. |
| D4 | **No real payments, no real bank data, synthetic identities only.** | Spec requirement. |

### Superseded / conflicting docs

- `PROJECT-PLAN.md` → **archived**, wrong approval rule.
- `Challenge 2 — Spend Approval.md` → **authoritative spec**.
- `RMIT Hackathon 2026 — Challenge 2_ UNLOCKED.md` → **authoritative general challenge brief**.

---

## 1. The exact business rule — non-negotiable

Implement precisely this. No variations, no "simplified for demo" shortcuts.

- A new request starts **Pending**.
- Three reviewers are assigned per request: **senior reviewer A**, **senior reviewer B** (two *distinct* identities holding the senior-reviewer role), and **one CEO reviewer**.
- **Any one of the three rejects → Denied immediately.** Terminal. Later approvals cannot reverse it.
- **Approved only when all three** — both distinct senior reviewers *and* the CEO reviewer — have approved.
- Any other state → stays **Pending**.
- Each reviewer may cast **at most one** decision per request.
- A **requester cannot vote on their own request**, even if they hold a reviewer role.
- **Denied is terminal.** A revised request is a *new record*; the old decision is preserved.
- State transitions must be **atomic / transaction-safe** so concurrent votes cannot produce an invalid final state.

Identity for every authorization check and vote record is the **verified TideCloak `sub` claim**. Display names are presentation only, never authorization input.

---

## 2. Target architecture

```
RMIT_HNI_NoVibeCanWin_C2/
├─ src/, index.html, vite.config.js   # FairEnrol — DO NOT TOUCH (D3)
├─ MASTER-PLAN.md                     # this file
├─ PROJECT-PLAN.md                    # archived, do not follow
└─ <next-app>/                        # NEW — the Challenge 2 prototype
   ├─ app/                            # Next.js routes + UI  (Person 1 owns UI files)
   │  └─ api/                         # route handlers       (Person 2 owns)
   ├─ lib/                            # auth + decision rule (Person 2 owns)
   ├─ tests/                          # unit + negative tests(Person 2 owns)
   └─ types/contract.ts               # SHARED — agreed before coding
```

**Storage:** server-side SQLite (recommended: `better-sqlite3`) with one write transaction per vote. Required constraints: `UNIQUE(request_id, reviewer_sub)` and `UNIQUE(request_id, role_slot)`. **Never** `localStorage` as the authority for roles or status.

---

## 3. Role & identity model

App role names (ours, not TideCloak built-ins):

| Role | Granted to | Powers |
|---|---|---|
| `spend_requester` | staff identities | create requests, view own |
| `spend_senior_reviewer` | exactly **2** distinct identities | one vote each, in a senior slot |
| `spend_ceo_reviewer` | exactly **1** identity | one vote, in the CEO slot |

Hard rules:
- **New accounts get no reviewer role by default** — requester-only.
- Reviewer roles are assigned **only** through the TideCloak console's governed process (QEA), never by an app screen or app API.
- The app **must not** hold realm-admin credentials and **must not** expose any role-granting endpoint.
- The app checks **both** the governed role **and** that the caller's `sub` is the identity actually assigned to that slot on that request.

Demo identities to provision (synthetic): `staff_requester_01`, `senior_reviewer_01`, `senior_reviewer_02`, `ceo_reviewer_01`.

---

## 4. Shared contract — agree before either person writes code

This is the only file both people touch. Freeze it first.

### Types

```ts
type RoleSlot = 'senior_a' | 'senior_b' | 'ceo';
type Vote     = 'approve' | 'reject';
type Status   = 'pending' | 'approved' | 'denied';

type SpendRequest = {
  id: string;
  title: string;
  amountMinor: number;        // integer minor units (cents). never a float
  currency: string;           // 'USD' for P0
  category: string;
  businessReason: string;
  requesterSub: string;       // verified TideCloak sub
  createdAt: string;          // ISO 8601
  assignedReviewers: Record<RoleSlot, string>;  // slot -> reviewer sub
  decisions: Decision[];
  status: Status;
};

type Decision = {
  requestId: string;
  reviewerSub: string;        // verified sub, from token — never from body
  roleSlot: RoleSlot;
  vote: Vote;
  comment?: string;
  decidedAt: string;
};
```

### Endpoints

| Method & path | Who | Behaviour | Returns |
|---|---|---|---|
| `GET /api/me` | any valid token | caller's sub, display name, effective roles | 200 / 401 |
| `GET /api/requests` | valid token | requester sees own; reviewers see their queue | 200 scoped list |
| `POST /api/requests` | `spend_requester` | requester derived **from token**, not body | 201 pending request |
| `GET /api/requests/:id` | owner or assigned reviewer | object-level access check | 200 / 404 |
| `POST /api/requests/:id/decisions` | assigned reviewer for that slot | verify role + assigned sub + pending + no prior vote + not requester; atomic write; recompute status | 200 new status / 403 / 409 |

### Error codes

`401` invalid or missing token · `403` insufficient role, not the assigned reviewer, or self-review · `404` not found / not visible · `409` duplicate vote or already terminal · `422` invalid input.

Every mutation validates shape and length server-side and **rejects unknown fields**. No `PATCH`, no role-grant endpoint, no admin proxy.

---

## 5. Person 1 — UI & demo flow

### Deliverables

1. **Request list** — title, amount, requester, status, reviewer progress (e.g. "1 of 3 approved").
2. **New request form** — title, amount, currency, category, business reason.
3. **Request detail** — full request info + each assigned reviewer's state (pending / approved / rejected).
4. **Reviewer controls** — approve / reject + optional short comment. Shown only to eligible reviewers *as a convenience*; the server is the real gate.
5. **Decision result panel** — plain-language explanation of *why* a request is pending, denied, or approved (e.g. "Senior reviewer B hasn't voted yet", "Rejected by the CEO reviewer — this is final").
6. **Synthetic fixtures** — demo requests and identity labels consistent with the real TideCloak logins.
7. **README five-prompt overview**, ≤300 words, setup instructions in a separate section.
8. **Two-minute MP4 demo**, under 100 MB (target under 50 MB), committed to the repo.

### Owns these files

- `<next-app>/app/**` page/component/layout files (everything except `app/api/**`)
- `<next-app>/public/**` static assets (except `tidecloak.json`)
- styling / CSS
- fixture data files
- `README.md`
- demo script + `demo/demo.mp4`

### Must not touch

`app/api/**` · `lib/**` · `tests/**` · TideCloak config or realm setup · anything that decides authorization.

### While waiting for Person 2's API

Build against a clearly-labelled local stub that satisfies the contract. **Label it as a stub in the UI during development and remove it before the demo.** Never present a stub or mock login as TideCloak protection — the spec forbids this explicitly, and judges are told to look for it.

---

## 6. Person 2 — TideCloak, server-side authorization, decision logic

### Deliverables

1. **TideCloak running + app registered.** Docker container up, client registered, config downloaded to the Next.js app's expected location, real login working end-to-end. Confirm the config file is `.gitignore`d.
2. **Governed roles configured in the Tide console** — `spend_requester` as default-only; senior role on exactly two identities; CEO role on one. Assignment done through QEA. **Verify the role is not effective before the required approvals**, and capture evidence of both states (before/after).
3. **Confirm the actual realm quorum** in our environment. Do not claim role changes are quorum-protected until tested with the real configured multi-admin quorum. A "pending" badge in a console is not proof.
4. **Decision-rule module + unit tests, written first**, before any UI wiring. Test matrix must cover: 0/1/2/3 approvals; rejection at each of the three slots; rejection after approvals; approval after a rejection (must not flip); duplicate vote; self-review; unassigned voter; wrong slot.
5. **Server-side token verification on every protected route** using the documented TideCloak Next.js verifier. Reject missing, expired, wrong-issuer, wrong-audience/client, and tampered-signature tokens. Confirm the exact verifier import and signature against the installed SDK — do not assume.
6. **Authorization checks per vote**: verified role **and** the caller's `sub` matches the reviewer assigned to that slot **and** caller is not the requester **and** request is still pending **and** no prior vote from that sub.
7. **Atomic persistence** — single write transaction inserting the decision, recomputing status, and committing together. Unique constraints as in §2. Concurrent votes must not produce an invalid state.
8. **Security findings write-up** — what was actually tested vs. what remains a limitation.

### Owns these files

- `<next-app>/app/api/**`
- `<next-app>/lib/**` (auth, db, decision rule)
- `<next-app>/tests/**`
- Next.js project config, `package.json`, lockfile
- TideCloak realm/client setup (console work, outside the repo)
- `.gitignore` entries for config/secrets/db

### Must not touch

UI pages/components · README overview prose · demo video.

### Hard prohibitions

No mock/fake authentication. No client-supplied roles. No app-side role granting. No inventing TideCloak API names or endpoints — if the docs or Tide's MCP don't confirm it, ask a mentor or don't use it. No claiming a protection that hasn't been tested.

---

## 7. Merge order & dependency gates

Times are relative — anchor T+0 to when you actually start, and verify the real venue deadline yourselves.

| Gate | Window | Who | Must be true to pass |
|---|---|---|---|
| **G0** Contract freeze | T+0 → T+0:20 | both | `types/contract.ts` agreed and committed. Nobody codes before this. |
| **G1** Real login works | T+0:20 → T+1:00 | P2 | A real TideCloak login succeeds and one trivial protected endpoint returns 401 without a token, 200 with one. **This is the critical path — if it fails, stop adding features and fix it.** |
| **G2** Decision rule proven | T+1:00 → T+2:00 | P2 | Unit tests green, including every negative case in §6.4. Rule is correct *before* it touches a UI. |
| **G2′** UI shell on stub | T+0:20 → T+2:00 (parallel) | P1 | All five screens render against the stub and match the contract. |
| **G3** Governed roles tested | T+1:00 → T+2:00 (parallel) | P2 | Lone grant is **ineffective**; after required approvals it becomes effective. Both states evidenced. |
| **G4** Integration | T+2:00 → T+3:00 | both | P1 swaps stub for the real API. One full end-to-end run with real logins: submit → three approvals → Approved. |
| **G5** Shared test pass | T+3:00 → T+3:45 | both | §8 checklist fully green. Any failure here blocks the demo claim, not just the feature. |
| **G6** Feature freeze | T+3:45 | both | No new features. README + video only. |
| **G7** Code freeze & record | T+3:45 → T+4:30 | P1 lead, P2 reviews | Demo recorded against the **frozen commit**. Narration matches tested reality. |
| **G8** Submit | T+4:30 → T+5:00 | both | Public repo + MP4 verified accessible by the other person. Reserve ≥30 min for upload/form problems. |

Parallelism rule: G2′ runs alongside G1–G3, but **real integration must happen by G4**. Do not discover at recording time that role claims are missing.

---

## 8. Shared test checklist — run together at G5

Straight from the spec's acceptance criteria. Test via **direct API calls**, not just the UI — a disabled button is not a security control.

- [ ] Requester can create a request but cannot vote, including on their own request.
- [ ] A fresh / newly created account has **no** reviewer access by default.
- [ ] An ordinary app admin cannot grant reviewer roles; assignment only via TideCloak governance, with the configured quorum verified.
- [ ] An unassigned user, or one without the correct verified role, gets a **server-side** denial from the vote endpoint.
- [ ] Only the two assigned senior identities and the one assigned CEO identity can cast their respective votes.
- [ ] One rejection → **Denied**, and later approvals cannot flip it.
- [ ] One approval → Pending. Two approvals → Pending. All three distinct approvals → **Approved**.
- [ ] Duplicate votes rejected (409, no second row written).
- [ ] Concurrent votes (parallel identical, parallel distinct, simultaneous reject+approve) cannot bypass the rule or produce two terminal states.
- [ ] Token negatives: missing, expired, wrong issuer, wrong audience/client, tampered signature → all denied, no data mutation.
- [ ] No tokens, enrollment links, admin credentials, `.env`, database files, or TideCloak local data committed to git — check working tree **and** history.
- [ ] Verify persistence, not just HTTP responses — inspect the database after each test.

---

## 9. Claims discipline — what we may and may not say

The README and video may claim **only** what we tested. Specifically:

**We can say** (once G1/G3 pass): a user's identity is verified by TideCloak; reviewer authority comes from a governed TideCloak role that one administrator could not make effective alone in our tested realm; the app enforces the three-reviewer rule server-side against verified identities.

**We must not say:** that the stored request status is immune to someone with app or database access. It is not — a normal database field can be changed by whoever controls the database or the deployment. State this as a known limitation rather than hiding it.

**We must also disclose:** a sufficient governance quorum could grant reviewer roles to attacker-controlled identities; the app host/deployer can bypass app-side checks; two legitimate reviewers approving a fabricated request is a business-fraud case our system does not detect.

If a protected-decision mechanism (e.g. a Tide-supported policy/contract flow) cannot be confirmed and tested within the time budget, implement the review rule accurately, disclose the remaining trust boundary, and **do not fake a cryptographic or quorum guarantee.**

---

## 10. Fallback plan

| If this fails | Do this | Never do this |
|---|---|---|
| Docker / TideCloak won't start | Ask organisers for a working realm, or use the official starter's documented setup path | Substitute mock auth and present it as TideCloak |
| Governed role assignment can't be demonstrated | Describe the narrower login + verified-role prototype honestly | Claim quorum protection we didn't test |
| Behind at G4 | Cut to a single list + detail screen. Keep server-side checks, persistence, and the negative tests | Cut server-side enforcement to save time |
| Behind at G6 | Record the working end-to-end flow you have; narrate only what's demonstrated | Record a staged flow that doesn't match the committed code |
| Public hosting fails | Submit the repo with reproducible local setup + the recorded demo | Panic-deploy something unstable at the deadline |

---

## 11. Open items to verify, not assume

Person 2 confirms each before relying on it; record the answer in the repo.

1. Is Docker actually installed and running on the build machine, and is a TideCloak dev container already up at `localhost:8080`? *(Not yet verified.)*
2. Exact import name and signature of the documented Next.js server-side token verifier in the installed SDK version.
3. The precise claim namespace our client emits for app roles, and whether the verifier enforces `aud` independently of `azp`.
4. The actual configured quorum threshold in our realm, with the real number of enrolled administrators.
5. Whether every role-assignment path is governed (direct role mapping, groups, composites, default roles) — a single tested path proves nothing about the others.
6. The verified venue deadline and timezone for our campus (HNI), from the official challenge page.

---

## 12. Submission checklist

- [ ] Public GitHub repository with complete working source and lockfile.
- [ ] Two-minute MP4 in the repo, under 100 MB.
- [ ] README five-prompt overview ≤300 words, setup instructions in a separate section.
- [ ] Every security statement traceable to a test, or explicitly marked unverified.
- [ ] No secrets or real personal/financial data anywhere in the repo or its history.
- [ ] The *other* person independently confirms the repo and video are accessible.
- [ ] Submission confirmation saved before the deadline, with ≥30 min of margin.
