# PYRGRAPH agent operating rules

Read `PYRGRAPH_OPERATING_MANUAL.md`, `shared/CONTRACT.md`, `docs/DECISIONS.md`, your role prompt, and the current status files. After kickoff, also read the actual `shared/contracts.ts` and shared fixture. This package contains instructions, not an already-working app.

## Mission

Build a network-first, account-level sales relationship prototype. Load a team graph, describe the product, recommend reachable accounts, show evidence-backed short paths, and use Gemini to explain/draft the next sensible outreach. The central reveal is adding a teammate and watching the actual account access change.

Working name PYRGRAPH. Brand: charcoal, orange, ember red, supplied flame/hearth logo. Preserve the difference between access, fit, and intent. Do not revert to insurance, Earth data, a generic lead generator, or elaborate routes to a preselected executive.

## Authority and scope

Organizer rules and explicit current human decisions control. Accepted joint decisions in `docs/DECISIONS.md` override older proposals. Interfaces are controlled by `shared/contracts.ts` after it exists; any semantic conflict must be surfaced, not silently resolved independently.

Local styling improvements are allowed in the owner's files. Cross-boundary changes, new packages, new external services, or changed score meaning require a brief proposal and human agreement. Capture ideas in `docs/SHIP.md`; do not silently start building them.

## Ownership

Sahil: `server/**`, `src/core/**`, `src/client/api.ts`, shared schemas/fixtures, root config and lockfile, integration/deployment. Yanni: `src/ui/**`, app presentation entry, UI styles/assets and graph rendering. Map paths once to the actual scaffold. Each person alone edits their own status file.

Only Sahil, acting as integrator after checks, advances `main`. Do not edit the other person's files, update package/lock files concurrently, or use a third unattended writer. A peer-owned fix needs a handoff or explicit temporary ownership transfer.

## Work loop

1. Inspect the actual clock, branch, working tree, and available tools. Do not assume terminal, browser, GitHub permissions, or secret access. Report missing capabilities once with an exact human step.
2. Before a new slice, fetch if authorized and read the peer's pushed status with `git show origin/<branch>:docs/STATUS_<NAME>.md`. Only committed, pushed work is visible. No fetch does not mean no changes exist.
3. State the slice and its acceptance check. Implement within ownership. Keep scope small enough to integrate promptly.
4. Run relevant checks; distinguish executed tests from proposed tests.
5. Update your own brief status, stage only intended files, commit/push if authorized, and supply the actual SHA and a READY/BLOCKED handoff.
6. Read the latest joint decisions before starting another feature. Both people merge `origin/main` into their work branch after a successful integration.

Never claim to watch another branch continuously. Never invent a teammate response or say you fetched/deployed/tested without doing it. Use no watcher agents or autonomous merge infrastructure for this sprint.

## Technical/data invariants

Use one React/TypeScript/Node app and same-origin API, preserving the initial scaffold. No graph database, database requirement, autonomous runtime agent framework, or secret in client code.

Code retrieves real paths and does arithmetic. Gemini receives a bounded evidence subgraph, interprets buyer relevance, explains uncertainty, and drafts. Validate structured model output and IDs. No fabricated social edges, interaction counts, current employment, or success probabilities.

LinkedIn-only connection strength is unknown. Same employer is not a relationship. Connection date is not last interaction. Public data is synthetic; private exports and secrets never enter the repo or demo recording. Manual relationship annotations are labeled self-reported. Draft only; do not send messages.

Use session-local snapshots and independently reproducible requests. Do not store user uploads in a process-global mutable graph. Imported text is untrusted data. Check input sizes, response revisions, and failure states.

## Time and human actions

Target first deployed core by roughly 12:10 p.m. PDT; freeze features by 1:15; establish the recording build by 1:30; target submission by 2:20, ahead of the 2:30 deadline on September 27, 2026. These are planning gates, not a guarantee of speed. Organizer changes supersede them.

At 60 minutes remaining, default to shipping, not adding integrations. Reserve time for both videos, one-pager, upload and permission checks. Ask for the current time only when no reliable clock or supplied time is available.

Use: `HUMAN NOW: action | reason | success condition | fallback`.

Require humans for account authorization, spending approval, consent, meaningful contract changes, relationship truth, recording, and final submission. Do not repeatedly ask for information already provided. Continue on an agreed fallback when an optional service is unavailable.
