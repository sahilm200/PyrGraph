# PYRGRAPH — two-person hackathon operating manual

**Team:** Sahil + Yanni  
**Event:** Berkeley × DeepMind, Sunday, September 27, 2026  
**Planning window:** 11:30 a.m.–2:30 p.m., America/Los_Angeles (PDT)  
**Status:** Proposed operating agreement, not a claim that the app or integrations already exist.  
**Brand:** Working name PYRGRAPH; flame/hearth-inspired identity; charcoal, orange, and ember red. Use Yanni’s existing logo if supplied. Do not spend the sprint recreating it.

## Read this first

**Build a small working product early, then improve it through independently shippable additions. Do not build two large halves and integrate them at the end.**

The default product is:

> **PYRGRAPH finds the accounts your team can already reach, explains the relationship evidence, and drafts the next reasonable introduction.**

The default workflow is:

**Load a network → describe what you sell → discover reachable accounts → inspect an evidence-backed path → draft the next message.**

The visual centerpiece is **“my network → our team’s network.”** Adding a teammate changes the actual graph, account ranking, and available routes. The app should reveal new access, not merely animate fictional connections.

Sahil owns the relationship engine, Gemini, shared interfaces, and integration. Yanni owns the interface, graph rendering, brand, and demo choreography. Both approve changes to the product’s meaning. Sahil is the single merge/deployment owner unless you explicitly reassign that role.

The earlier shared write-up reversed who was remote. This guide follows the original arrangement: Sahil in person, Yanni remote. Ownership does not depend on location. Confirm hybrid-team eligibility with the organizers.

---

## 1. What was verified, and what remains uncertain

### Event requirements

The published page specifies Gemini, a hosted AI Studio/Cloud Run prototype, a one-pager, a two-minute team/pitch video, a one-minute prototype video, and a code link through AI Studio sharing. In-person hacking is 11:30–2:30. Public demo-video engagement also matters. [S1]

The prerequisite asks participants to make and submit a small AI Studio test app and confirm GCP billing. This was also present in the organizer’s invitation email. Do not assume the prerequisite has been completed merely because registration was approved. [S1]

**Unresolved:** hybrid-team classification, whether “no video conferencing” describes the event broadcast rather than teammate calls, restrictions on pre-existing code/components, whether a particular video tool is mandatory, and any event-specific credits or quotas. The online deadline language conflicts with the general deadline. Treat 2:30 p.m. as your deadline unless organizers say otherwise. Do not treat our conservative preparation advice as a published prohibition on pre-event coding. [S1]

At the briefing, resolve these in one conversation. Record the answers in `docs/DECISIONS.md`, not separately in two chats.

### Google tooling

- **AI Studio Build** has a coding agent, React/Node full-stack support, GitHub import/two-way sync, and Cloud Run deployment. Its documentation explicitly says it does not support direct real-time collaborative editing. [S2]
- **Gemini CLI** is a separate local coding agent. Its documented runtime prerequisite is Node 20+, and it supports Google authentication; account type can affect setup. It reads `GEMINI.md` project context. [S3–S5]
- **Gemini API** is the model your finished app calls. Using a Gemini coding agent alone is not a substitute for genuine Gemini functionality in the product.
- AI Studio documents managed Workspace integrations, including Gmail and Contacts. Therefore, “Gmail is technically impossible in the sprint” is too strong. It is still an optional integration, not a dependency of your core demo. [S6]
- Deployment and usage depend on the account. Google documents both a restricted Starter Tier and standard billed deployment. Follow the event prerequisite instead of assuming either free hosting or special credits. [S7]
- API limits are project/model/tier dependent. Check your actual project; no fixed hackathon token allocation was verified. [S8]

### Three distinctions that prevent confusion

**Coding agent:** helps write the repository.  
**Application model:** answers users inside PYRGRAPH.  
**Hosting:** runs the app for judges.

These are separate systems, even when Google supplies all three. A working CLI login does not prove your deployed application has a working API key. An AI Studio preview does not prove the public Cloud Run URL works.

---

## 2. The product decision: network-first, account-level, short paths

The starting question should be:

> “We sell a sales-enablement product. Which companies in our team’s network are worth approaching, and who should make the introduction?”

Do not make users select a named executive before the app becomes useful. Do not optimize for elaborate chains through strangers.

### Core mode: discover within the imported network

