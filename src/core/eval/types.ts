export interface TestAssertion {
  name: string;
  passed: boolean;
  expected?: string | number | boolean;
  actual?: string | number | boolean;
  details?: string;
}

export type TestStatus = 'idle' | 'running' | 'passed' | 'failed';

export interface TestCase {
  id: string;
  category: 'graph_logic' | 'team_reveal' | 'gemini_grounding' | 'csv_import' | 'contract_schemas';
  title: string;
  description: string;
  status: TestStatus;
  durationMs?: number;
  assertions: TestAssertion[];
  error?: string;
  citationReport?: CitationCheckReport;
}

export interface CitationCheckReport {
  hasValidCitations: boolean;
  groundedRatio: number; // 0 to 1
  citedEvidenceCount: number;
  matchedEvidenceTitles: string[];
  unverifiedClaims: string[];
  recipientMatchesBuyer: boolean;
}

export interface EvaluationReport {
  timestamp: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  suites: {
    category: string;
    title: string;
    tests: TestCase[];
  }[];
}
