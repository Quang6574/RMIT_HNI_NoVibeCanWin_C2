# Disclosed simulation demo — target 110 seconds

The user relayed organizer guidance allowing simulated Tide protections during network congestion and explicitly approved this mode. Show the LOCAL SIMULATION banner throughout. Do not describe the identity selector as real Tide sign-in, real role governance or proof of an independent quorum.

## Prepare

1. In `spend-approval`, run `npm ci`, `npm test`, then `npm run demo`.
2. Open `http://localhost:3001/`. No Tide account, Docker or `tidecloak.json` is needed.
3. Choose **Staff requester** in Demo identity. Pre-create a second fictional request, with zero decisions, for the final approval sequence; disclose that it was prepared.
4. Record only this application, with the simulation banner visible. Data persists in the separate `data/spend-demo.sqlite`; refreshing does not reset it. Use new request records for another take.

## Recording sequence

| Time | Action | Suggested narration |
|---|---|---|
| 0:00–0:12 | Show the banner and four-identity selector | “Tide's network is congested, so we are using the permitted local simulation. Identity verification and governance are simulated. The application backend still validates and saves each decision.” |
| 0:12–0:30 | As staff, submit a fictional accessibility audit for USD 1,200 | “A new request starts pending, assigned to two distinct senior reviewers and the CEO. No real money moves.” |
| 0:30–0:44 | Select senior A, open the request and approve | “Senior A approves. One of three: still pending.” |
| 0:44–0:58 | Select senior B, open the request and approve | “Senior B approves. Two of three is still pending; the CEO has not decided.” |
| 0:58–1:12 | Select CEO, open the request and reject | “One rejection makes it denied immediately. This decision is final.” |
| 1:12–1:25 | Switch back to staff and open the denied record | “The saved record shows each decision and explains why it was denied. Submitted details cannot be edited.” |
| 1:25–1:44 | Open the prepared second request; switch through A, B and CEO and approve each | “This second request was prepared with no votes. It becomes approved only after all three distinct reviewer slots approve.” |
| 1:44–1:50 | Show the approved result and banner | “Real Tide integration remains available separately. This simulation does not prove live identity or quorum security.” |

The selector returns to the request list; reopen the relevant title after each switch. For a repeat take, create new fictional requests rather than rewriting decided records. The SQLite unique constraints and transactions still reject duplicate votes and later votes on final requests.

## Submission

Record the tested commit hash beside `demo/demo.mp4`. Keep the final MP4 under 100 MB, ideally under 50 MB. Do not include passwords, enrollment links, tokens, the adapter configuration or database files. The root `Video.mp4` is unrelated to this Challenge 2 demonstration.