1. Load the supplied synthetic demo network, or import a consented connection export.
2. Choose the team members whose networks are included.
3. Enter a short product description and, initially, a target buyer function such as RevOps.
4. Find accounts represented in the network.
5. Separate **account fit**, **buyer relevance**, and **relationship access**.
6. Show the best short entry route and the evidence behind it.
7. Generate the next practical message, addressed to the correct person.

An account search box is a filter over known accounts, not the main prerequisite and not a claim of global search.

### Optional mode: find new accounts externally

An Apollo integration can later feed additional companies into the **same account evaluator**:

**Product/ICP → approved search filters → Apollo companies → identity matching → existing graph → reachable / no supported path.**

A company discovered by Apollo is not automatically a warm account. Enrichment supplies company/person attributes, not private relationship edges.

Your idea of using network composition to guide discovery is useful with a constraint: **it may suggest search themes, but it must not silently redefine the customer profile.** Knowing two DevOps engineers does not establish that their employers sell DevOps software, nor that DevOps is the right market for your sales product.

An acceptable interface says: “Your network has several infrastructure contacts. Add infrastructure-related companies to this search?” The user sees and approves that interpretation. Avoid autonomous recursive search during the hackathon.

### The core does not require a known buyer

When the reachable contact is an engineer at a target account, say:

> “You have an entry point at this company. Ask whether they can direct you to the sales-operations team.”

Do not manufacture a relationship between that engineer and an invented VP of Sales.

---

## 3. The demo worth building

Use one page with three coordinated areas: **account list, graph, and evidence/action drawer**. A small import/product panel can open over it. No separate marketing site, authentication flow, or pricing page is needed for this proposed scope.

### The main interaction

Start with only Sahil’s network enabled. Show real counts computed from the current dataset.

Enable Yanni’s network. Shared people deduplicate; new accounts and relationships appear; the account ordering updates. A newly reachable account becomes orange. Click it, isolate the relevant path, then ask Gemini for an explanation and an introduction.

This demonstrates a causal chain:

**New data → changed graph → changed recommendation → different action.**

That is a stronger technical demonstration than a static graph plus generated prose.

### Three evidence states in the demo

Seed at least three contrasting accounts:

- A relevant buyer reachable through a teammate’s explicitly recorded relationship.
- An account with an ordinary connection but unknown relationship strength; recommend a low-pressure routing request.
- A target account with no supported connection; report the gap rather than inventing a path.

Use fictional people and clearly labeled synthetic relationship evidence. Real company names are optional; fictional company descriptions make demonstration claims easier to control.

### Visual semantics

Use the flame identity, but give the colors a stable meaning:

| Label | What it means | Suggested visual |
|---|---|---|
| No known path / cold | No route in the loaded data; not proof no relationship exists | Muted charcoal/gray |
| Connected | A connection is recorded, but strength is unknown | Pale amber |
| Warm access | Relationship evidence or a user rating supports a meaningful connection | Orange |
| Hot access | Warm access reaches a relevant buyer, or an intro offer was explicitly recorded | Ember red |

These are **access categories, not buying intent, trust measurements, or conversion probabilities**. A LinkedIn connection alone cannot turn an account hot. Include text labels and a legend; color cannot be the only signal.

A zoomed-out cluster view is optional. If added, aggregate company nodes and label it “network access,” not a statistical heat map. Default to a legible 2D layout; save WebGL, 3D physics, and particle effects for another project.

---

## 4. What your data actually establishes

LinkedIn’s official export covers first-degree connections; some email addresses are absent. It does not export an arbitrary second-degree network. Use the archive workflow, not a scrape-dependent demo. [S9]

### The right graph from two connection exports

Each file has an explicit owner selected during upload:

`Sahil → contact A`  
`Yanni → contact A`  
`Yanni → contact B`  
`contact A → employer`

That provides a real team graph. It does **not** establish `contact A → contact B`. Nor does shared employment prove two people know each other.

The connection date means when the platform connection was made, not when someone last spoke. A contact’s company/title is an exported profile attribute, not a independently verified current job. Preserve its provenance and observation date.

### Import behavior

Sahil implements the parser/normalizer; Yanni implements the upload controls and preview.

The parser should tolerate optional preamble rows, a UTF-8 byte-order mark, quoted commas, blank cells, and reasonable column aliases. Detect headers rather than relying on fixed column positions. Use a real CSV parser, not `split(',')`.

