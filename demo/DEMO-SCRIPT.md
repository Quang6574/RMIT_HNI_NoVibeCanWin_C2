# Demo script — 2:00 maximum

**Status: plan, not a record of completed work.** No end-to-end TideCloak run has happened
yet. This script is written to be recorded only after the preconditions below are true.
Any line whose precondition is not met must be cut, not performed.

## The one sentence the video must land

Two distinct senior reviewers and the CEO must all approve; any one rejection is final —
and the server, not the buttons, enforces that.

## Preconditions — do not record this script unless all are true

1. `stub_present` is `false`. There is no mock login, no stub banner and no fixture-fed
   path in the running build.
2. A real TideCloak login works for `staff_requester_01`, `senior_reviewer_01`,
   `senior_reviewer_02` and `ceo_reviewer_01`.
3. The G5 negative checks have passed and their evidence exists: unauthenticated request
   → `401`; non-reviewer and requester-self vote → `403`; duplicate vote → `409`;
   vote after denial → `409` with no status change; unassigned reviewer → `403`.
4. A **real** late-vote `409` can be shown on camera (beat 7). If it cannot, cut beat 7
   and the sentence about `409`; do not narrate a check that is not on screen.
5. Request B is a real pending request created earlier in the same app, with zero votes.
   It is disclosed as prepared. No decision is pre-seeded, and no fixture is shown.
6. The database contains only the demo accounts and request B. All votes in the video are
   cast live, on camera.
7. The build is the frozen commit. Record the commit hash beside the file.

If any precondition is false: stop and fix it. A shorter honest video is acceptable; a
staged one is not.

## Recording setup

- 1920×1080, browser at 100–125% zoom, cursor visible, notifications off.
- Four **real, pre-authenticated** TideCloak sessions in separate browser profiles or
  windows: requester, senior A, senior B, CEO. Show the requester login page live in beat 2;
  switching windows afterwards is fine because the sessions are real.
- Request A (submit live) and request B (created before recording, still pending, zero
  votes) are both visible to the requester.
- One terminal/API client ready for beat 7, with tokens and URLs redacted. Rehearse it.
- Rehearse the whole run twice. Target 110 seconds, hard cap 120.

## Beat sheet

| # | Time | On screen | Narration (exact words) | Must be true |
|---|---|---|---|---|
| 1 | 0:00–0:10 | Request list, then title card | "Three people must approve a spend request: two distinct senior reviewers and the CEO. One rejection ends it. The risk is one admin granting themselves that power. This is our TideCloak spend-approval prototype." | The design shown is the real app; no fixture banner. |
| 2 | 0:10–0:20 | Real TideCloak login as `staff_requester_01`, then request list | "We sign in through TideCloak as staff_requester_01 — a real login, not a mock. A new account starts with requester access only." | Real login works; fresh-account check passed. |
| 3 | 0:20–0:38 | New request form; submit accessibility audit, USD 1,200 | "Riley submits an accessibility audit for twelve hundred dollars. It starts Pending with three assigned slots: senior A, senior B, and the CEO. The data is synthetic; no money moves." | `POST /api/requests` returns 201; detail shows three slots. |
| 4 | 0:38–0:52 | Switch to senior A; approve with a short comment; explanation panel | "Senior reviewer A approves. Still Pending: one of three. The panel names who has not voted." | Vote accepted; progress is 1 of 3; explanation names B and CEO. |
| 5 | 0:52–1:06 | Switch to senior B; approve; explanation panel | "Senior reviewer B approves. Still Pending: two of three. Both seniors agree, but two approvals are not approval." | Progress 2 of 3; CEO still named. |
| 6 | 1:06–1:20 | Switch to CEO; reject with a short comment; denied panel | "The CEO rejects. It becomes Denied immediately. The panel says this is final: later approvals cannot reverse it." | Status is `denied`; explanation uses "final"/"cannot reverse". |
| 7 | 1:20–1:36 | Terminal/API client: late approve as senior A; show 409; refresh detail | "A late vote from senior A is refused by the server with a 409. The status stays Denied. The buttons are only a convenience; the server enforces the rule." | Real 409 observed; status still `denied`; no new decision row. **Cut this beat if not demonstrable.** |
| 8 | 1:36–1:52 | Requester's request B; three quick real approvals in pre-authenticated windows; approved panel | "A second request has no rejection. Senior A, senior B, and the CEO all approve. Only now is it Approved." | All three votes accepted live; status `approved`; three distinct subs. |
| 9 | 1:52–2:00 | Approved panel, then the honest-limitations card | "TideCloak supplies verified identity and governed reviewer roles. The stored status is still an application database field; we do not claim it is immune to a database operator." | Only say "governed" if Person 2's role test passed and the monitor verified it; otherwise say "verified identity" only. |

## Do not say or show

- "The UI prevents unauthorised actions", "the button is disabled for security", or any
  claim that hiding controls is protection.
- "Tamper-proof", "immune to admin override", or "quorum-protected" unless the exact
  test was run and the evidence is in the repo.
- A fixture request as if it were live data.
- A mock login, a fabricated vote, a pre-filled decision, or a rehearsed "error" that did
  not come from the server.
- Tokens, enrollment links, `.env` contents, database files or admin credentials.

## If behind schedule

Record only beat 2, beat 3, beat 4, beat 6 and beat 8. That still shows real login, a new
pending request, one approval leaving it pending, one rejection denying it, and all three
approvals approving a second request. Drop beat 7 rather than fake it. Never drop the
honest-limitations line.
