# PYRGRAPH Shared Contract v1

This document specifies the exact shared types and API boundaries between Sahil (Engine/Server) and Yanni (UI/Presentation).

## 1. Domain Entities

### TeamMember
```typescript
interface TeamMember {
  id: string; // 'sahil' | 'yanni'
  name: string;
  role: string;
  avatar: string;
}
```

### Access Warmth
- `'cold'`: No route in loaded data.
- `'connected'`: 1st-degree connection exists, but relationship strength unknown.
- `'warm'`: Route supported by verifiable relationship evidence, prior collaboration, or high rating.
- `'hot'`: Route reaches a verified target buyer directly, or an explicit introduction offer is recorded.

### RankedAccount
```typescript
interface RankedAccount {
  id: string;
  name: string;
  domain: string;
  industry: string;
  fitScore: number; // 0-100 product fit
  accessWarmth: 'cold' | 'connected' | 'warm' | 'hot';
  bestPath: ShortestPath | null;
  buyerRelevanceReason: string;
  targetBuyerIdentified: boolean;
  reachableViaMembers: string[];
}
```

### ShortestPath
```typescript
interface ShortestPath {
  ownerMemberId: string;
  hops: number;
  accessWarmth: 'cold' | 'connected' | 'warm' | 'hot';
  steps: PathStep[];
  primaryEvidence: string[];
  recommendedActionType: 'direct_outreach' | 'teammate_intro_request' | 'routing_request' | 'cold_unsupported';
}
```

## 2. API Endpoints

### `GET /api/health`
Returns system status and model readiness.

### `GET /api/bootstrap`
Returns initial seeded team members, product brief, and default graph snapshot.

### `POST /api/analyze`
Receives current session graph snapshot, active team member IDs, and product brief.
Returns ranked accounts and graph presentation node/edge states.

### `POST /api/intro`
Receives account, target path, product brief, and requesting viewer.
Invokes Gemini to generate grounded intro request, forwardable blurb, or internal teammate routing ask.
