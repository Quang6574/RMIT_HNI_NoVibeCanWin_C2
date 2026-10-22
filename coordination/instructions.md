## Decision (initial)
Gate: G-prep — **not passed**
Action: Do not scaffold anything or install npm packages yet. Two human-only
prerequisites are blocking: (1) **Docker Desktop is not installed** on this machine —
TideCloak runs as a Docker container, so nothing can start without it; (2) a **Tide
account must be enrolled** via the link the Next.js initializer prints, completed in
Tide's external enclave (needs internet, takes a few minutes). Once Docker is installed
and its daemon responds, your first task is G-prep verification only: confirm
`docker --version` works, start the TideCloak dev container per the official Quickstart,
and confirm something answers on `localhost:8080`. Report and stop there.
Evidence needed: `docker --version` output, the exact `docker run` command used, and an
HTTP response from `localhost:8080`.
Reason: Verified setup check found no Docker CLI (Windows PATH or bash), no response on
port 8080, no node_modules, no tidecloak.json, and no Next.js app — so there is nothing
to build on yet, and both blockers require a human.
