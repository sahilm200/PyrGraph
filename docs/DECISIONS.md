# PYRGRAPH Decisions and Preflight Record

## Environment & Event Confirmation (2026-09-27)
- **Sprint Window**: 11:30 a.m. – 2:30 p.m. PDT.
- **Team**: Sahil (in-person / Engine & Integrator) + Yanni (remote / UI & Presentation).
- **Brand**: PYRGRAPH (Charcoal, orange, ember red, flame/hearth motif).
- **Stack**: Single React + TypeScript + Node Express full-stack application running on port 3000, Vite dev server, deployment via Cloud Run.
- **AI Model**: Google Gemini API (`@google/genai`) for structured buyer relevance classification, evidence grounding, and outreach drafting.
- **Data Invariants**: 
  - Synthetic baseline demo graph for public demo and recording.
  - Client session-local graph state; bounded requests to stateless server endpoints.
  - Access warmth semantic:
    - **Cold** (`#6e7681`): No route in loaded data.
    - **Connected** (`#d29922` / pale amber): Connection recorded, strength unknown.
    - **Warm** (`#f0883e` / orange): Supported by relationship evidence or strong rating.
    - **Hot** (`#da3633` / ember red): Warm access reaches relevant buyer directly or explicit intro offer recorded.

## Accepted Technical Boundaries
1. Endpoints:
   - `GET /api/health`
   - `GET /api/bootstrap`
   - `POST /api/analyze`
   - `POST /api/intro`
2. Core Demo Workflow:
   - Start with Sahil's network enabled.
   - Toggle on Yanni's network ("My network -> Team network").
   - Accounts recalculate; newly reachable account turns Warm/Hot.
   - Click account, inspect shortest evidence-backed path.
   - Generate Gemini intro / routing request.
