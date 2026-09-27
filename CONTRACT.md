# PYRGRAPH interface agreement — proposed v1

This is an implementation blueprint, not running code. At kickoff, Sahil turns it into `shared/contracts.ts`, runtime input/output validation, and one shared fixture. Both contributors approve any change to these semantics. Preserve the generated scaffold’s paths where practical.

## Invariants

- The source graph contains people, accounts, explicit person-to-person connections, employment facts, and provenance. It contains no imagined coworker relationships.
- A route starts at an included team member. Employment does not count as a social hop.
- The default explores at most two person-to-person edges. No source evidence means no traversable edge.
- `strength: "unknown"` is valid and is the default for a LinkedIn-only connection. Scores are heuristics, never probabilities.
- The viewer and the network owner can differ. A recommendation must identify the right person to approach first.
- UI receives semantic states from the engine. UI must not recompute warmth or invent counts.
- Imports modify the browser’s session snapshot, not a global server dataset. Analysis/draft requests are independently reproducible from their inputs.
- Every asynchronous response echoes `inputRevision`. The UI ignores it if the current revision differs.
- Product/model/API results identify sample data and fallback modes explicitly.

## Proposed shared types

```typescript
export type Id = string;
export type Strength = "unknown" | "weak" | "medium" | "strong";
export type BuyerFit = "unknown" | "low" | "medium" | "high";
export type AccessLabel = "cold" | "connected" | "warm" | "hot";
export type RunMode = "gemini" | "template_fallback";

export interface Evidence {
  id: Id;
  source: "synthetic" | "linkedin_export" | "manual" |
          "email_metadata" | "apollo";
  summary: string;
  observedAt?: string;           // ISO date/time, only when known
  isSynthetic: boolean;
}

export interface Person {
  id: Id;
  name: string;
  title?: string;
  profileUrl?: string;
}

export interface Account {
  id: Id;
  name: string;
  domain?: string;
  description?: string;
  industry?: string;
  employeeCount?: number;
  evidenceIds: Id[];
}

export interface Connection {
  id: Id;
  fromPersonId: Id;
  toPersonId: Id;
  kind: "platform_connection" | "reported_relationship" |
        "interaction_relationship";
  strength: Strength;
  direction: "mutual" | "from_to"; // Follow the recorded direction
  connectedOn?: string;         // Not a last-contact timestamp
  lastInteractionAt?: string;   // Only backed by appropriate evidence
  evidenceIds: Id[];
}

export interface Employment {
  personId: Id;
  accountId: Id;
  evidenceIds: Id[];
}

export interface GraphSnapshot {
  schemaVersion: "1";
  people: Person[];
  accounts: Account[];
  connections: Connection[];
  employment: Employment[];
  evidence: Evidence[];
  teamMemberIds: Id[];
}

export interface ProductBrief {
  description: string;
  targetBuyerFunction: string;  // Explicit input or visible editable inference
  targetIndustries?: string[];
}

export interface AnalysisInput {
  schemaVersion: "1";
  inputRevision: number;
  snapshot: GraphSnapshot;
  viewerPersonId: Id;
  activeTeamMemberIds: Id[];
  product: ProductBrief;
  targetAccountIds?: Id[];      // Omit for network-first discovery
}

export interface Route {
  id: Id;                      // Stable for this route's constituent IDs
  originMemberId: Id;
  personIds: Id[];              // Starts with origin member, ends at contact
  connectionIds: Id[];
  accountId: Id;
  entryContactId: Id;
  evidenceIds: Id[];
  accessScore: number;          // 0–100 heuristic index, NOT probability
  accessLabel: AccessLabel;
  buyerFit: BuyerFit;
  actionKind: "direct_message" | "intro_request" | "routing_request";
  recipientPersonId: Id;        // Determined relative to viewerPersonId
  caveats: string[];
}

export interface AccountRecommendation {
  accountId: Id;
  eligible: boolean;            // Explicit known ICP conflicts may exclude
  fitStatus: "match" | "unknown" | "conflict";
  fitReasons: string[];
  accessLabel: AccessLabel;
  accessScore: number;
  routeCount: number;
  routes: Route[];              // At most three useful distinct routes
  bestRouteId?: Id;             // Absent when no supported route exists
  reason: string;
  evidenceIds: Id[];
  caveats: string[];
}

export interface AnalysisResult {
  schemaVersion: "1";
  inputRevision: number;
  mode: RunMode;
  recommendations: AccountRecommendation[];
  summary: {
    includedTeamMembers: number;
    reachableAccounts: number;
    distinctReachableContacts: number;
  };
  warnings: string[];
}

export interface IntroInput extends AnalysisInput {
  accountId: Id;
  routeId: Id;
}

export interface IntroResult {
  schemaVersion: "1";
  inputRevision: number;
  mode: RunMode;
  routeId: Id;
  recipientPersonId: Id;
  actionKind: Route["actionKind"];
  subject: string;
  body: string;
  forwardableBlurb?: string;
  evidenceIds: Id[];
  caveats: string[];
}

export interface BootstrapResult {
  schemaVersion: "1";
  snapshot: GraphSnapshot;
  defaultViewerPersonId: Id;
  defaultProduct: ProductBrief;
  capabilities: {
    csvImport: boolean;
    externalDiscovery: boolean;
    manualStrength: boolean;
  };
  dataLabel: string;             // e.g. "Synthetic demo network"
}

export interface ApiError {
  schemaVersion: "1";
  error: {
    code: "INVALID_INPUT" | "STALE_ROUTE" | "NO_SUPPORTED_ROUTE" |
          "MODEL_UNAVAILABLE" | "PROVIDER_UNAVAILABLE" | "INTERNAL";
    message: string;
    retryable: boolean;
  };
}
```

