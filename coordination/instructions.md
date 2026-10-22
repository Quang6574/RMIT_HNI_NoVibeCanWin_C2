## Decision (2026-10-22) — Phase A/B review, mid-flight
Phases A and B: **accepted, with one required correction before Phase C continues.**

Verified on disk: scaffold is real (Next 16.4.2 / React 19.3.0), hard links confirmed
(`nlink=2`, matching inodes for `contract.ts`, `explain-status.ts`, and
`spend-requests.json`), Checkpoint B's 8/8 fixture match stands. The `api-client.ts` seam,
`slots.ts`, and the `r-ui-900` divergent fixture are all in place. Good call adding a
dedicated mismatch fixture — that was the right instinct.

### Required correction: hard links do not survive git

The mechanism satisfies "one canonical copy" **only on this machine**. Git stores file
content, not filesystem link structure. Both paths hash to the same blob
(`2545b204…`) but are recorded as **two separate index entries**, so when Person 2 clones,
they get two independent files with `nlink=1` that can silently drift apart. That is the
exact failure the requirement existed to prevent, in the one context that matters — the
handoff.

Second, live risk: **many editors break hard links on save** by writing a temp file and
renaming it. A single edit to `contract.ts` in an IDE can silently de-link the pair while
you are still working.

Fix — replace the two TypeScript hard links with one-line re-export shims, which survive
git and cannot drift:

- `ui-sandbox/types/contract.ts` → `export * from '../../contract';`
- `ui-sandbox/lib-ui/explain-status.ts` → `export * from '../../lib-ui/explain-status';`

Delete the hard links first so you do not edit the canonical file through them. For
`spend-requests.json` (JSON cannot re-export), either import it from the canonical path
(`../../fixtures/spend-requests.json`) or keep the copy and add a `check:drift` npm script
that diffs it against the canonical file and exits non-zero on any difference. Your call —
report which and why.

If Next or Turbopack refuses imports from outside `ui-sandbox/`, stop and report the real
error rather than reverting to hard links; the workspace root is already inferred as the
repo root, so this should resolve.

Re-run `check:explain` afterwards: all 8 fixtures must still match byte-identically.

### Also fix now (quick)

Add `ui-sandbox/dev-a.out.log` and `ui-sandbox/dev-a.err.log` to `.gitignore` — currently
they are not ignored and would be committed.

### Then continue Phases C and D as you planned

Your "Next Move" list is the right sequence. Keep every binding rule from the brief. Two
additions, both for the integration handoff:

1. **Record stub-only machinery explicitly.** The in-memory `setActingSub` /
   `ACTING_SUB_EVENT` viewer switcher and the forced-error switch are sandbox affordances
   that **must be deleted at integration** — real identity comes from the verified token,
   server-side. Keep them in one clearly-named place and list them in your final report as
   removal items.
2. **The banner must disclose the scoping difference.** Your fixture client returns all
   requests regardless of viewer, while the real API scopes by identity. Say so in the
   banner, not only in a code comment — otherwise the sandbox misrepresents what the real
   app does.

### Record as integration risks (do not act on these yourself)

- **Framework version mismatch.** You are on Next 16.4.2 / React 19.3.0; Person 2's
  TideCloak starter pins its own versions. Components written against Next 16 App Router
  APIs may need changes if their starter is older. Flag it — cheap to confirm now,
  expensive at port time.
- **Client components vs server-side auth.** Screens built as client components cannot
  call token-authenticated server code directly. The API-client seam absorbs some of this,
  but Person 2 should know the components are client-side before planning integration.
- Leave the 5 npm audit findings alone. Do **not** run `npm audit fix` — it can change
  major versions and break the build, and this sandbox is never deployed.

Evidence needed at the end: the shim mechanism and `check:explain` re-run output; the five
screens rendering with the fixture used for each, including `r-ui-900` proving the mismatch
warning and `r-007` proving terminal denial; all five error states rendering, with how each
was triggered; and the list of stub-only machinery to delete at integration.

Reason: The hard-link approach was clever and genuinely gives one canonical copy locally,
but it fails silently the moment the repo is cloned — and the whole point of the
requirement was to protect the handoff. Fixing it now costs minutes; discovering drift in
Person 2's clone costs a debugging session neither of you can afford.
