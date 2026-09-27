# Dev log: AI Studio access and first working Cloud Run deploy

Date: 2026-09-27 (hackathon day). Author: Greg (wientjes). Branch: `claude/google-ai-studio-access-db00ba`.

## Context

PYRGRAPH was scaffolded in Google AI Studio under Sahil's Google account (the
"GitHub Connect" starter, see `metadata.json`). AI Studio Build apps are
per-account, so a second person cannot open that app directly. This log covers
getting a second AI Studio copy running, why the first Cloud Run deploy
failed, and how it was fixed.

## What was done

### 1. Getting the project into a second AI Studio account

- AI Studio > Build > **New app** > the **⊕** button in the prompt box >
  **Import from GitHub**. Authorize GitHub, pick `sahilm200/PyrGraph`, branch
  `main`.
- This creates an independent copy tied to that Google account. Changes made
  there do not flow back to GitHub or to Sahil's app unless pushed.
- The in-Studio Gemini agent should be told to read `AGENTS.md`,
  `PYRGRAPH_OPERATING_MANUAL.md`, `shared/CONTRACT.md` and
  `docs/DECISIONS.md` before touching code.

### 2. First Publish failed: container did not listen on PORT=3000

Cloud Run logs for revision `pyrgraph-00001-v4h`:

```
> react-example@0.0.0 start
> node server.ts
node:internal/modules/esm/resolve:275
    throw new ERR_MODULE_NOT_FOUND(
Container called exit(1).
```

Root cause: the original AI Studio scaffold's `server.ts` only imported npm
packages, so `node server.ts` (Node type-stripping) worked. The PYRGRAPH
scaffold commit added relative imports without file extensions
(`./shared/fixture`, `./src/core/graph`, ...; 23 such imports across
`server.ts`, `shared/` and `src/core/`). Node's ESM resolver requires
extensions and fails on the first one. Dev never noticed because the `dev`
script uses `tsx`, which resolves extensionless imports.

### 3. Fix (commit `74cd7b2`)

`package.json` only:

- `"start": "tsx server.ts"` (was `node server.ts`).
- `tsx` moved from `devDependencies` to `dependencies` so it exists at
  runtime after the buildpack prunes dev deps.

Verified locally: `npm install --legacy-peer-deps`, `npm run build`, then
`NODE_ENV=production PORT=3123 npm start`. `GET /api/health` returned 200
with `{"status":"ok","service":"pyrgraph-engine",...}`.

The same edit was applied in the AI Studio copy by replacing the file
contents in the code editor, then **Publish > Republish**. Existing Gemini
API key and spend cap were kept. GitHub OAuth env vars
(`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) were left unset; the Personal
Access Token path works without them.

### 4. Result

- Cloud Run service `pyrgraph` (us-east1) status **Ready**.
- https://pyrgraph-22796729499.us-east1.run.app/api/health returns 200 with
  `geminiConfigured: true`.
- Front page serves with the PYRGRAPH title.
- The `pyrgraph.ai.studio` vanity alias returned 404 immediately after
  publish; use the run.app URL until it propagates.

## Gotchas worth remembering

- **Redeploy = Publish.** In the AI Studio app view, the **Publish** button
  (top right) opens the panel that shows status, app URL, API key, and a
  **Republish** button. There is no separate "deploy" action.
- **Wrong Google account shows "Page not found".** App URLs
  (`aistudio.google.com/apps/<id>`) 404 if the browser session is a
  different Google account, even one that has GitHub access to the repo.
- **`npm install` fails on a peer conflict** (`vite@8` wants
  `esbuild ^0.27 || ^0.28`, repo pins `^0.25`). The repo is locked with bun
  (`bun.lock`). Use `npm install --legacy-peer-deps` if bun is not available.
  Do not commit a `package-lock.json`.
- **Ownership.** `package.json` is root config owned by Sahil. This fix
  needs to land on `main` via his integration, otherwise the next deploy from
  `main` fails the same way.

## Open items

- Decide whether the AI Studio app under Sahil's account or this copy is the
  canonical deploy console (README says one canonical writer).
- Confirm the `.ai.studio` alias resolves before putting it on the one-pager.
