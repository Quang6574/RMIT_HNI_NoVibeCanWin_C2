[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

# Spend Approval — RMIT Hackathon 2026, Challenge 2

A small TideCloak-integrated prototype for staff spending requests that need approval
from two distinct senior reviewers and the CEO. No real money moves; all identities and
amounts are synthetic.

## Project overview

### 1. Vision & originality

We are building a spend-approval workspace. Staff submit a spending request; three
assigned reviewers decide it: two distinct senior reviewers and the CEO. The distinctive
part is the rule. All three must approve, and one rejection is final. The interface
explains what is still missing, so each decision is easy to audit.

### 2. Trust constraint insight

A "three-person approval" is only as strong as the least accountable administrator. If
one admin can grant themselves reviewer authority or change the result, the extra
signatures are decoration. Our prototype explores what changes when reviewer authority is
granted through a governed process and every vote is tied to a verified identity.

### 3. Value & impact

A requester can see exactly who still has to respond and why a request is stuck. A
reviewer sees only the requests assigned to them. A finance lead gets a clear record of
who approved, who rejected, when, and with what comment. That replaces "who signed this
off?" archaeology with a readable decision trail.

### 4. Why TideCloak matters

TideCloak is intended to supply the verified identity behind every vote and the governed
role assignment that makes someone a reviewer. The server checks both the role and the
specific reviewer assigned to that slot. A plain login would not address the trust
problem: reviewer authority cannot be handed out by an app screen or an ordinary
administrator.

### 5. Prototype & storytelling

The demo follows two requests. One gathers both senior approvals and is then rejected by
the CEO: it becomes Denied immediately and stays denied. The other receives all three
distinct approvals and becomes Approved. Judges should watch the gap between "two
approve" and "approved", and the moment one rejection ends the process.

## Status and limitations

**Draft from the UI workstream.** At the time of writing, no end-to-end TideCloak login or
server-side rule test has been run, and the Challenge 2 Next.js app is not in this
repository yet. Statements above about TideCloak describe the design we intend to test,
not verified protection. This section will be rewritten from evidence before submission.

What the finished submission must not claim unless it was tested and evidenced:

- that the user interface prevents an unauthorised action — it does not; the server is the gate;
- that the stored status is tamper-proof or immune to an application or database operator;
- that role changes are quorum-protected, until the real realm quorum is tested.

Known limitation to disclose: the request status is a normal application database field,
so anyone who controls the application or its database can change it unless the final
decision is protected by a tested Tide-supported mechanism. No such mechanism has been
confirmed for this prototype.

`contract.ts` at the repository root is the shared draft contract. It is intended to move
unchanged to the Challenge 2 app's `types/contract.ts` once Person 2 agrees to it.

## Setup

> The Challenge 2 app is not in this repository yet. Person 2 is scaffolding the official
> TideCloak Next.js app; these commands will be aligned with its actual `package.json` at
> integration. Do not use the existing FairEnrol Vite app for the demo.

The existing `src/`, `index.html` and `vite.config.js` are Challenge 1 work and are
intentionally untouched.

### Prerequisites

Node.js 20.9 or later, Docker, Git, `curl` and `jq`. Docker is needed for the TideCloak
development container.

### 1. Start TideCloak

Follow Tide's current [Quickstart](https://docs.tide.org/get-started/Tidecloak%20Quickstart).
The local development container from the starter README is:

```bash
docker run -d -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
  tideorg/tidecloak-dev:latest
```

These credentials are for local development only. Confirm the current command against
the Quickstart before relying on it.

### 2. Initialise the Challenge 2 app

```bash
npm init @tidecloak/nextjs@latest tide-app
cd tide-app
```

Complete the Tide enrollment step printed by the initializer. Download the generated
`tidecloak.json` into the location the starter expects. Never commit that file, `.env`
files, enrollment links or local database files.

### 3. Run

```bash
npm install
npm run dev
```

Open the URL printed by the starter. The exact scripts are taken from the generated
`package.json`.

### 4. Demo data

`fixtures/spend-requests.json` contains synthetic requests for building and checking the
five UI screens only. It must never be presented as live data in the recorded demo. The
demo creates its requests and votes through the real server; see `demo/DEMO-SCRIPT.md`.