Preferred identity keys: canonical profile URL, then a usable email, then a conservative name-plus-company candidate. Do not automatically merge ambiguous names. Preserve separate records and show an “unresolved identities” count instead of building a merge-management product.

Normalize company aliases conservatively. Use domains when actually supplied; do not pretend every export contains company domains. Never invent an email address.

Repeated imports must not multiply the same owner-to-person connection. Retain multiple sources as evidence rather than counting them as independent relationships.

### How to add people later

For the sprint, another CSV is the main ingestion path. A simple manually entered contact or a “know them well” annotation is a useful addition after import works. Record self-reported evidence as self-reported.

Longer-term sources include consented Contacts/Calendar/email metadata, CRM activity, and permitted professional-network access. They should all normalize into the same graph shape. A LinkedIn scraping extension is not in the committed scope: LinkedIn explicitly prohibits scraping/automation extensions. [S10]

### Minimal privacy floor

Use synthetic data for the public demo and repository. Keep personal exports and API keys out of Git. Do not show private email addresses in recordings. Real CSV imports remain session-local; explain what normalized data is sent to the server/model. Avoid sending raw email bodies or the entire original CSV to Gemini.

“No production auth” does not mean “no safeguards.” Keep secrets server-side, cap request sizes, escape model/user text, and never automatically send outreach. Do not log raw graphs or uploaded files.

---

## 5. Architecture: one application, one contract, no agent framework

```text
React UI
  ├── session-local graph snapshot
  ├── team selector + product description
  ├── account list + graph + evidence drawer
  └── CSV upload UI
             │
     same-origin JSON API
             │
Node server
  ├── validate input
  ├── deterministic graph retrieval
  ├── conservative scoring / account eligibility
  ├── Gemini: buyer relevance, grounded explanation, draft
  └── optional account-discovery adapter
             │
          Cloud Run
```

Keep the initial AI Studio-generated stack. Default to React + TypeScript + Node; do not introduce Next.js, Python, a second backend, a graph database, or persistent storage merely because an agent prefers them.

### What “graph RAG” means here

Retrieve a small evidence-backed subgraph in code, then give that context to Gemini. That is graph-based retrieval-augmented generation. Do not claim to implement a particular research GraphRAG algorithm, a learned social model, or a calibrated trust engine.

### Deterministic work

Code handles identity normalization, graph traversal, route deduplication, active-team filtering, account membership, score arithmetic, evidence lookup, and unknown/no-path behavior.

The normal route begins at a consenting team member and ends at a reachable person’s employer. Employment is structural information, not a social introduction. Allow at most two person-to-person edges, and only when both have explicit evidence. In the CSV-only version, most useful routes have just one such edge.

Do not create a universal “team” connection between all contacts. Do not count shared nodes or duplicate source records as new independent paths.

### Gemini work

Gemini reads the product brief and retrieved people/title/evidence records. It can classify buyer relevance, explain the selected account/route, flag uncertainty, and write the next message. Use structured output and validate both shape and returned IDs. Structured JSON does not guarantee the model’s factual interpretation is correct. [S11]

Use no more than one bounded analysis call per user analysis and one call when a draft is requested. Do not call the model on hover or once for every graph node. Keep a selected model configurable; test the exact available model in your project.

The model must choose from supplied IDs, never invent a person, employment relationship, last-contact date, or confidence percentage. Its recommendation cannot turn an unsupported link into a supported edge.

### Next-message logic

- Best route belongs to **Yanni**, viewer is **Sahil**: draft Sahil’s request to Yanni plus a forwardable blurb.
- Viewer directly knows the relevant buyer: draft direct outreach, not an unnecessary intro request.
- Viewer knows a nonbuyer at the company: draft a routing request asking who owns the relevant function.
- No supported route: explain the gap and offer no fabricated intro.

### State and API choices

Use an immutable seeded snapshot for the demo and a separate graph in each browser’s memory. Send the normalized snapshot in analysis requests, bounded to a modest size. The server processes each request independently.

This deliberately avoids an upload endpoint that overwrites a global JSON file. Cloud Run’s writable filesystem is not durable across instance stops, and instance-local state is not a shared database. [S12]

`shared/CONTRACT.md` defines the proposed boundary. At kickoff, Sahil converts it to `shared/contracts.ts` and runtime schemas, plus **one shared fixture**. Both agents use that same fixture. Do not independently invent frontend mock data and backend responses.

