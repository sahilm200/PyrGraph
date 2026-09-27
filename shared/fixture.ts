import { GraphSnapshot, TeamMember, CompanyAccount, Contact, RelationshipEdge, ProductBrief } from './contracts';

export const DEFAULT_TEAM: TeamMember[] = [
  {
    id: 'sahil',
    name: 'Sahil',
    role: 'Founder & Technical Lead',
    title: 'Founder & Tech Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'yanni',
    name: 'Yanni',
    role: 'Co-Founder & Product Designer',
    title: 'Co-Founder & Product Designer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  },
];

export const DEFAULT_PRODUCT_BRIEF: ProductBrief = {
  productName: 'Pyrgraph',
  oneLiner: 'Network-first account intelligence that maps warm team entry routes into high-value B2B accounts.',
  targetBuyerRole: 'Head of RevOps / VP Sales Operations',
  valueProposition: 'Help B2B sales teams unlock accounts they can already reach through collective team relationships instead of cold emailing.',
};

export const DEMO_ACCOUNTS: CompanyAccount[] = [
  {
    id: 'acc_stripe',
    name: 'Stripe',
    domain: 'stripe.com',
    industry: 'Financial Infrastructure / Fintech',
    employeeCount: '7,000+',
    fitScore: 94,
    fitReason: 'Massive B2B sales motion, complex multi-product expansion, ideal RevOps profile.',
    targetBuyerRoles: ['Head of Revenue Operations', 'VP Global Sales Ops', 'Chief Commercial Officer'],
  },
  {
    id: 'acc_datadog',
    name: 'Datadog',
    domain: 'datadoghq.com',
    industry: 'Cloud Monitoring & Security',
    employeeCount: '5,000+',
    fitScore: 91,
    fitReason: 'Aggressive enterprise sales outbound with high sales enablement budget.',
    targetBuyerRoles: ['VP Revenue Operations', 'Director of Sales Enablement', 'Head of Go-To-Market'],
  },
  {
    id: 'acc_snowflake',
    name: 'Snowflake',
    domain: 'snowflake.com',
    industry: 'Data Cloud & Analytics',
    employeeCount: '6,000+',
    fitScore: 88,
    fitReason: 'High ACV enterprise accounts, relies heavily on ecosystem relationships.',
    targetBuyerRoles: ['VP Sales Operations', 'Head of Field Strategy'],
  },
  {
    id: 'acc_figma',
    name: 'Figma',
    domain: 'figma.com',
    industry: 'Collaborative Design Platform',
    employeeCount: '1,500+',
    fitScore: 85,
    fitReason: 'Rapidly scaling sales and enterprise tier requiring relationship attribution.',
    targetBuyerRoles: ['Head of Sales Operations', 'Director of Enterprise Growth'],
  },
  {
    id: 'acc_acme',
    name: 'Acme Cloud Security',
    domain: 'acmecloudsecurity.io',
    industry: 'Cybersecurity',
    employeeCount: '800+',
    fitScore: 78,
    fitReason: 'Mid-market security vendor actively scaling sales team.',
    targetBuyerRoles: ['VP Sales', 'Head of Revenue Ops'],
  },
];

export const DEMO_CONTACTS: Contact[] = [
  // Sahil's Contacts
  {
    id: 'con_elena',
    name: 'Elena Rostova',
    title: 'Head of Global Revenue Operations',
    companyName: 'Stripe',
    companyId: 'acc_stripe',
    email: 'elena.rostova@stripe.example.com',
    location: 'San Francisco, CA',
    isTargetBuyer: true,
  },
  {
    id: 'con_devon',
    name: 'Devon Reed',
    title: 'Senior Staff Infrastructure Engineer',
    companyName: 'Snowflake',
    companyId: 'acc_snowflake',
    email: 'devon.reed@snowflake.example.com',
    location: 'San Mateo, CA',
    isTargetBuyer: false, // Non-buyer! Requires routing request
  },

  // Yanni's Contacts (Unlocks Datadog and Figma!)
  {
    id: 'con_marcus',
    name: 'Marcus Chen',
    title: 'VP Sales Strategy & Operations',
    companyName: 'Datadog',
    companyId: 'acc_datadog',
    email: 'marcus.chen@datadoghq.example.com',
    location: 'New York, NY',
    isTargetBuyer: true,
  },
  {
    id: 'con_sarah',
    name: 'Sarah Lin',
    title: 'Director of Enterprise Operations',
    companyName: 'Figma',
    companyId: 'acc_figma',
    email: 'sarah.lin@figma.example.com',
    location: 'San Francisco, CA',
    isTargetBuyer: true,
  },

  // Shared / Bridge Contact
  {
    id: 'con_aravind',
    name: 'Aravind Patel',
    title: 'Senior Product Manager',
    companyName: 'Stripe',
    companyId: 'acc_stripe',
    email: 'aravind.p@stripe.example.com',
    location: 'San Francisco, CA',
    isTargetBuyer: false,
  },
];

export const DEMO_EDGES: RelationshipEdge[] = [
  // 1. Sahil -> Elena (Stripe): HOT direct buyer access
  {
    id: 'edge_sahil_elena',
    sourceId: 'sahil',
    targetId: 'con_elena',
    edgeType: 'team_to_contact',
    ownerMemberId: 'sahil',
    strength: 'strong',
    evidence: [
      {
        id: 'ev_1',
        type: 'shared_work_history',
        title: 'Co-workers at ScaleOps (2022–2024)',
        description: 'Collaborated closely for 2 years on sales systems infrastructure.',
        date: '2024-03-15',
        confidence: 'high',
      },
      {
        id: 'ev_2',
        type: 'explicit_intro_offer',
        title: 'Recorded Intro Offer',
        description: 'Elena offered to review sales tools for their Q4 stack evaluation.',
        date: '2026-08-10',
        confidence: 'high',
      },
    ],
  },
  // Elena -> Stripe employer edge
  {
    id: 'edge_elena_stripe',
    sourceId: 'con_elena',
    targetId: 'acc_stripe',
    edgeType: 'contact_to_company',
    strength: 'strong',
    evidence: [],
  },

  // 2. Sahil -> Devon (Snowflake): CONNECTED entry point (Engineer, needs routing)
  {
    id: 'edge_sahil_devon',
    sourceId: 'sahil',
    targetId: 'con_devon',
    edgeType: 'team_to_contact',
    ownerMemberId: 'sahil',
    strength: 'unknown',
    evidence: [
      {
        id: 'ev_3',
        type: 'linkedin_connection',
        title: 'LinkedIn 1st Degree Connection',
        description: 'Connected in March 2023. Relationship strength unverified.',
        date: '2023-03-20',
        confidence: 'medium',
      },
    ],
  },
  // Devon -> Snowflake employer edge
  {
    id: 'edge_devon_snowflake',
    sourceId: 'con_devon',
    targetId: 'acc_snowflake',
    edgeType: 'contact_to_company',
    strength: 'strong',
    evidence: [],
  },

  // 3. Yanni -> Marcus (Datadog): WARM/HOT access unlocked by Yanni!
  {
    id: 'edge_yanni_marcus',
    sourceId: 'yanni',
    targetId: 'con_marcus',
    edgeType: 'team_to_contact',
    ownerMemberId: 'yanni',
    strength: 'strong',
    evidence: [
      {
        id: 'ev_4',
        type: 'shared_work_history',
        title: 'Worked together at CloudPulse',
        description: 'Yanni designed product analytics dashboards directly with Marcus.',
        date: '2023-11-01',
        confidence: 'high',
      },
      {
        id: 'ev_5',
        type: 'self_reported',
        title: 'Close Teammate Note',
        description: 'Yanni marked Marcus as "know well, stays in touch monthly".',
        confidence: 'high',
      },
    ],
  },
  // Marcus -> Datadog employer edge
  {
    id: 'edge_marcus_datadog',
    sourceId: 'con_marcus',
    targetId: 'acc_datadog',
    edgeType: 'contact_to_company',
    strength: 'strong',
    evidence: [],
  },

  // 4. Yanni -> Sarah (Figma): WARM access unlocked by Yanni!
  {
    id: 'edge_yanni_sarah',
    sourceId: 'yanni',
    targetId: 'con_sarah',
    edgeType: 'team_to_contact',
    ownerMemberId: 'yanni',
    strength: 'acquaintance',
    evidence: [
      {
        id: 'ev_6',
        type: 'prior_meeting',
        title: 'SaaS Ops Advisory Session',
        description: 'Participated in a private roundtable on RevOps tooling.',
        date: '2025-06-12',
        confidence: 'medium',
      },
    ],
  },
  // Sarah -> Figma employer edge
  {
    id: 'edge_sarah_figma',
    sourceId: 'con_sarah',
    targetId: 'acc_figma',
    edgeType: 'contact_to_company',
    strength: 'strong',
    evidence: [],
  },

  // 5. Bridge contact: Yanni -> Aravind (Stripe PM)
  {
    id: 'edge_yanni_aravind',
    sourceId: 'yanni',
    targetId: 'con_aravind',
    edgeType: 'team_to_contact',
    ownerMemberId: 'yanni',
    strength: 'strong',
    evidence: [
      {
        id: 'ev_7',
        type: 'linkedin_connection',
        title: 'LinkedIn Connection',
        description: 'Connected since 2021.',
        confidence: 'low',
      },
    ],
  },
  {
    id: 'edge_aravind_stripe',
    sourceId: 'con_aravind',
    targetId: 'acc_stripe',
    edgeType: 'contact_to_company',
    strength: 'strong',
    evidence: [],
  },
];

export const INITIAL_GRAPH_SNAPSHOT: GraphSnapshot = {
  version: 1,
  members: DEFAULT_TEAM,
  contacts: DEMO_CONTACTS,
  accounts: DEMO_ACCOUNTS,
  edges: DEMO_EDGES,
};
