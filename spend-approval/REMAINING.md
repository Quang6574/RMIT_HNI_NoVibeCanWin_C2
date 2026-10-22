# Remaining work before the recorded demo

Code integration is complete locally; live account/governance verification is incomplete. Last checked 22 October 2026. Do these in order.

1. Finish linking `staff_requester_01`, `senior_reviewer_01`, `senior_reviewer_02` and `ceo_reviewer_01` to four separate Tide identities. The user records exist. Do not reuse one Tide identity for all four.
2. In TideCloak, create the three spending role definitions from SETUP.md. Grant requester to staff, senior reviewer to the two seniors and CEO reviewer to the CEO through the governed flow. New accounts should be requester-only. Verify the effective role after approved changes and a fresh login.
3. Confirm `.env.local` matches the three actual reviewer `sub` values. This PC's local IDs are populated. Restart the app after changes. On another PC/realm these values will differ.
4. In separate browser profiles, sign in as each demo user at `http://localhost:3000/`. Staff should see New request. Each reviewer should see only assigned requests and their one decision slot. A signed-in admin with no spending role should remain unable to submit.
5. Submit request A. Approve as senior A, then senior B: it must remain pending at 1/3 and 2/3. Reject as CEO: it must become denied. A later vote must return 409 and leave the decision history unchanged.
6. Submit request B. Three distinct approvals must produce approved. Refresh the requester view to verify the stored result. Repeat a vote, self-review, unassigned/wrong-slot vote and inaccessible read against the real protected API; record 409/403/404 results without exposing tokens.
7. Demonstrate an actual role grant below and at the configured independent quorum. Inspect alternative grant paths, PKCE enforcement and role-removal latency. Do not treat one bootstrap administrator or a pending badge as quorum evidence.
8. Record the tested commit using `demo/DEMO-SCRIPT.md`; save `demo/demo.mp4` under 100 MB (target under 50 MB). Root `Video.mp4` is unrelated. Record only real login/API results, with credentials and invite links hidden.
9. Review the Git diff, commit and push the complete app after the live checks. No push was made by this integration task.

The role and quorum steps create security-sensitive authority. They require the real workspace administrators' review/approval; the app deliberately contains no bypass or role-grant endpoint. Account credentials and terms acceptance stay with the account owners.