Use an `inputRevision` to ignore stale responses after imports, team changes, or product edits. Keep schema version `1` until both people approve a change. The intro endpoint must validate its route against the submitted snapshot, not depend on a path ID hidden in a previous server process.

---

## 6. Build order: vertically complete additions

These are priority gates and planning targets, not guarantees about coding speed. A gate is complete only after its acceptance check passes.

| Gate | What becomes available | Acceptance check | Cut/fallback |
|---|---|---|---|
| B0 — deployed foundation | App shell, seeded snapshot, three API contracts, first public URL, verified Gemini credential | Incognito opens app; server health and one model call succeed | Plain UI; no animation |
| B1 — complete core | Known accounts ranked from graph; short route; evidence; genuine Gemini explanation/draft | Change active member or product input, recompute, inspect path, draft correct first message | Fewer accounts and a simple path strip |
| B2 — team reveal | My network versus team network; rankings and node colors genuinely change | Known fixture account becomes reachable only with Yanni included | Basic toggle, no cinematic transition |
| B3 — CSV input | Owner-selected import, preview, normalization, duplicate handling | Add a small sample CSV; counts and recommendations change; import twice does not duplicate | Prepared normalized sample, disclosed honestly |
| B4 — one enhancement | Choose one: manual relationship rating, graph polish, natural-language filters, or optional provider | Works without breaking B1–B3; disabled cleanly | Leave feature off |
| SHIP | Stable hosted build and all submission assets | Stranger can use URL; every required link is checked | No new features |

B1 must include a real Gemini result before claiming the product uses Gemini. An explicitly labeled template fallback is resilience, not a substitute for the required functioning integration.

**Recommended finish:** B0–B3 plus restrained graph polish. Apollo is not the default finish line.

### Timebox for the three-hour window

| Local time | Joint checkpoint / work |
|---|---|
| 11:30–11:45 | Confirm scope, select tools, create canonical scaffold, freeze contract/fixture, assign files |
| 11:45–12:10 | Build first narrow end-to-end flow in parallel; deploy the minimal app early |
| 12:10–12:40 | Integrate live core, team reveal, and CSV work; compare actual JSON, not descriptions |
| 12:40–1:15 | Finish working additions and graph polish; choose at most one optional enhancement |
| 1:15 | Feature freeze; disable incomplete add-ons; take an integration checkpoint |
| 1:15–1:30 | Public deployment, model test, incognito smoke test, establish recording build |
| 1:30–2:05 | One-pager, one-minute real product recording, two-minute team pitch, upload |
| 2:05–2:20 | Validate links, permissions, public-video requirement, repository/AI Studio sharing; submit |
| 2:20–2:30 | Buffer for submission/critical defects only |

Additionally, exchange a short status at each completed slice or roughly every 10–15 minutes of active coding. Do not wait for the next formal checkpoint to report an API mismatch.

### Compression rules

At 90 minutes remaining, no end-to-end flow means all integration work takes precedence over CSV polish, animations, and external services. At 60 minutes remaining, freeze features and prepare assets. At 30 minutes remaining, do not start an integration even if it sounds like a five-minute task.

If an infrastructure problem persists, ask an organizer for help with the exact error while the other person continues on the local app. Never imply that a local-only app satisfies a hosted-demo requirement. Preserve the last functioning deployment when an update fails.

---

## 7. Choose a collaboration mode once

### Recommended: two local coding agents; AI Studio as scaffold/deployment console

Use this when both computers have a functioning local editor/CLI and Git access before the sprint.

```text
Sahil + local Gemini agent ── sahil-engine ─┐
                                         ├─ integration check ─ main ─ AI Studio ─ Cloud Run
Yanni + local Gemini agent ── yanni-ui ────┘
```

AI Studio is used to create/import the application and publish the merged result. During parallel local development, do not simultaneously ask its agent to rewrite the app. That would introduce an uncontrolled third writer.

Google-only coding is achievable using Gemini CLI for both contributors. Other coding assistants are not publicly ruled out by the page, but do not assume event permission; confirm before relying on them.

### Fallback: Sahil in AI Studio, Yanni local

This is workable, but test the round trip with a harmless text change first. Do not assume the Studio UI exposes the branch controls you need merely because GitHub sync exists.

During an integration window: pause Studio edits → push/save Studio work → fetch it locally → integrate Yanni’s approved changes → push the merged result → explicitly pull into Studio → test → resume.

