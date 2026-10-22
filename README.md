[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

# Spend Approval — RMIT × Tide, Challenge 2

Spend Approval is a workspace where two senior reviewers and a CEO must unanimously approve each expense, with every decision recorded and explained.

## Project overview

### 1. Vision & originality

We turn expense approval into an explicit three-person agreement. Staff submit requests to two distinct senior reviewers and the CEO. All three must approve; any rejection is final. The interface explains who still needs to respond and why a request is pending, approved or denied.

### 2. Trust constraint insight

Three approvals mean little if one administrator can impersonate reviewers or grant themselves authority. Separating verified identity, governed roles and assigned reviewers makes accountable delegation possible without relying on an informal sign-off chain. Independent governance still requires a live quorum demonstration.

### 3. Value & impact

Staff, managers and finance teams get a shared decision history instead of scattered messages. For example, a $1,200 equipment request remains pending after two approvals; a CEO rejection clearly stops it. Requesters track their expenses, while reviewers see their assigned queue.

### 4. Why TideCloak matters

Live mode verifies TideCloak access tokens and checks each voter's role and assigned identity. Role grants belong in TideCloak governance; the application cannot grant them. This connects authenticated people to specific approval responsibilities. During network congestion, an explicitly labelled simulation substitutes four demo identities; it does not prove live Tide governance.

### 5. Prototype & storytelling

Judges can submit an expense, switch between four demo identities, and watch two approvals followed by a CEO rejection. A second request demonstrates unanimous approval. The backend enforces decisions and persists their history. Expenses are fictional; no money moves. Four-account live voting remains outstanding.

## Team members

| Name | Student ID |
| --- | --- |
| Luong Gia Bao | s4040517 |
| Le Dam Quan | s4031504 |
| Tran Dinh Hai | s4041605 |
| Nguyen Phu Minh Quang | s3996843 |

## Setup

The runnable application is **`spend-approval/`**. Install Node **22.13–24.x** and Git, then clone the repository:

```powershell
git clone https://github.com/Quang6574/RMIT_HNI_NoVibeCanWin_C2.git
cd RMIT_HNI_NoVibeCanWin_C2
```

## Local simulation

Use this mode to demonstrate the full workflow while Tide account linking is unavailable. It runs independently of the live integration, following the organizers' guidance permitting simulated protections during network congestion.

```powershell
cd spend-approval
npm ci
npm run demo
```

Open [localhost:3001](http://localhost:3001/). No Docker, Tide account or adapter file is required for this mode. Use **Demo identity** to switch between staff requester, senior A, senior B and CEO. Submit as staff, then switch reviewers to vote. All three approvals are required; any rejection is final. The backend validates and persists decisions using the same rules as live mode.

The banner explicitly states that Tide verification and governance are simulated. Demo records use `data/spend-demo.sqlite`; live records remain in `data/spend.sqlite`. The demo runs on loopback port 3001 only and is disabled in production. It never activates automatically when Tide is unavailable.

## Live TideCloak setup

Real Tide sign-in is the default. Start your TideCloak development instance before running the app.

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

The integrated app has passed a production build, 27 automated tests and all 8 shared display fixtures. Real signed-in identity/list requests worked before the reported Tide outage. A real account without the requester role was refused when submitting an expense. Missing and invalid live tokens return 401. Simulation tests additionally check mode isolation, fixed identities, origin restrictions and separate storage. See [the validation report](spend-approval/SECURITY-TESTS.md).

Four intended live test-user records exist in the development realm. Their enrollment, governed spending roles, independent quorum test and live voting flows still need completion. Follow [the remaining checklist](spend-approval/REMAINING.md). The [simulation demo guide](demo/SIMULATION-DEMO.md) and [live demo script](demo/DEMO-SCRIPT.md) describe the recording flows; no completed Challenge 2 MP4 is claimed.

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
