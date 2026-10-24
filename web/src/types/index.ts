export type Severity = "critical" | "high" | "medium" | "low";
export type ProposalStatus =
  | "draft"
  | "needs_review"
  | "approved"
  | "rejected"
  | "applied"
  | "failed"
  | "rolled_back";
export interface SourceHealth {
  name: "gsc" | "shopify" | "pagespeed" | "crawler" | "merchant_manual";
  status: "connected" | "not_configured" | "failed" | "stale";
  lastSyncedAt?: string;
  message?: string;
}
export interface RunSummary {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  status: "success" | "partial" | "failed" | "skipped";
  jobName: string;
  sourceStatuses: SourceHealth[];
  issueCounts: Record<Severity, number>;
  githubRunUrl?: string;
}
export interface Issue {
  id: string;
  source: string;
  category: string;
  severity: Severity;
  targetUrl: string;
  evidence: string;
  discoveredAt: string;
  lastVerifiedAt: string;
  recommendation: string;
}
export interface Product {
  id: string;
  title: string;
  url: string;
  productType: string;
  score: number;
  issues: string[];
  reviewState: ProposalStatus;
  lastAudit: string;
  facts: string[];
  checklist: { label: string; passed: boolean }[];
}
export interface Recommendation {
  id: string;
  targetKind: "product" | "collection" | "page";
  targetUrl: string;
  reason: string;
  risk: number;
  status: ProposalStatus;
  prUrl?: string;
  createdAt: string;
  impact: number;
  confidence: number;
  effort: number;
  fieldChanges: {
    field: "seo.title" | "seo.description";
    before: string | null;
    after: string | null;
  }[];
  testPlan: string;
}
export interface ContentWorkflow {
  id: string;
  topic: string;
  preparedAt: string;
  mode: "assisted";
  status: "needs_review";
  stages: {
    id: string;
    label: string;
    status: "complete" | "needs_review" | "blocked";
    evidence: string;
  }[];
  keywords: string[];
  sources: { label: string; url: string; note: string }[];
  draft: {
    title: string;
    metaTitle: string;
    metaDescription: string;
    slug: string;
    sections: { heading: string; text: string }[];
    faqs: { question: string; answer: string }[];
  };
  images: { src: string; alt: string; caption: string }[];
}
export interface PublicReport {
  contentWorkflow?: ContentWorkflow;
  pageChecks?: {
    url: string;
    checkedAt: string;
    titlePresent: boolean;
    descriptionPresent: boolean;
    structuredDataPresent: boolean;
    helpfulQuestionsPresent: boolean;
    aboutOrContactLinkPresent: boolean;
  }[];
  schemaVersion: 1;
  mode: "demo" | "connected";
  generatedAt: string;
  siteUrl: string;
  repositoryUrl: string | null;
  latestRun: RunSummary | null;
  sourceHealth: SourceHealth[];
  publicSafeKpis: {
    label: string;
    value: number;
    unit?: string;
    asOf: string;
  }[];
  issues: Issue[];
  productAuditSummaries: Product[];
  recommendations: Recommendation[];
  runs: RunSummary[];
  healthHistory: { date: string; score: number; pagesChecked: number }[];
  keywordClusters: {
    keyword: string;
    intent: string;
    landingPage: string;
    branded: boolean;
    nextStep: string;
  }[];
  readiness: {
    label: string;
    status: "verified" | "needs_review" | "not_checked";
    evidence: string;
  }[];
  competitors: {
    name: string;
    url: string;
    observation: string | null;
    verifiedAt: string | null;
  }[];
  publishingEvents: {
    id: string;
    status: string;
    timestamp: string;
    fields: string[];
    jobUrl: string;
  }[];
}