## Core API

| Endpoint | Request | Success response |
|---|---|---|
| `GET /api/health` | None | `{ ok: true, schemaVersion: "1" }` |
| `GET /api/bootstrap` | None | `BootstrapResult` |
| `POST /api/analyze` | `AnalysisInput` | `AnalysisResult` |
| `POST /api/intro` | `IntroInput` | `IntroResult` |

Use corresponding HTTP error status codes plus `ApiError`. No supported route is a normal analysis outcome, not a server crash. A draft request for a nonexistent route is an error. The UI displays the error in context and preserves graph state.

A model failure may return a functioning deterministic analysis or template draft with `mode: "template_fallback"` and an explicit warning. Never label it as Gemini output. A valid live Gemini path must still work in the actual submission.

The frontend calls a single typed adapter, such as `src/client/api.ts`. Sahil supplies that adapter and a fixture-backed implementation during initial development. Switching to real fetch calls must not require rebuilding Yanni’s UI.

### Import function boundary

Sahil supplies a pure browser-compatible function:

```typescript
normalizeConnections(
  csvText: string,
  ownerPersonId: Id,
  existing: GraphSnapshot
): {
  snapshot: GraphSnapshot;
  addedPeople: number;
  addedConnections: number;
  skippedDuplicates: number;
  unresolvedIdentities: number;
  warnings: string[];
}
```

Yanni supplies file selection, owner selection, preview, confirmation, and UI state. After confirmation, replace the session snapshot, increment `inputRevision`, clear obsolete recommendations/drafts, and re-run analysis on user action. Never overwrite the public seed data.

Agree on limits at kickoff; a reasonable proposed cap is 1 MB input and 2,000 people for the sprint. If a file exceeds a limit, show a clear error or explicit sample-selection option, never silently discard rows while displaying full-network claims.

## Grounding and scoring implementation notes

1. Validate IDs, types, lengths, edge references, and team membership before use. Treat all imported strings as data, not prompt instructions.
2. For team access, traverse explicitly evidenced person relationships, starting at each active member. Do not infer links between their other contacts. Do not route through an inactive teammate and thereby defeat the team selector.
3. Join the final contact to its account using employment records. If employment conflicts, mark uncertain rather than silently choosing a job.
4. Retrieve a bounded candidate set and evidence. Gemini can classify the relevance of supplied titles and explain tradeoffs. Validate every returned ID and enumerated value.
5. Enforce explicit ICP conflicts in code. Unknown industry or headcount cannot become an exact match. Do not infer employer industry from an employee's job function.
6. Rank using a documented heuristic that Sahil fixes in one engine module. Suggested initial relationship weights: unknown .25, weak .35, medium .65, strong .85; penalize each additional person edge by .7 and favor relevant reachable buyers. These are demo design choices, not learned estimates. Keep independent route counts separate; repeated evidence is not a new route.
7. Use deterministic tie-breaking by account/person ID. Never ask the model to do route enumeration or arithmetic.
8. `connected`: recorded relationship but insufficient strength evidence. `warm`: meaningfully supported medium/strong route. `hot`: warm route to a relevant buyer or explicit intro offer. `cold`: no supported route. UI must describe all as access.
9. A recipient is chosen before asking Gemini to write. If the route belongs to another team member, the first ask usually goes to that teammate. If the viewer knows the entry contact, address that contact. Do not invent a named buyer at the other end of a routing request.
10. Intro requests include the snapshot again. Recompute and validate the structural route independently. Do not assume instance-local state from an earlier call survives. The frontend rejects any response with an obsolete revision.

## Shared fixture requirements

At kickoff create one small synthetic fixture, not three unrelated mock files. Both the frontend mock adapter and backend tests consume it.

Include two team members, one shared contact, one relevant contact unique to Yanni, a nonbuyer entry contact, one explicitly unsupported target account, a duplicate record, and a missing-email case. Keep all counts computed, and mark the fixture synthetic. Do not use private acquaintances from earlier chats.

## Required smoke tests

- Single-member and team analyses differ for the intended seeded account.
- Re-importing the same file does not double-count people or owner edges.
- Two same-company people do not gain a person-to-person relationship.
- Connection date is never displayed as last communication.
- Unknown strength stays unknown unless new source evidence is supplied.
- No-path account yields no fake route or intro button.
- The first-message recipient changes appropriately when the route belongs to Yanni versus Sahil.
- Gemini cannot select IDs outside the retrieved candidate set.
- Stale analysis cannot overwrite the latest team/graph state.
- Both successful and failed API calls leave the UI usable.

## Changes

Sahil owns the implemented schema. Both humans approve semantic changes. Add a short decision, update runtime schemas and the shared fixture first, then migrate each side. Avoid a schema-version change for cosmetic UI improvements.
