# PyrGraph

**Turn your team's relationships into a clearer path to the right accounts.**

PyrGraph is a relationship intelligence application that helps teams discover which companies they can reach through people they already know. It combines individual networks, ranks account access using recorded relationship evidence, and helps prepare the next introduction or outreach request.

The core workflow is **“my network → our team's network.”** Adding a teammate reveals additional reachable accounts and shows who owns each connection. An account's evidence view explains the route; Gemini helps turn that context into a direct message, a teammate introduction request, or a routing question.

The current application is a prototype with a synthetic demo graph and a connections CSV importer. Demo contacts and relationships are fictional; recognizable company names do not imply actual access or verified buying intent.

## Explore the workflow

1. Enter the workspace with Sahil's sample network enabled.
2. Add Yanni's network. In the included fixture, reachable accounts increase from **2 to 4 out of 5**: Datadog becomes Hot and Figma becomes Warm.
3. Select an account to inspect the connection owner, contact, employer, and recorded evidence.
4. Draft direct outreach, a teammate introduction request, or a routing question for a contact who is not the target buyer. Choose executive, casual, or forwardable tone. The app sends no messages.
5. Try the connections CSV wizard: choose the network owner, review column mappings, preview normalized contacts, and confirm. Duplicate contacts and owner-to-contact edges are merged or skipped.

## Features

| Capability | Implementation |
| --- | --- |
| Team account access | Deterministic selection of direct team → contact → employer routes, filtered by active network owner. Accounts sort by access warmth, then stored fit score. |
| Evidence and next action | A coordinated account list, graph, and evidence drawer show the selected route, source notes, and suggested outreach action. |
| Connections CSV import | Quoted-field parsing, header detection, manual column mapping, identity deduplication, employer normalization, and import preview. Connection strength defaults to unknown. |
| Outreach drafting | Server-side Gemini receives the selected contact, relationship evidence, and product brief. A deterministic template fallback handles missing configuration or model failures. Responses label fallback use. |
| Interaction reliability | Analysis revisions prevent stale analysis responses from replacing newer state. Graph analysis also has a browser-side fallback. |
| Internal diagnostics | Fixture-based checks cover graph behavior, warmth rules, CSV ingestion, citation examples, and response contracts. The scorecard is an internal self-check. |

Access labels describe loaded evidence: **Cold** means no route in the loaded graph; **Connected** means a recorded connection with unknown strength; **Warm** means relationship evidence or a strong rating supports the route; **Hot** means stronger evidence reaches a contact marked as a buyer. Employer membership does not establish a social relationship.

## Current scope

The engine handles direct team-to-contact-to-employer routes. General multi-hop contact traversal is future work. Sample fit scores are seeded, and imported buyer relevance uses title heuristics; the prototype does not measure purchase intent or predict conversion. The **Import Accounts** panel is a placeholder. CRM, LinkedIn scraping, Apollo discovery, and autonomous outreach are not integrated.

## Architecture

One React/TypeScript frontend and an Express server share TypeScript contracts. Vite serves the development UI; the same-origin API evaluates submitted graph snapshots and generates drafts. Graph state is held in React memory rather than a database.

```text
React workspace + connections CSV wizard
                |
          same-origin API
                |
        Express / TypeScript
          |              |
  deterministic      Gemini drafting
  graph ranking      + template fallback
```

| Path | Purpose |
| --- | --- |
| `shared/contracts.ts`, `shared/fixture.ts` | Shared domain/API types and synthetic demo graph. |
| `src/core/graph.ts` | Account access, route selection, warmth, ranking, and graph view data. |
| `src/core/import/csv.ts` | Connections parsing and normalization. |
| `src/core/gemini.ts` | Prompts, drafting tones, model timeout/fallback, and draft cache. |
| `src/core/eval/` | Internal diagnostics and rubric implementation. |
| `server.ts`, `src/client/api.ts` | HTTP endpoints and client requests/fallbacks. |
| `src/ui/`, `src/App.tsx` | Workspace, graph, evidence drawer, import wizard, and presentation. |

## Run locally

Use a Node.js runtime compatible with this repository's Vite version. The repository includes `bun.lock`; npm users can use this workaround for the existing peer dependency conflict without creating another lockfile:

```bash
npm install --legacy-peer-deps --no-package-lock
cp .env.example .env
npm run dev
```

The app defaults to `http://localhost:3000`. Leave `GEMINI_API_KEY` empty in the copied `.env` to use template drafts with the synthetic graph. For live drafting, set it in the server environment or local `.env` file. Keep credentials outside Git. The relationship workflow does not require GitHub OAuth credentials.

```bash
npm run lint   # TypeScript check
npm run build  # Vite production build
```

These are available checks, not proof of live model quality or production readiness. The internal evaluation's citation tests include constructed examples; they do not establish that every generated message is grounded.

**Production startup:** `main` uses `node server.ts` with extensionless TypeScript imports. [PR #2](https://github.com/sahilm200/PyrGraph/pull/2) proposes a `tsx` runtime fix on `dev`; that change is not yet included in `main`. Use the development command above for local exploration.

## Data handling and prototype limits

Use synthetic data for public demonstrations. Imported CSV state lives in the browser session, but **analysis sends the normalized graph to the server**, and **drafting can send the selected contact, evidence, and product brief to Gemini**. This is not a browser-only processing guarantee.

Before using private contact data or hosting a shared service, address the process-wide draft cache, validate request schemas and submitted paths, and remove or harden the retained GitHub Connect OAuth/setup endpoints. The cache currently does not separate sessions or include all contact/evidence/product changes in its key. Model output is parsed as JSON, but full semantic validation and grounding enforcement remain work to do.

## Contributors

- **Sahil Malhotra:** graph/account engine, shared schemas and fixture, connections CSV normalization, Gemini/API integration, evaluation tools, and integration work. See the engine/import/evaluation commits and `docs/STATUS_SAHIL.md`.
- **Yanni (`yannouli`):** application presentation, graph and evidence interface, brand/assets, import wizard UI, animations, and recording workflow. See the UI commits and `docs/STATUS_YANNI.md`.
- **Greg (`wientjes`):** subsequent Cloud Run startup fix and deployment documentation on `dev`, described in [PR #2](https://github.com/sahilm200/PyrGraph/pull/2).

## Provenance and licensing

The project used AI coding tools and originated from the Google Gemini AI Studio repository template. The application reflects the team's shared implementation and integration work.

Several visual components identify Originkit as their source; the route palette cites cmocean, and sample avatars use Unsplash. No repository-wide license has been added. Confirm component and asset redistribution rights, retain required notices, and agree on a project license with contributors before presenting this as reusable open-source software.