There must never be simultaneous GitHub/Studio pushes to the canonical branch. If branch selection is unavailable, treat Studio as the single canonical editor and have Yanni deliver a narrowly scoped, reviewed UI patch. Use one human to apply it. Do not allow a stale Studio workspace to overwrite merged work.

If neither local agent is ready, use one Studio writer and one active reviewer/designer. That is less parallel but more reliable than learning an untested remote-agent system during the deadline.

---

## 8. Ownership: allow creativity without breaking the boundary

| Area | Owner | Notes |
|---|---|---|
| `src/ui/**`, UI styles, graph renderer, supplied assets | Yanni | May change layout/animation freely within existing semantics |
| `src/App.tsx` (or agreed app entry) | Yanni | Keep API adapter as the only backend boundary |
| `server/**`, `src/core/**`, importer, scoring, prompts | Sahil | Pure data/graph logic and API behavior |
| `src/client/api.ts` | Sahil | Frontend consumes this typed adapter |
| `shared/**`, root config, package/lock files | Sahil as integrator | Changes require notice; shared semantics require both people |
| `docs/STATUS_SAHIL.md` / `STATUS_YANNI.md` | Named owner only | Do not write into your teammate’s status file |
| Product meaning / demos / user claims | Joint | Sahil records the decision |
| Merge to `main`, AI Studio sync, deployment | Sahil | Explicitly transfer ownership if necessary |
| Product recording and visual QA | Yanni | Use the real deployed flow |
| One-pager, pitch narrative, final submission | Sahil | Both appear/contribute where required |

Map these paths to the generated scaffold once; document substitutions. Do not restructure a working app just to match this directory spelling.

Dependencies are a common conflict source. Yanni requests a package; Sahil installs it and updates the lockfile, then both pull. Prefer known compatible UI-archive components. Source/license and existing dependencies matter more than the number of visual effects.

---

## 9. Agent coordination: a readable protocol, not a watcher project

Two agents do not share chat memory. A Markdown file on one branch does not change on the other branch automatically. A completed push makes committed changes available; a fetch updates remote-tracking references; reading those references is a separate action. [S13–S14]

### Canonical files

- `AGENTS.md`: concise operating rules.
- `GEMINI.md`: Gemini CLI entry point importing `AGENTS.md`.
- `PYRGRAPH_OPERATING_MANUAL.md`: shared product/operating context.
- `shared/CONTRACT.md`, later `contracts.ts`: interface and shared vocabulary.
- `docs/DECISIONS.md`: approved changes and environment facts; Sahil maintains it.
- `docs/STATUS_SAHIL.md`, `docs/STATUS_YANNI.md`: current task, files, blockers, handoff.
- `docs/SHIP.md`: backlog choices and submission state.

Gemini CLI supports `GEMINI.md`; do not assume every other agent automatically reads it. In AI Studio, explicitly ask it to read the relevant files and state its ownership before editing. Files are instructions, not locks or access controls.

### Before each meaningful task

The agent should check the current branch and working tree, read accepted decisions/contracts, fetch if authorized, and inspect the teammate’s pushed status. It should then state its next small slice and the human action needed, if any.

Read the peer’s latest pushed status without checking out their branch:

```bash
git fetch origin
git show origin/yanni-ui:docs/STATUS_YANNI.md
# or, from Yanni's workspace:
git show origin/sahil-engine:docs/STATUS_SAHIL.md
```

If a branch/file does not yet exist, report that and continue only on the already-agreed contract. Do not invent progress. These commands cannot reveal uncommitted work or the other person’s private chat.

### Handoff message

After a useful slice, test, update your own status, commit selected owned files, and push. Send a short human-visible handoff:

```text
READY B3-importer | branch sahil-engine | commit <actual SHA>
Contract: v1 unchanged. Files: src/core/import/*; tests/import.*
Verified: duplicate import + missing email + quoted CSV cases pass.
Yanni action: connect the upload control to normalizeConnections().
Human action: choose file owner; do not upload private data for recording.
```

A status can be `WORKING`, `READY`, or `BLOCKED`. WIP may be pushed for visibility, but only an explicitly ready commit is merged. Status reports stay under about 100 words. Do not turn documentation upkeep into a second project.

### Why no watcher agent

Gemini CLI documents subagents and remote-agent facilities. That is not evidence that AI Studio supplies a ready-made cross-computer watcher/merge workflow. [S15]

