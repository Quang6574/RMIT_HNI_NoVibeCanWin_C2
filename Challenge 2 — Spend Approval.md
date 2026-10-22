# Challenge 2 — Spend Approval

A small TideCloak-integrated prototype for staff spending requests that require approval from two senior reviewers and the CEO before a simulated expense is approved.

> **Project status:** Build specification. Implement only what is verified in the repository and TideCloak setup. Update the overview and security claims before submission to match the working prototype.

## Official challenge overview draft

Keep this section and its answers under 300 words. The five prompts below are from Tide’s UNLOCKED challenge page.

#### Vision & originality

What new product, service, experience or way of working are you proposing? What makes your idea distinctive?

We propose a spending-request app where all three assigned reviewers must approve a request; one rejection denies it. No real money moves.

#### Trust constraint insight

What is difficult, risky or impossible today because trust, privacy or security gets in the way? Explain what becomes possible when that constraint is removed.

A single administrator should not be able to grant themselves approval power or override a spending decision. Governed reviewer roles and a protected decision flow make the process more accountable.

#### Value & impact

Who would benefit, and how would their lives or work improve? Give a concrete example of why this matters.

Small teams gain a clear, auditable approval process. A staff member can see who has reviewed a request and why it is pending, approved, or denied.

#### Why TideCloak matters

How does your application use TideCloak, and how does that integration help enable your idea? Connect the technology to the possibility you are demonstrating.

TideCloak provides user identity and governed role changes. The app checks reviewer authority server-side; the final spending rule must also be protected and tested.

#### Prototype & storytelling

What does your prototype demonstrate today? Describe the key interaction judges should look for.

Show one rejection denying a request, then a separate request approved only after all three reviewers approve. Demonstrate the TideCloak protections actually implemented.

## Instructions for Claude Code

Read this README and inspect the existing repository before changing files. Preserve the TideCloak-generated starter and its versions unless a change is necessary. Work in small stages, run the app and tests after each stage, and summarize changed files and remaining risks. Use Tide’s MCP guidance if available. Do not invent TideCloak APIs, replace the identity provider with mock authentication, add client-controlled role flags, or claim an untested security guarantee.

Start by checking whether the TideCloak Quickstart app already exists and runs. If it does not, explain the exact missing setup step before generating or replacing project files. Do not overwrite existing work.

## Product behavior

### Users and roles

- **Requester:** Creates spending requests and views their status. Cannot review their own request.
- **Senior reviewer:** Two distinct TideCloak identities hold the senior-reviewer role. Each may vote once on a request assigned to them.
- **CEO reviewer:** One distinct TideCloak identity holds the CEO-reviewer role and may vote once.
- **Realm administrators:** Govern TideCloak users and roles. Keep them separate from spending reviewers when possible. Realm-admin status does not imply spending-review permission.
- **App operator:** Runs the web app. The app must not receive TideCloak admin credentials or have a user/role-management endpoint.

Use stable TideCloak identity subjects (for example, the verified `sub` claim) for authorization and vote records. Display names are for presentation only.

### Request fields

Each request has an ID, title, amount, currency, category, business reason, requester subject, creation time, assigned reviewer subjects, reviewer decisions, and status. Use synthetic people and values only. Do not connect real bank accounts or make real payments.

### Decision rule

- New request starts **Pending**.
- Any one of the three assigned reviewers rejects → **Denied immediately**. Later approvals cannot reverse the decision.
- **Approved** only after both distinct senior reviewers and the distinct CEO reviewer approve.
- Otherwise, keep it **Pending**.
- A reviewer may cast at most one decision per request. A requester cannot vote on their own request.
- A denied request is terminal. A revised request is a new record, preserving the old decision.
- Make state transitions atomic or transaction-safe so concurrent votes cannot create an invalid final state.

## TideCloak account and role setup

Creating an account is not the same as granting it reviewer authority. New accounts must be requester-only by default. A potentially compromised admin may be able to create a basic account, but that account must not be able to review unless the reviewer role is granted through the governed TideCloak process.

