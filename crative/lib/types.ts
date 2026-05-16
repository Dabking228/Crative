export type ApplicationStatus =
  | 'submitted'
  | 'ocr_complete'
  | 'eligible'
  | 'rejected'
  | 'interview_pending'
  | 'interview_complete'
  | 'judging'
  | 'awaiting_verdict'
  | 'approved'
  | 'declined';

export type EligibilityResult = 'PASS' | 'FAIL' | 'MANUAL_REVIEW';

export type Verdict = 'APPROVE' | 'DECLINE';

export type ModelRecommendation = 'APPROVE' | 'DECLINE' | 'NEEDS_MORE_INFO' | 'UNAVAILABLE';

export interface DimensionScore {
  score: number | null;
  reasoning: string;
  red_flags: string[];
  error?: boolean;
}

export interface ConsolidatedDimension {
  gemini: DimensionScore;
  claude: DimensionScore;
  grok: DimensionScore;
  score_variance: number;
  mean_score: number | null;
  high_variance: boolean;
}

export interface ModelRecommendationEntry {
  recommendation: ModelRecommendation;
  reasoning: string;
  error: boolean;
}

export interface ConsolidatedAnalysis {
  dimensions: Record<string, ConsolidatedDimension>;
  model_recommendations: Record<string, ModelRecommendationEntry>;
  majority_ai_recommendation: ModelRecommendation;
}

export interface InterviewQA {
  question: string;
  answer: string;
}

export interface Mentor {
  id: string;
  name: string;
  expertise: string;
  sectors: string[];
  country: string;
}

export interface ApplicationQueueItem {
  application_id: string;
  startup_name: string;
  sector: string;
  stage: string;
  programme_applied: string;
  submitted_at: string;
  eligibility_result: EligibilityResult | null;
  status: ApplicationStatus;
}

export interface ApplicationDetail {
  application_id: string;
  startup_name: string;
  sector: string;
  stage: string;
  programme_applied: string;
  submitted_at: string;
  eligibility_result: EligibilityResult | null;
  eligibility_reasoning: string;
  eligibility_flags: string[];
  eligibility_confidence: number | null;
  consolidated_analysis: ConsolidatedAnalysis | null;
  interview_qa: InterviewQA[];
  status: ApplicationStatus;
  judge_verdict: Verdict | null;
  matched_mentors: Mentor[];
}

export interface ApplyRequest {
  startup_name: string;
  sector: string;
  stage: string;
  programme_applied: string;
  registration_no: string;
  incorporation_date: string;
  total_malaysian_ownership_pct: number;
  business_description: string;
  ssm_document_base64: string;
  pitch_deck_base64: string;
}

export interface VerdictRequest {
  verdict: Verdict;
  override_reason?: string;
  judge_id?: string;
}

export interface VerdictResponse {
  application_id: string;
  verdict: Verdict;
  alignment_score: number;
  matched_mentors: Mentor[];
  programme_enrolled: string | null;
  message: string;
}

export interface GraphNode {
  id: string;
  label: string;
  name: string;
  properties: Record<string, string | number | boolean | null>;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface MilestoneChecklistItem {
  criterion: string;
  verified: boolean;
  evidence: string;
}

export interface MilestoneStatus {
  milestone_name: string;
  checklist: MilestoneChecklistItem[];
  verified_count: number;
  total_count: number;
  threshold: number;
  milestone_passed: boolean;
  confidence: number;
  manual_review_required: boolean;
}

export interface SSEToken {
  token: string;
  done: boolean;
  result?: {
    result: EligibilityResult;
    programme_recommended: string | null;
    flags: string[];
    reasoning: string;
    confidence: number;
  };
}
