# Run Spend Approval

This app started from the official TypeScript `@tidecloak/create-nextjs@0.14.33` template. Person 1's UI is integrated here. Use this folder, not the root Vite app or `ui-sandbox`.

## Existing local setup

1. Start Docker Desktop and the existing `spend-approval-tidecloak` container. Its persistent volume is `spend-approval-tidecloak-data`; keep it. TideCloak is bound to `127.0.0.1:8080`.
2. The realm is `spend-approval`, the public client is `spend-approval-client`. Realm initialization is deliberately excluded from this app. Do not delete the volume or recreate the realm to fix a pending request.
3. Download this client's adapter configuration from its Credentials tab to `spend-approval/tidecloak.json`. This ignored file must refer to the same realm/client and contain the signed origin for `http://localhost:3000`. Do not hand-edit cryptographic signatures.
4. Use Node 22.13–24.x (tested with 22.14). In this folder run `npm ci`.
5. Copy `.env.example` to `.env.local` and fill the three reviewers' actual verified subjects. This PC already has its local user IDs configured. The values are subjects, never usernames or passwords.
6. Run `npm run dev`, then open `http://localhost:3000/` in Chrome or Edge. Use the exact `localhost` origin consistently. `127.0.0.1` is a different browser origin.

The admin console is [here](http://localhost:8080/realms/spend-approval/tide-console/). Admin credentials belong outside this repository and never in the app environment.

## Client settings

Use public client access and Standard flow (Authorization Code). Configure:

```text
Base URL: http://localhost:3000
Valid redirect URIs:
http://localhost:3000/auth/redirect
http://localhost:3000/silent-check-sso.html

Web origins:
http://localhost:3000
```

Approve the exact intended changes through QEA, then refresh the settings to confirm they are effective. A pending request is not an applied setting. If `PENDING_CHANGE_REQUEST_CONFLICT` appears, inspect the existing request instead of submitting another copy. Inspect bundled changes before approving them.

The token needs the client itself as audience (`aud`). This server verifies signature, issuer, `azp`, audience, expiry and subject. Keep the current bearer-token flow: do not enable required DPoP binding without implementing server proof validation. PKCE S256 enforcement still needs a separate live check; do not approve an unrelated bundled DPoP change just to enable PKCE.

If the Tide sign-in page cannot fetch a localhost voucher, allow its local-network access in Chrome/Edge's site settings and start a fresh sign-in. The embedded Codex browser may not expose that permission control. Do not disable browser security globally.

## Four identities and roles

Enroll each local user with its own Tide identity. Use the user's Tide invite link. The account owner enters credentials and accepts terms themselves. Keep passwords and invite links out of screenshots, chat and Git.

| Demo user | Governed role | Assignment |
|---|---|---|
| `staff_requester_01` | `spend_requester` | Submitter |
| `senior_reviewer_01` | `spend_senior_reviewer` | `SPEND_SENIOR_A_SUB` |
| `senior_reviewer_02` | `spend_senior_reviewer` | `SPEND_SENIOR_B_SUB` |
| `ceo_reviewer_01` | `spend_ceo_reviewer` | `SPEND_CEO_SUB` |

Create these role definitions and grant them only through the Tide console's governed process. Configure new accounts as requester-only, with no default reviewer role. Sign out and in after approved role changes, then check the effective role in the actual session. Do not grant spending roles to the administrator just to make a screen work.

Three assigned reviewer subjects must be distinct and differ from the requester. Missing or invalid configuration fails with 503; there is no fixture fallback. Assignment changes apply to new requests; existing requests retain their reviewers. Restart the app after environment changes.

The current five-license workspace has one admin plus four demo users. Independent governance requires independent people; overlapping demo roles does not prove that independence. Resolve any extra governance-account/license requirement before claiming a multi-person quorum.

## Verify and record

Run `npm test`. It exercises real cryptographic verification with isolated ephemeral test keys, rule checks, body limits, persistence, rollback, concurrent connections, bearer transport and shared display fixtures. It adds no test login or authority path to the app.

Stop the dev server, run `npm run build`, then `npm start`. Open the live app and complete [REMAINING.md](REMAINING.md), including both real voting outcomes and governance evidence. Authenticated APIs accept bearer access tokens only; cookie-only requests do not authorize mutations.

## Another PC

Clone this repository, enter `spend-approval`, install with `npm ci`, and configure that machine's TideCloak realm/client, adapter file and `.env.local`. Start a TideCloak instance using the official development image and a persistent volume; use a fresh local admin credential. The repository does not contain your Docker realm, user enrollment state or database. Use the new realm's reviewer subjects rather than copying this PC's IDs. Download a matching adapter configuration; do not run the initializer on an existing configured realm.

## Storage and boundaries

The app uses Node's built-in SQLite module and stores `data/spend.sqlite` with WAL files. Deploy one app instance with persistent disk. Stop the app before copying the database for a backup so its journal is consistent. Never delete the data directory as routine troubleshooting.

All amounts are 1–100,000,000 integer USD cents. Submitted content cannot be edited through the API. Each vote, status change and audit entry commits in one transaction. Status/audit storage remains editable by a host/database operator. Old role claims can remain usable until their token expires. A malicious authorized quorum and colluding reviewers remain outside the protection demonstrated here.