### One-time realm setup

1. Install and run Docker, Node.js 20.9 or later, `curl`, `jq`, and Git.
2. Start TideCloak using the [official Quickstart](https://docs.tide.org/get-started/Tidecloak%20Quickstart). Its local development credentials are for local use only.
3. Initialize the TideCloak Next.js starter if the repository does not already contain it. Complete the Tide enrollment link printed by the initializer and confirm the login flow works.
4. Link the first Tide identity as the realm administrator.
5. Add independent `tide-realm-admin` accounts and enroll each person’s own Tide identity. Granting this role is itself a governed change. Authorize the change through **QEA Approvals**.
6. Confirm the actual realm quorum in this environment. Tide’s setup guide says the first-admin-only threshold is one. Do not rely on a single bootstrap admin or claim role changes are quorum-protected until you have tested the configured multi-admin quorum.

### Provision the demo accounts

Create and enroll separate fictional Tide identities, for example:

```text
staff_requester_01
senior_reviewer_01
senior_reviewer_02
ceo_reviewer_01
```

Create app roles such as `spend_requester`, `spend_senior_reviewer`, and `spend_ceo_reviewer`. Give the requester only requester access. Assign the senior-reviewer role to exactly two reviewer identities and the CEO-reviewer role to the CEO identity. Perform reviewer-role assignment through the Tide console; authorize each resulting role-change request through the configured QEA quorum. Verify that the role is not effective before the required approvals.

Do not implement an app UI or API that grants roles. Do not store realm-admin credentials in the app. A newly created account must not be able to make itself a reviewer. In the app, verify the TideCloak token server-side and enforce both the reviewer role and the configured reviewer identity for each vote.

Tide’s official [QEA setup guide](https://docs.tide.org/Admin/SetupIGA) documents governed role assignments and approvals. It does not, by itself, prove that the app’s stored spending decision is protected from an app operator or database administrator.

## TideCloak security boundary

TideCloak has two distinct roles in this prototype:

1. **Identity and reviewer permissions:** Verify who signed in and whether the person has the appropriate governed TideCloak role.
2. **Spending decision:** The application implements the three-vote business rule. A normal database status field can still be changed by someone with sufficient app/database access. Do not say the status is immune to admin override unless the final decision is also protected by a Tide-supported mechanism and that behavior is tested.

Before implementing a special protected decision path, ask Tide’s MCP or documentation for the supported approach for this exact rule: “two distinct senior-reviewer identities and one CEO identity; all three approvals required; any rejection is terminal.” Use the official supported SDK/policy/contract flow. If it cannot be confirmed or completed in the hackathon prototype, implement the review rule accurately, disclose the remaining trust boundary, and do not fake a cryptographic or quorum guarantee.

## UI requirements

Build the smallest interface that makes the rule easy to follow:

- **Request list:** title, amount, requester, status, and reviewer progress.
- **New request form:** title, amount, currency, category, and business reason.
- **Request detail:** request information and each assigned reviewer’s pending/approved/rejected decision.
- **Reviewer controls:** approve or reject with an optional short comment; show controls only to eligible reviewers, and enforce the same checks on the server.
- **Decision result:** explain why a request is pending, denied, or approved.

Use clear fictional demo identities and seeded/sample requests only if consistent with the actual TideCloak login. Do not use a mock login to represent TideCloak protection.

## Suggested implementation stages

1. Inspect the starter and report its framework, TideCloak integration status, and existing data storage. Do not overwrite it.
2. Confirm TideCloak login works. Configure the reviewer accounts and roles manually in the Tide console; keep this outside the app.
3. Implement the request data model and status-transition function. Add unit tests for the decision rule before connecting it to the UI.
4. Add server-side TideCloak token verification and role/subject checks to request and vote endpoints using the existing official SDK pattern. Never rely on client-only guards.
5. Connect the UI to the server flow. Ensure reviewer actions record the verified identity, and prevent duplicate votes and self-review.
6. Identify the supported Tide mechanism, if any, for protecting the final spending decision. Test it. Document any unresolved limitation honestly.
7. Run the security checklist below, then prepare the two-minute demo and final README overview.

Use the existing project’s storage if suitable. If none exists, choose a simple server-side store that supports atomic updates for votes; do not use browser `localStorage` as the authority for roles or final status. Explain the choice and limitations.

## Acceptance and security tests

- Requester can create a request but cannot vote, including on their own request.
- A fresh or newly created account has no reviewer access by default.
- An ordinary app administrator cannot grant TideCloak reviewer roles; role assignment is done through TideCloak governance, with the configured quorum verified.
- An unassigned user or a user without the correct verified role receives a server-side denial from voting endpoints.
- Only the two assigned senior identities and the one assigned CEO identity can cast their respective votes.
- One rejection sets the request to **Denied** and prevents later approval.
- One or two approvals leave the request **Pending**; only all three distinct approvals produce **Approved**.
- Duplicate votes and concurrent requests cannot bypass the rule.
- Tokens, enrollment links, admin credentials, and TideCloak local data are not committed to Git.
- If an app/database operator can still directly alter the stored status, identify that as a remaining limitation; do not claim TideCloak prevents it unless demonstrated.

## Local development

See the [TideCloak Quickstart](https://docs.tide.org/get-started/Tidecloak%20Quickstart) for current prerequisites and commands. If the official Next.js starter has not been initialized, the documented command is:

```bash
npm init @tidecloak/nextjs@latest tide-app
```

Complete the enrollment step, then run the generated project using its own package scripts. Inspect its `package.json` and follow those scripts rather than assuming this repository’s exact directory or commands.

For Claude Code, Tide documents a project-level `.mcp.json` option:

```json
{
  "mcpServers": {
    "tide-pack": {
      "command": "npx",
      "args": ["-y", "@tideorg/mcp"]
    }
  }
}
```

Restart Claude Code after adding the file and confirm the Tide tools are available. See [Tide’s MCP setup guide](https://docs.tide.org/ai-agent-pack). The MCP provides implementation guidance; it is not the TideCloak server.

Add local state, `.env` files, credentials, and enrollment artifacts to `.gitignore`. Never commit secrets or actual personal/financial data.

## Demo and submission checklist

The two-minute video should show: (1) the trust problem and idea, (2) a request being submitted, (3) one rejection denying one request, (4) all three approvals approving another request, and (5) the demonstrated TideCloak role/protection behavior. Clearly label any security boundary that is not fully protected.

Tide requires a **public GitHub repository** containing the working prototype and a **two-minute MP4 under 100 MB**. Submit the repository link through Tide’s form. Keep the official five-prompt project overview above to **300 words or fewer** and keep setup instructions separate. Check the [official challenge page](https://tide.org/unlocked/#challenge) for current venue-specific deadlines and instructions.

## First prompt for Claude Code

```text
Read README-challenge-2-spend-approval.md completely. Inspect the existing repository without overwriting files. First report the framework, whether the TideCloak Quickstart is already initialized, whether login works, existing data storage, and whether Tide’s MCP tools are available. Then propose the smallest safe implementation sequence. Do not implement fake authentication, add app-side reviewer-role assignment, invent TideCloak APIs, or claim unverified admin protections. After I confirm the inspection, implement the decision-rule unit tests first.
```

## Official references

- [Tide UNLOCKED Challenge 2](https://tide.org/unlocked/#challenge)
- [TideCloak Quickstart](https://docs.tide.org/get-started/Tidecloak%20Quickstart)
- [Tide QEA setup guide](https://docs.tide.org/Admin/SetupIGA)
- [Tide administration guide](https://docs.tide.org/Admin/intro)
- [Raziel MCP setup and guidance](https://docs.tide.org/ai-agent-pack)
