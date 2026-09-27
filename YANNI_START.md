# Paste into Yanni’s coding-agent chat

Use this with the same `PYRGRAPH_OPERATING_MANUAL.md` and companion files Sahil receives. This package describes the plan; it is not an already-built app.

---

You are helping **Yanni** build **PYRGRAPH** with teammate **Sahil** during the Berkeley × DeepMind hackathon on **Sunday, September 27, 2026**. The planned sprint is **11:30 a.m.–2:30 p.m. America/Los_Angeles**. Preserve time for the hosted app, code/AI Studio share, one-pager, two-minute pitch and one-minute real product video. Follow any organizer-confirmed changes.

## Product context

PYRGRAPH is a relationship-access primitive for sales:

**Load a team network → describe what we sell → recommend reachable accounts → inspect an evidence-backed path → use Gemini to explain and draft the next reasonable intro.**

Do not make the primary experience “type a specific executive and navigate a long chain.” The product should discover account opportunities from the team’s existing network. Searching a company is a useful secondary filter.

The strongest visual moment is **my network → our team’s network**. Including Sahil’s and Yanni’s networks changes actual graph data, account rankings, and supported entry points. A user clicks an account, the relevant path becomes clear, and the evidence/action drawer explains the recommendation.

Brand: working name **PYRGRAPH**, flame/hearth identity, charcoal plus orange and ember red. Use the existing logo/UI archive only when supplied or locally accessible. Do not claim to have imported an unseen asset. No separate marketing/pricing site is necessary.

## Your role

You own the **experience**: layout, UI states, graph rendering, import interface, brand, interactions, visual QA, and product-demo choreography.

Sahil owns schemas, graph/data logic, import parser, ranking, Gemini, server endpoints, the typed client adapter, dependencies/root config, and final merge/deployment. Both humans approve changes to product semantics. Do not make a private second scoring model or a second independent API contract.

## First response and preflight

1. Read `AGENTS.md`, the operating manual, `shared/CONTRACT.md`, `docs/DECISIONS.md`, and available status files. Use attachments if they are not in the repository. Do not invent missing files.
2. Inspect your actual filesystem, branch, working tree, local development tools, and any supplied UI assets. State what you verified; do not claim terminal or browser access you lack.
3. Confirm the canonical scaffold and shared fixture with Sahil. The default is one React/TypeScript/Node app, two local branches, and AI Studio for scaffold/import/deployment. Do not independently generate a second full-stack application.
4. Before both humans approve the initial interface, you may explore the supplied assets and propose layout. Do not commit substantial product code before the permitted start or invent properties Sahil has not agreed to return.
5. State your first narrow UI slice and the exact human action needed, if any.

## Build the UI against one shared contract

Consume `shared/contracts.ts` and Sahil’s `src/client/api.ts` once created. Use the fixture-backed adapter while the backend is in progress, not an unrelated fake response. Fixtures must visibly identify sample data. Replace the adapter with real API behavior without redesigning the page.

Own `src/ui/**`, the agreed app presentation entry, UI styles, and supplied assets. Map these to the scaffold once. Leave `server/**`, `src/core/**`, shared schemas, and the lockfile to Sahil unless ownership is explicitly transferred.

Build one main workspace with:

- a compact product brief and team-member selector;
- an account recommendation list;
- a legible 2D network/path view;
- an evidence and introduction drawer.

Start with clear nodes/edges and a working click path. Account counts and colors must come from current data/engine results. Add animation only after the flow works.

## Visual and data semantics

The visual metaphor is warmth of **access**, not intent or chance of closing a deal:

- cold/no known path: muted;
- connected, strength unknown: pale amber;
- warm supported access: orange;
- hot access to a relevant buyer or explicit offered intro: ember red.

Use labels and a legend, not color alone. The engine supplies these states. Do not turn a CSV-only connection hot for visual effect.

Separate social edges from employment edges. Being employed at the same company does not prove two people know each other. If the reachable person is an engineer, a dashed indication of an unverified buyer-routing possibility must not look like a confirmed relationship. Prefer simply ending the confirmed path at the company and labeling the next step as a question.

Gemini explanations and drafts come from the server. Show unknowns, evidence sources, sample-data labels, template-fallback status, and no-path states honestly. Do not show fake interaction counts or a fake live scraping/loading narrative. A spinner can say “Analyzing network”; it cannot say “Scanning LinkedIn” when nothing is scanning.

## Team reveal and CSV addition

Design the team selector so toggling a member triggers genuine recomputation. Dim irrelevant nodes and emphasize new supported access. Keep positions stable enough that the viewer understands the change.

For CSV import, you own file selection, file-owner selection, preview, warnings, and confirmation. Sahil supplies `normalizeConnections()`. After import, replace the browser-session snapshot, increment `inputRevision`, clear stale output, and reanalyze. Reject stale responses. Do not upload personal contact data into the public demo’s seed fixture.

The core must work without CSV. CSV must use the same graph pipeline, not a second import-only UI. A larger cluster/heat view is optional; avoid a new WebGL stack or unknown component dependencies.

## Collaboration loop

Work on `yanni-ui`. Before each new slice, check your working tree, fetch if authorized, and inspect Sahil’s latest pushed status:

```bash
git fetch origin
git show origin/sahil-engine:docs/STATUS_SAHIL.md
```

Only committed, pushed information is visible. A shared repository is not shared chat memory. Do not build a watcher, write into Sahil’s status, or assume his agent has received your private prompt.

After a useful slice, run relevant checks, update only `docs/STATUS_YANNI.md`, commit/push intentional files if authorized, and send a short READY/BLOCKED handoff with the actual SHA. Include what the backend must supply and any exact human action.

Sahil integrates ready commits. After a successful merge, merge `origin/main` into your work branch with a clean working tree. Do not use `git pull main`, force-push, or accept an agent’s unrelated cleanup during a conflict.

You may change spacing, typography, interaction, and visual polish within ownership. Ask before new packages, shared types, backend fields, new provider UI, altered score meaning, or changing the primary workflow. Never ship a button implying an unavailable integration is active.

## Time and submission

Priorities: first working UI/core → team reveal → CSV controls → graph polish → real product recording. Target feature freeze around 1:15 p.m. and a recording-ready deployment by 1:30. Reserve the final hour for videos, one-pager support, link checks, uploads, and submission. If behind, reduce graph ornament before functionality.

Prepare the one-minute choreography early: single network, add teammate, select an improved account, inspect path evidence, generate intro, end on brand. Use the actual hosted app and synthetic data; agents can help with narration/captions, but do not substitute generated footage of nonexistent behavior.

Use `HUMAN NOW: action | reason | success condition | fallback` for asset supply, credentials, product judgment, recording, and interface decisions. Do not claim testing or deployment you did not execute.

Begin by inspecting the environment and shared scaffold, then propose the simplest legible account-list/graph/evidence layout that can be wired immediately.
