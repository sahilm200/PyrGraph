/**
 * PYRGRAPH Shared Contracts v1
 * Controlled interface shared across Sahil (Engine/Server) and Yanni (UI/Presentation).
 */

export type AccessWarmth = 'cold' | 'connected' | 'warm' | 'hot';

export interface TeamMember {
  id: string; // 'sahil' | 'yanni'
  name: string;
  role: string;
  avatar: string;
  title: string;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  companyName: string;
  companyId?: string;
  email?: string;
  linkedinUrl?: string;
  location?: string;
  isTargetBuyer?: boolean;
}

export interface CompanyAccount {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employeeCount: string;
  fitScore: number; // 0 - 100
  fitReason: string;
  targetBuyerRoles: string[];
}

export type EdgeType = 'team_to_contact' | 'contact_to_contact' | 'contact_to_company';
export type EdgeStrength = 'unknown' | 'acquaintance' | 'strong' | 'self_reported_close';

export interface EvidenceItem {
  id: string;
  type: 'linkedin_connection' | 'shared_work_history' | 'explicit_intro_offer' | 'self_reported' | 'prior_meeting';
  title: string;
  description: string;
  date?: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface RelationshipEdge {
  id: string;
  sourceId: string;
  targetId: string;
  edgeType: EdgeType;
  ownerMemberId?: string; // 'sahil' | 'yanni'
  strength: EdgeStrength;
  evidence: EvidenceItem[];
}

export interface GraphSnapshot {
  version: number;
  members: TeamMember[];
  contacts: Contact[];
  accounts: CompanyAccount[];
  edges: RelationshipEdge[];
}

export interface PathStep {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  roleOrRelation: string;
  strength: EdgeStrength;
  evidence: EvidenceItem[];
}

export interface ShortestPath {
  ownerMemberId: string;
  hops: number;
  accessWarmth: AccessWarmth;
  steps: PathStep[];
  primaryEvidence: string[];
  recommendedActionType: 'direct_outreach' | 'teammate_intro_request' | 'routing_request' | 'cold_unsupported';
  targetContact?: Contact;
}

export interface RankedAccount extends CompanyAccount {
  accessWarmth: AccessWarmth;
  bestPath: ShortestPath | null;
  buyerRelevanceReason: string;
  targetBuyerIdentified: boolean;
  reachableViaMembers: string[];
}

export interface ProductBrief {
  productName: string;
  oneLiner: string;
  targetBuyerRole: string; // e.g., 'Head of RevOps' or 'VP Sales'
  valueProposition: string;
}

export interface AnalysisRequest {
  graphSnapshot: GraphSnapshot;
  activeTeamMemberIds: string[];
  productBrief: ProductBrief;
  inputRevision: number;
}

export interface AnalysisSummary {
  totalAccounts: number;
  reachableAccounts: number;
  hotAccounts: number;
  warmAccounts: number;
  connectedAccounts: number;
  coldAccounts: number;
  newlyUnlockedByTeam: number;
}

export interface GraphViewNode {
  id: string;
  label: string;
  subLabel?: string;
  type: 'team_member' | 'contact' | 'account';
  warmth?: AccessWarmth;
  isActive: boolean;
  isOnSelectedPath?: boolean;
  memberOwnerId?: string;
}

export interface GraphViewEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  strength: EdgeStrength;
  isActive: boolean;
  isOnSelectedPath?: boolean;
  warmth: AccessWarmth;
}

export interface GraphViewData {
  nodes: GraphViewNode[];
  edges: GraphViewEdge[];
}

export interface AnalysisResponse {
  inputRevision: number;
  accounts: RankedAccount[];
  summary: AnalysisSummary;
  graphView: GraphViewData;
}

export interface IntroRequest {
  accountId: string;
  accountName: string;
  path: ShortestPath;
  productBrief: ProductBrief;
  viewerMemberId: string; // The person looking at the screen ('sahil' or 'yanni')
}

export interface IntroResponse {
  actionType: 'direct_outreach' | 'teammate_intro_request' | 'routing_request' | 'cold_unsupported';
  recipientName: string;
  recipientRole: string;
  subject: string;
  body: string;
  forwardableBlurb?: string;
  rationale: string;
  citations: string[];
  isTemplateFallback: boolean;
}

export interface HealthResponse {
  status: 'ok';
  service: 'pyrgraph-engine';
  time: string;
  geminiConfigured: boolean;
}

export interface BootstrapResponse {
  team: TeamMember[];
  initialGraph: GraphSnapshot;
  defaultProductBrief: ProductBrief;
}
