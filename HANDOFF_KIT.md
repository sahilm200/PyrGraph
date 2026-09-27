# PYRGRAPH handoff kit

This kit contains a shared operating manual, two role-specific startup prompts, and small repository coordination documents. It is planning material, not an implemented application.

## Use it

1. Both teammates read `PYRGRAPH_OPERATING_MANUAL.md`, especially sections 1, 2, 6, 7, and 9.
2. Give both agents the same manual and `shared/CONTRACT.md`.
3. Sahil pastes `SAHIL_START.md` into his coding-agent session. Yanni pastes `YANNI_START.md` into his.
4. At the permitted start, place the shared files at the project root, preserving their relative paths. `GEMINI.md` points Gemini CLI to `AGENTS.md`; in AI Studio explicitly ask the agent to read the files.
5. Sahil creates/validates the canonical scaffold and converts the contract blueprint to real shared types, runtime validation, and one fixture. Both branches start there.
6. Update decisions and short owner-specific status notes as the build evolves. Keep source code and documents aligned; do not maintain private incompatible versions.

**Default division:** Sahil owns the graph/API/Gemini and integration. Yanni owns the interface/graph visualization/brand and product recording. Both approve product-semantic changes.

**Default demo:** single-member network → add teammate → accounts and paths change → evidence → sensible introduction. CSV import is the first substantial addition. Apollo is optional.

**Default tools:** two local agents/branches if preflight succeeds; AI Studio is the canonical scaffold/deployment console. If using Studio plus a local editor, alternate sync windows rather than allowing two simultaneous canonical writers.

## The files

- `PYRGRAPH_OPERATING_MANUAL.md` — product, researched tooling constraints, architecture, additive scope, timeline, collaboration, sources.
- `SAHIL_START.md` — engine/integration agent prompt.
- `YANNI_START.md` — UI/demo agent prompt.
- `AGENTS.md` and `GEMINI.md` — repository entry instructions.
- `shared/CONTRACT.md` — proposed types, APIs, importer boundary, acceptance tests.
- `docs/DECISIONS.md` — shared changes and preflight facts.
- `docs/STATUS_SAHIL.md`, `docs/STATUS_YANNI.md` — short branch handoffs.
- `docs/SHIP.md` — build gates, optional queue, release/submission checklist.

No repository was created or changed in your GitHub account. No Cloud resources, API credentials, private contacts, or application code were added. The actual account/permission/deployment tests still need to happen in your environment.