A watcher that notices changed text still does not know whether the code compiles, whether the change was approved, or whether it is safe to merge. For two people already on a call, task-boundary fetches and explicit “ready” messages are sufficient.

An optional local read-only status check is fine. Do not add an always-running model, A2A server, event bus, or autonomous merge bot during this sprint. An idle coding agent may need another prompt; do not assume it wakes itself when a file changes.

---

## 10. Git integration protocol

Use one repository, `main`, `sahil-engine`, and `yanni-ui`. Only the integrator updates `main` after the initial scaffold. No force-pushes, destructive resets, or unreviewed AI “cleanup.”

At kickoff, both branches start from the same committed scaffold. All three use the same lockfile and schema version.

Before updating a work branch, inspect for local changes. Commit the intended work or deliberately preserve it; never let an agent discard it automatically. Then:

```bash
git fetch origin
git switch yanni-ui       # Sahil uses sahil-engine
git merge origin/main
```

Do not use `git pull main`: `main` is normally a branch, not a remote. Do not blindly stage the whole repository; inspect staged files for secrets and real exports.

### A merge is a small release

1. Both workers identify ready commit SHAs and pause edits that affect the integration.
2. Sahil fetches and creates a temporary integration branch from `origin/main` in a clean workspace.
3. Merge only those ready commits. Inspect conflicts, especially shared contracts, imports, and the lockfile.
4. Run type checking, non-watch tests, and production build. Actually click the core flow.
5. Fast-forward `main` to the successful integration commit and push. Both workers merge the new `origin/main` into their own branches.
6. Pull that version into AI Studio, test, and deploy at release checkpoints. Record which Git commit the deployment represents.

Suggested commands, with real names/SHAs substituted:

```bash
git fetch origin
git switch -c integrate/checkpoint-01 origin/main
git merge --no-ff <SAHIL_READY_SHA>
git merge --no-ff <YANNI_READY_SHA>
npm ci
npm run typecheck
npm test
npm run build
# Smoke-test before advancing main.
git switch main
git merge --ff-only integrate/checkpoint-01
git push origin main
```

Use a new integration-branch name each round. Run these only with a clean working tree and no coding agent simultaneously modifying that directory. A separate integration worktree is optional, not required.

Configure the named test scripts during scaffold creation. A missing script is not a passed check. If a conflict changes product meaning, stop and ask both humans; do not choose an entire file’s version just because the UI offers that shortcut.

---

## 11. Changing your minds safely

This plan permits iteration. It prohibits invisible cross-team changes.

**Local, nonbreaking improvement:** the owner can implement it. Examples: padding, copy length, a legend, a transition, a clearer evidence card. Tell the teammate at the next handoff.

**Cross-boundary change:** propose it before coding. Examples: new API field, changed heat meaning, extra Gemini call, new external provider, changing primary flow, installing a package.

Use this compact proposal:

```text
CHANGE: add network-aware Apollo search
User-visible benefit: discover new candidate accounts from the same product brief.
Touches: server provider + shared query type + UI controls.
Dependency: working key/entitlement; one successful sample request.
Fallback: core network discovery remains unchanged; provider flag stays off.
Decision needed: both approve; what existing work gets removed?
```

Sahil records accepted decisions on `main`; both agents fetch and acknowledge before depending on them. Prefer additive optional fields and capability flags. If a schema must break, pause both sides and update the contract/fixture first.

A new user suggestion is not automatically permission for the agent to implement an entire feature. The agent should distinguish “explore the idea” from “build it now,” state the impact, and recommend whether to add, replace, or defer. Both humans may intentionally change this plan; record that decision rather than silently letting old and new plans coexist.

### Human actions should be explicit

Agents should label necessary intervention as:

`HUMAN NOW: [specific action] | Why | Exact success condition | Fallback`

Typical human work: approve permissions/spending, choose CSV owner, confirm whether a relationship is real, supply the logo, judge the intro’s tone, resolve an API change, record video, and submit.

The agent can independently implement agreed code, run tests, inspect branch diffs, and draft documentation within its actual permissions. It must not claim to have deployed, authenticated, fetched, or tested something it did not do.

---

## 12. Optional features, in the order I would consider them

**Manual strength annotation:** a user marks an existing connection “know well.” This makes the graph more honest and changes access scoring without pretending a CSV contains trust. Low dependency, clear visible effect.

**Better graph interaction:** selected-path illumination, stable company clusters, useful hover evidence, or the team reveal. Prefer a working graph library already in the scaffold/archive; a simple layout is a legitimate fallback.

