[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

# Spend Approval — RMIT × Tide, Challenge 2

The runnable application is **`spend-approval/`**. It combines Person 1's screens with Person 2's authenticated API and SQLite storage. Expenses are fictional; no money moves.

## Project overview

### 1. Vision & originality

Staff submit an expense to two distinct senior reviewers and the CEO. All three must approve; any rejection is final. Each request explains who still needs to respond and why it is pending, approved or denied.

### 2. Trust constraint insight

Three approvals mean little if one administrator can impersonate reviewers or grant themselves authority. We separate verified identity, governed reviewer roles and the three specific subjects assigned to a request. Independent governance still needs a live quorum demonstration.

### 3. Value & impact

Requesters can track their own expenses. Reviewers see their assigned queue. Each decision records its verified subject, slot, time and optional comment, replacing ambiguous sign-off messages with a readable history.

### 4. Why TideCloak matters

TideCloak supplies real sign-in and signed access tokens. Every API call verifies the token; every vote also checks the current token's role and assigned subject. The application has no role-granting endpoint or realm-admin credential. Role grants belong in TideCloak governance. We have not proved resistance to a single bootstrap administrator.

### 5. Prototype & storytelling

The planned demonstration follows two real requests: two senior approvals followed by a CEO rejection, and a second request approved by all three. The UI displays the server's result. Automated tests cover these rules, unauthorized attempts, persistence, rollback and simultaneous votes. Four-account live voting and the final recording remain outstanding.

## Run

Use Node **22.13–24.x**, Git and a running TideCloak development instance.

1. Follow [the setup guide](spend-approval/SETUP.md) to obtain the client configuration, enroll accounts and configure roles/reviewer subjects.
2. From the repository:

```powershell
cd spend-approval
npm ci
npm run dev
```

Open [the local app](http://localhost:3000/) in Chrome or Edge. Keep TideCloak running at [localhost:8080](http://localhost:8080/). Sign in with a real Tide account. Run commands inside `spend-approval`; the root package belongs to the separate FairEnrol project.

```powershell
npm test
npm run build
npm start
```

Stop the development server before building. The production server uses the same configuration and local database. Realm initialization is deliberately excluded from this app; preserve the existing configured realm.

## Current evidence and remaining work

The integrated app has passed a production build, 20 automated tests and all 8 shared display fixtures. Real signed-in identity/list requests work. A real account without the requester role was refused when submitting an expense. Missing and invalid tokens return 401. See [the validation report](spend-approval/SECURITY-TESTS.md).

The four demo user records exist locally. Their enrollment, governed spending roles, independent quorum test and live voting flows still need completion. Follow [the remaining checklist](spend-approval/REMAINING.md). The [two-minute demo script](demo/DEMO-SCRIPT.md) is a plan; no completed Challenge 2 MP4 is claimed. Root `Video.mp4` is unrelated.

## Layout

- `spend-approval/`: live Next.js application, protected API, SQLite storage and tests.
- `contract.ts`: canonical shared types, re-exported by both apps.
- `lib-ui/`: shared display explanation; it never authorizes a vote.
- `ui-sandbox/`, `fixtures/`: Person 1's separate fixture-based development reference. These are not the live demo.
- `src/`, `index.html`, root Vite configuration: preserved FairEnrol work.
- `MASTER-PLAN.md`: authoritative plan. The older `PROJECT-PLAN.md` is superseded.

## Limits

SQLite and audit records remain editable by someone controlling the application host or database. A malicious governance quorum or colluding legitimate reviewers remain risks. Role removal can take until token expiry to affect an existing token. Node's built-in SQLite module is experimental on the tested Node 22.14 runtime; deploy one app instance with persistent local storage.

Never commit `tidecloak.json`, `.env.local`, databases, passwords, tokens or enrollment links. Each PC needs its own local setup; cloning Git does not copy the Docker realm or enrolled accounts.
