# UI fixtures — synthetic only

`spend-requests.json` holds eight synthetic spend requests used to build and check the
five UI screens while Person 2's server is unavailable.

- Each `scenarios[]` entry wraps one contract-shaped `SpendRequest` under `request`.
- `stateLabel`, `expectedStatus`, `expectedProgress` and `expectedExplanation` describe the
  state that fixture exists to prove. They are the reference for the display-only
  explanation function; they are **not** an authorization or status authority.
- `identities` supplies display names for the UI. Display names are presentation only.
- `r-007` is deliberately inconsistent: a rejection followed by two recorded approvals,
  with status `denied`. A correct server returns `409` for votes after a denial and would
  never persist that shape. It exists so the explanation logic can be checked against a
  hostile record and must still read as finally denied.

**Do not use these fixtures as live demo data.** The recorded demo must create requests
and votes through the real server. Fixture `sub` values are stand-ins and must be
reconciled with the real TideCloak `sub` claims before integration.