**Natural-language query:** translate a brief into visible, editable filters. Use only supported fields. Missing company size/industry remains unknown unless a source supplies it.

**Apollo organization discovery:** the current API supports company search with filters; access and credits apply. Test an actual authorized request first. People search is separate and does not return email/phone contact data. [S16–S17]

**Managed Google Contacts or email metadata:** feasible to investigate through AI Studio’s documented integrations, but only after the core is shipped and only with explicit consent. Test authorization, available fields, and public deployment behavior. Do not quietly broaden scopes or ingest whole inboxes.

**Deferred:** LinkedIn scraping, autonomous outreach, CRM writeback, a full identity-resolution service, predictive intent scoring, multi-tenant persistence, and elaborate multi-agent orchestration.

Any optional provider must fail visibly and locally. Never silently replace a live request with seeded data while labeling it live.

---

## 13. Submission and demonstration

Prepare the story while code runs; do not wait until recording time to decide what the product does. Use agents for the outline, captions, and Q&A. Record the actual app; generated video of imaginary functionality is not a prototype demo.

### One-minute product recording

- **0–10 seconds:** “Your next customer may already be in your team’s network.” Show product brief and the single-member graph.
- **10–25:** Add the teammate. Let genuine accounts/paths update. Describe the data as sample data when it is synthetic.
- **25–40:** Select a recommended account. Highlight the supported path and open its evidence.
- **40–55:** Generate the correct intro request or routing message. Show a real Gemini response.
- **55–60:** End on the brand and a restrained line: “Find the access your team already has.”

Do not announce pre-scripted numeric counts unless they match the loaded data. Record on a synthetic session with notifications hidden. Prefer one clean take over a complex editing pipeline.

### Two-minute team pitch

Cover problem, product, why a team graph matters, the demonstrated workflow, Gemini’s specific role, and the next step. Avoid unsupported conversion multipliers, claims that nobody else does relationship intelligence, or promises of reaching anyone.

### One-pager

Include team, problem, solution, how it works, what is live, what is sample data, and next steps. Describe implemented features only after the release is checked.

### Final checks

Verify the public app in incognito, the model call, code/AI Studio share access, video visibility, one-pager permissions, and submission confirmation. Check the actual form for any tool-specific recording requirement. Keep a backup recording and the previous working deployment.

A permissioned team graph, richer evidence, optional CRM/Contacts integrations, and external prospect discovery are reasonable future work. They are not “already integrated” unless they actually are.

---

## 14. Sources and evidence boundaries

Sources were checked for this handoff on September 27, 2026. Current documentation describes capability, not a successful test in either teammate’s account. The actual permission/credential/round-trip checks remain preflight tasks. No personal network data, API keys, or existing project code was copied into this package.

[S1] Event page: `https://luma.com/vmqjw9hv`  
[S2] AI Studio Build: `https://ai.google.dev/gemini-api/docs/aistudio-build-mode`  
[S3] Gemini CLI installation: `https://geminicli.com/docs/get-started/installation/`  
[S4] Gemini CLI authentication: `https://geminicli.com/docs/get-started/authentication/`  
[S5] Project context: `https://geminicli.com/docs/cli/gemini-md/`  
[S6] Full-stack / Workspace integration: `https://ai.google.dev/gemini-api/docs/aistudio-fullstack`  
[S7] Deployment: `https://ai.google.dev/gemini-api/docs/aistudio-deploying`  
[S8] Gemini API limits: `https://ai.google.dev/gemini-api/docs/rate-limits`  
[S9] LinkedIn export: `https://www.linkedin.com/help/linkedin/answer/a566336`  
[S10] LinkedIn software restrictions: `https://www.linkedin.com/help/linkedin/answer/a1341387`  
[S11] Structured outputs: `https://ai.google.dev/gemini-api/docs/structured-output`  
[S12] Cloud Run runtime contract: `https://docs.cloud.google.com/run/docs/container-contract`  
[S13] Git fetch: `https://git-scm.com/docs/git-fetch`  
[S14] Git show: `https://git-scm.com/docs/git-show`  
[S15] Gemini CLI subagents: `https://geminicli.com/docs/core/subagents/`  
[S16] Apollo organization search: `https://docs.apollo.io/reference/organization-search`  
[S17] Apollo people search: `https://docs.apollo.io/reference/people-api-search`
