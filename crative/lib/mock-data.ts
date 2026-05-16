/**
 * Mock data store for Next.js API routes.
 * Mirrors the Python demo_data.py content exactly.
 * Active when NEXT_PUBLIC_API_URL is unset (empty string → relative /api/... calls).
 */

import type {
  ApplicationQueueItem,
  ApplicationDetail,
  ConsolidatedAnalysis,
  GraphData,
  MilestoneStatus,
  VerdictResponse,
} from './types';

// ── Shared analysis builder ────────────────────────────────────────────────────

type Scores = Record<string, number>;

const DIMS = [
  'strengths', 'weaknesses', 'market_value', 'problem_statement',
  'business_model', 'target_users', 'judging_criteria',
] as const;
type Dim = (typeof DIMS)[number];

function reasoning(dim: string, score: number, model: string): string {
  const templates: Record<string, string[]> = {
    strengths: [
      `Strong technical foundation with clear IP ownership. Score ${score}/10 reflects validated market entry.`,
      `Demonstrated traction with paying customers. ${model} notes the B2B GTM motion is well-structured.`,
    ],
    weaknesses: [
      `Limited go-to-market depth outside Klang Valley. Score ${score}/10 flags geographic concentration risk.`,
      `Unit economics are early-stage and unvalidated at scale. CAC assumptions require stress-testing.`,
    ],
    market_value: [
      `Malaysian SME TAM is well-documented. Competitive intensity from regional players is a risk at ${score}/10.`,
      `SEA market fit is strong given regulatory environment alignment.`,
    ],
    problem_statement: [
      `Problem is clearly articulated with evidence from primary research. Score ${score}/10.`,
      `The pain point is real and acute. Quantified impact metrics strengthen the case.`,
    ],
    business_model: [
      `SaaS subscription model is appropriate for the segment. Score ${score}/10 due to early churn data.`,
      `Revenue model is straightforward; pricing benchmarked against regional comparables.`,
    ],
    target_users: [
      `Customer segment is specific and reachable. Score ${score}/10 reflects strong ICP definition.`,
      `Target user profile is well-researched with documented interviews.`,
    ],
    judging_criteria: [
      `Strong CIP Spark alignment — Malaysian ownership and resident directors confirmed. Score ${score}/10.`,
      `Programme investment readiness signals are present: traction, team, and IP ownership.`,
    ],
  };
  const pool = templates[dim] ?? [`Analysis score ${score}/10 for ${dim}.`];
  return pool[score % pool.length];
}

function redFlags(score: number): string[] {
  if (score >= 7) return [];
  if (score >= 5) return [`Early-stage validation — more evidence needed`];
  return [`Significant gap identified`, `Requires substantive improvement`];
}

function recReason(rec: string, model: string): string {
  if (rec === 'APPROVE') return `${model} recommends approval. Eligibility criteria met and traction signals sufficient.`;
  if (rec === 'DECLINE') return `${model} recommends decline. Key criteria or readiness signals are insufficient.`;
  return `${model} requires additional information on ownership structure and revenue validation.`;
}

function buildDim(score: number, dim: string, model: string) {
  return { score, reasoning: reasoning(dim, score, model), red_flags: redFlags(score) };
}

function buildAnalysis(
  g: Scores, c: Scores, k: Scores,
  gRec: string, cRec: string, kRec: string,
): ConsolidatedAnalysis {
  const dimensions: ConsolidatedAnalysis['dimensions'] = {};
  for (const dim of DIMS) {
    const gs = g[dim] ?? 6; const cs = c[dim] ?? 6; const ks = k[dim] ?? 6;
    const variance = Math.max(gs, cs, ks) - Math.min(gs, cs, ks);
    dimensions[dim] = {
      gemini: buildDim(gs, dim, 'Gemini'),
      claude: buildDim(cs, dim, 'Claude'),
      grok: buildDim(ks, dim, 'Grok'),
      score_variance: variance,
      mean_score: (gs + cs + ks) / 3,
      high_variance: variance > 2,
    };
  }
  const recs = [gRec, cRec, kRec];
  const majority = recs.sort((a, b) =>
    recs.filter((r) => r === b).length - recs.filter((r) => r === a).length
  )[0];
  return {
    dimensions,
    model_recommendations: {
      gemini: { recommendation: gRec as never, reasoning: recReason(gRec, 'Gemini'), error: false },
      claude: { recommendation: cRec as never, reasoning: recReason(cRec, 'Claude'), error: false },
      grok: { recommendation: kRec as never, reasoning: recReason(kRec, 'Grok'), error: false },
    },
    majority_ai_recommendation: majority as never,
  };
}

// ── Analysis for each demo app ─────────────────────────────────────────────────

const FINPAY_ANALYSIS = buildAnalysis(
  { strengths: 8, weaknesses: 5, market_value: 7, problem_statement: 8, business_model: 7, target_users: 8, judging_criteria: 9 },
  { strengths: 8, weaknesses: 6, market_value: 7, problem_statement: 9, business_model: 7, target_users: 8, judging_criteria: 8 },
  { strengths: 9, weaknesses: 4, market_value: 6, problem_statement: 8, business_model: 6, target_users: 7, judging_criteria: 8 },
  'APPROVE', 'APPROVE', 'APPROVE',
);

const MEDTECH_ANALYSIS = buildAnalysis(
  { strengths: 7, weaknesses: 6, market_value: 8, problem_statement: 9, business_model: 5, target_users: 8, judging_criteria: 6 },
  { strengths: 7, weaknesses: 5, market_value: 7, problem_statement: 8, business_model: 5, target_users: 7, judging_criteria: 5 },
  { strengths: 8, weaknesses: 7, market_value: 8, problem_statement: 9, business_model: 6, target_users: 8, judging_criteria: 7 },
  'NEEDS_MORE_INFO', 'NEEDS_MORE_INFO', 'APPROVE',
);

const AGRIDRONE_ANALYSIS = buildAnalysis(
  { strengths: 9, weaknesses: 5, market_value: 8, problem_statement: 8, business_model: 8, target_users: 7, judging_criteria: 8 },
  { strengths: 8, weaknesses: 6, market_value: 8, problem_statement: 8, business_model: 8, target_users: 8, judging_criteria: 9 },
  { strengths: 9, weaknesses: 5, market_value: 7, problem_statement: 8, business_model: 8, target_users: 7, judging_criteria: 8 },
  'APPROVE', 'APPROVE', 'APPROVE',
);

const NURSINGCARE_ANALYSIS = buildAnalysis(
  { strengths: 8, weaknesses: 5, market_value: 7, problem_statement: 8, business_model: 8, target_users: 9, judging_criteria: 8 },
  { strengths: 7, weaknesses: 6, market_value: 7, problem_statement: 8, business_model: 7, target_users: 8, judging_criteria: 8 },
  { strengths: 8, weaknesses: 5, market_value: 6, problem_statement: 7, business_model: 7, target_users: 8, judging_criteria: 7 },
  'APPROVE', 'APPROVE', 'APPROVE',
);

// ── Matched mentors ────────────────────────────────────────────────────────────

const MENTORS = {
  agridrone: [
    { id: 'M004', name: 'Ahmad Razif', expertise: 'E-commerce', sectors: ['Retail Tech', 'Logistics'], country: 'MY' },
    { id: 'M003', name: 'Priya Nair', expertise: 'AI/ML', sectors: ['Computer Vision', 'NLP'], country: 'MY' },
  ],
};

// ── Interview Q&A ──────────────────────────────────────────────────────────────

const FINPAY_QA = [
  { question: 'What specific problem are you solving, and how did you validate it with real users?', answer: 'Malaysian SMEs with 10–200 employees spend an average of 14 hours per month manually processing payroll across 3–5 disconnected tools. We validated through 40 structured interviews and confirmed with 3 paying pilots at RM 15,000/month each.' },
  { question: 'Walk us through your unit economics — what does it cost to acquire and serve one customer?', answer: 'CAC is approximately RM 2,800 via direct outbound. Monthly COGS per customer is RM 800. At RM 5,000 ACV, payback period is under 8 months and LTV exceeds RM 38,000 at 36-month churn.' },
  { question: 'Who are your two strongest direct competitors in Malaysia, and what is your defensible advantage?', answer: 'PayrollPanda and Kakitangan are the incumbents. Our advantage is the open API layer — we sit under existing HR systems rather than replacing them, reducing switching cost for the buyer.' },
  { question: 'What is the single metric that best predicts your success, and what is it today?', answer: 'Net Revenue Retention. It is currently 118% — customers expand usage as headcount grows. This is our strongest proof that the product delivers ongoing value.' },
];

const MEDTECH_QA = [
  { question: 'Please clarify the foreign entity shareholding — Singapore Health Ventures holds 25%. How does this interact with the 51% Malaysian ownership requirement?', answer: 'Malaysian shareholders (Dr Nurul Hana 45% + Prof Gan 30%) hold 75% combined, exceeding the 51% minimum. The Singapore entity holds a minority stake with no board control rights. We obtained a legal opinion confirming this satisfies CIP Spark section 3.1.' },
  { question: 'The IP is licensed from Universiti Malaya. Does CIP Spark section 4.2 cover your specific arrangement?', answer: 'Yes — our arrangement is a perpetual exclusive commercialisation licence for Malaysia and ASEAN under UM\'s Technology Licensing Office standard terms. UM\'s innovation office has previously supported CIP applications under 4.2.' },
  { question: 'You have 2 hospital pilots. What is the pathway from pilot to paid contract?', answer: 'Both pilots are with government-linked hospitals. Purchase orders require Ministry of Health procurement approval, estimated 6–9 months. In parallel we are targeting 4 private hospital groups where procurement is faster (2–3 months). First paid contract expected Q3 2025.' },
  { question: 'What specific evidence do you have of diabetic retinopathy prevalence in rural Malaysian clinics?', answer: 'MOH 2023 data shows 3.9 million Malaysians with diabetes, 30–40% at risk of retinopathy. Rural clinic screening rates are under 12% due to equipment cost. Our device costs 85% less than the current gold standard with 340 screenings completed across 2 pilot sites.' },
];

const AGRIDRONE_QA = [
  { question: 'You report RM 200K MRR — how is this split across customers and what is your largest single customer?', answer: '14 active customers. Largest is Felda subsidiary at RM 45,000/month. Average customer is RM 14,000/month. Top 3 customers account for 55% of MRR — concentration risk we are actively reducing.' },
  { question: 'Drone regulations in Malaysia are evolving. What is your regulatory risk?', answer: 'We hold a CAAM operator certificate and all pilots are licensed. The draft CAAM circular on agricultural drones (due Q2 2025) is expected to formalise our operating model. We are part of the industry working group.' },
  { question: 'What does your competitive moat look like in 18 months, given DJI\'s agriculture drone push into SEA?', answer: 'Our moat is the operations layer — trained local pilots, ground teams, and agronomic data from 3 years of flights. DJI sells hardware; we sell outcomes. Our contracts are outcome-based with penalty clauses, which no hardware vendor can replicate.' },
];

const NURSINGCARE_QA = [
  { question: 'You have 12 paying clinics at RM 499/month — what is your month-on-month churn rate and NPS score?', answer: 'Churn is zero in 6 months of operation — no clinic has cancelled. NPS is 72, collected through an in-app survey. Clinics cite staff scheduling automation as the primary value driver.' },
  { question: 'As a solo technical founder, how are you managing product development, sales, and clinical ops simultaneously?', answer: 'I co-founded with a CTO who handles all engineering. My focus is clinical workflow design and sales to clinic owners through the Malaysian Medical Association network.' },
  { question: 'What prevents a large EHR vendor like iMedic or Doctoroncall from replicating your scheduling feature?', answer: 'iMedic\'s scheduling module is buried in a RM 15,000/year EHR system. Our tool is standalone, mobile-first, and set up in under 2 hours. The TAM — clinics with 1–5 doctors — is too small for large vendors to prioritise.' },
  { question: 'Walk us through your expansion plan from 12 to 100 clinics — what is the primary growth lever?', answer: 'Primary lever is word-of-mouth within clinic owner networks. 8 of 12 current clinics came through referrals. We plan to formalise this with a referral programme and target Malaysian Medical Clinic Association events for Q3 expansion.' },
];

const GREENHARVEST_QUESTIONS = [
  'What is your current GMV and month-on-month growth rate for the first 3 months of operation?',
  'How do you ensure supply reliability from smallholders during peak demand from supermarket buyers?',
  'Walk us through how a smallholder onboards and lists produce on your platform — what does the UX look like for a non-tech-savvy farmer?',
  'Who are your two strongest competitors and how does your commission or fee structure compare?',
];

// ── Application detail store ───────────────────────────────────────────────────

const now = new Date();
function daysAgo(n: number) { return new Date(now.getTime() - n * 86400000).toISOString(); }

export const MOCK_APPLICATIONS: Record<string, ApplicationDetail> = {
  APPDEMO001: {
    application_id: 'APPDEMO001',
    startup_name: 'FinPay Sdn Bhd',
    sector: 'Fintech',
    stage: 'Pre-seed',
    programme_applied: 'CIP Spark',
    submitted_at: daysAgo(3),
    eligibility_result: 'PASS',
    eligibility_reasoning: 'Company meets all CIP Spark criteria: 100% Malaysian ownership, both directors are Malaysian residents, company is 2 years old (under 5-year limit). Recommended programme: CIP Spark.',
    eligibility_flags: [],
    eligibility_confidence: 0.97,
    consolidated_analysis: FINPAY_ANALYSIS,
    interview_qa: FINPAY_QA,
    status: 'awaiting_verdict',
    judge_verdict: null,
    matched_mentors: [],
  },
  APPDEMO002: {
    application_id: 'APPDEMO002',
    startup_name: 'MedTech IP Co Sdn Bhd',
    sector: 'Healthtech',
    stage: 'Pre-seed',
    programme_applied: 'CIP Spark',
    submitted_at: daysAgo(5),
    eligibility_result: 'MANUAL_REVIEW',
    eligibility_reasoning: 'Application triggers manual review: (1) foreign entity (Singapore Health Ventures) holds 25% — total Malaysian ownership is 75% exceeding the 51% threshold but requires verification of board control rights; (2) core IP licensed from Universiti Malaya — may qualify under CIP Spark section 4.2 but requires documentation; (3) one director IC listed as N/A.',
    eligibility_flags: [
      'FOREIGN_ENTITY_SHAREHOLDING_25PCT',
      'UNIVERSITY_IP_LICENCE_SECTION_4.2_VERIFICATION_REQUIRED',
      'DIRECTOR_IC_MISSING',
    ],
    eligibility_confidence: 0.62,
    consolidated_analysis: MEDTECH_ANALYSIS,
    interview_qa: MEDTECH_QA,
    status: 'awaiting_verdict',
    judge_verdict: null,
    matched_mentors: [],
  },
  APPDEMO003: {
    application_id: 'APPDEMO003',
    startup_name: 'AgriDrone Solutions Sdn Bhd',
    sector: 'AgriTech',
    stage: 'Seed',
    programme_applied: 'CIP Sprint',
    submitted_at: daysAgo(14),
    eligibility_result: 'PASS',
    eligibility_reasoning: 'Company meets all CIP Sprint criteria: 72% Malaysian ownership, resident directors confirmed, company is 6 years old (within 10-year Sprint limit), RM 200K MRR demonstrates commercialisation.',
    eligibility_flags: [],
    eligibility_confidence: 0.94,
    consolidated_analysis: AGRIDRONE_ANALYSIS,
    interview_qa: AGRIDRONE_QA,
    status: 'approved',
    judge_verdict: 'APPROVE',
    matched_mentors: MENTORS.agridrone,
  },
  APPDEMO004: {
    application_id: 'APPDEMO004',
    startup_name: 'CryptoSafe MY Sdn Bhd',
    sector: 'Fintech',
    stage: 'Pre-seed',
    programme_applied: 'CIP Spark',
    submitted_at: daysAgo(10),
    eligibility_result: 'FAIL',
    eligibility_reasoning: 'Application fails CIP Spark eligibility on two grounds: (1) Malaysian ownership is 40%, below the mandatory 51% minimum — Cayman Islands fund holds 60% majority; (2) company appears incorporated in Labuan as an IBFC entity, not Sdn Bhd under SSM. Both are categorical failures with no exception pathway.',
    eligibility_flags: ['MALAYSIAN_OWNERSHIP_BELOW_51PCT', 'LABUAN_IBFC_NOT_SDN_BHD', 'FOREIGN_MAJORITY_SHAREHOLDER'],
    eligibility_confidence: 0.98,
    consolidated_analysis: null,
    interview_qa: [
      { question: 'Malaysian ownership is 40% — this is below the 51% minimum. Can this be remediated?', answer: 'The current cap table reflects a Series A round with a Cayman Islands fund taking 60%. We do not have a clear path to restructure to 51% Malaysian within the next 12 months without triggering investor rights.' },
      { question: 'The company is incorporated in Labuan, not as a Sdn Bhd. Does this affect eligibility?', answer: 'We incorporated in Labuan as an IBFC entity. We understand this may not be equivalent to a Sdn Bhd under SSM for CIP Spark eligibility. We are exploring a dual structure but do not have a resolution yet.' },
    ],
    status: 'rejected',
    judge_verdict: 'DECLINE',
    matched_mentors: [],
  },
  APPDEMO005: {
    application_id: 'APPDEMO005',
    startup_name: 'GreenHarvest Platform Sdn Bhd',
    sector: 'AgriTech',
    stage: 'Pre-seed',
    programme_applied: 'CIP Spark',
    submitted_at: daysAgo(1),
    eligibility_result: 'PASS',
    eligibility_reasoning: 'All CIP Spark criteria met: 100% Malaysian ownership, resident founder-director, company incorporated 12 months ago (under 5-year limit). Clean application. Recommended: CIP Spark.',
    eligibility_flags: [],
    eligibility_confidence: 0.99,
    consolidated_analysis: null,
    interview_qa: GREENHARVEST_QUESTIONS.map((q) => ({ question: q, answer: '' })),
    status: 'interview_pending',
    judge_verdict: null,
    matched_mentors: [],
  },
  APPDEMO006: {
    application_id: 'APPDEMO006',
    startup_name: 'NursingCare Tech Sdn Bhd',
    sector: 'Healthtech',
    stage: 'Pre-seed',
    programme_applied: 'CIP Spark',
    submitted_at: daysAgo(7),
    eligibility_result: 'PASS',
    eligibility_reasoning: 'All CIP Spark criteria met: 100% Malaysian ownership, registered nurse founder holds resident director status, company is 14 months old, no subsidiary relationship. Strong application with immediate traction evidence. Recommended: CIP Spark.',
    eligibility_flags: [],
    eligibility_confidence: 0.96,
    consolidated_analysis: NURSINGCARE_ANALYSIS,
    interview_qa: NURSINGCARE_QA,
    status: 'judging',
    judge_verdict: null,
    matched_mentors: [],
  },
};

// ── Queue view (derived) ───────────────────────────────────────────────────────

export const MOCK_QUEUE: ApplicationQueueItem[] = Object.values(MOCK_APPLICATIONS).map((a) => ({
  application_id: a.application_id,
  startup_name: a.startup_name,
  sector: a.sector,
  stage: a.stage,
  programme_applied: a.programme_applied,
  submitted_at: a.submitted_at,
  eligibility_result: a.eligibility_result,
  status: a.status,
}));

// ── Graph data ─────────────────────────────────────────────────────────────────

export const MOCK_GRAPH: GraphData = {
  nodes: [
    // Startups
    { id: 'SAPPDEMO003', label: 'Startup', name: 'AgriDrone Solutions Sdn Bhd', properties: { sector: 'AgriTech', stage: 'Seed', status: 'approved', country: 'MY' } },
    // Mentors
    { id: 'M001', label: 'Mentor', name: 'Dr Tan Wei Liang', properties: { expertise: 'Fintech', country: 'MY' } },
    { id: 'M002', label: 'Mentor', name: 'Siti Aminah Hassan', properties: { expertise: 'Healthtech', country: 'MY' } },
    { id: 'M003', label: 'Mentor', name: 'Priya Nair', properties: { expertise: 'AI/ML', country: 'MY' } },
    { id: 'M004', label: 'Mentor', name: 'Ahmad Razif', properties: { expertise: 'E-commerce', country: 'MY' } },
    { id: 'M005', label: 'Mentor', name: 'James Ong', properties: { expertise: 'SaaS', country: 'MY' } },
    // Programmes
    { id: 'CIP Spark', label: 'Programme', name: 'CIP Spark', properties: { max_age_years: 5, min_malaysian_ownership_pct: 51 } },
    { id: 'CIP Sprint', label: 'Programme', name: 'CIP Sprint', properties: { max_age_years: 10, min_malaysian_ownership_pct: 51 } },
    // Geographies
    { id: 'GEO_KL', label: 'Geography', name: 'Kuala Lumpur', properties: { region: 'Central' } },
    { id: 'GEO_PG', label: 'Geography', name: 'Penang', properties: { region: 'Northern' } },
    { id: 'GEO_JB', label: 'Geography', name: 'Johor Bahru', properties: { region: 'Southern' } },
  ],
  links: [
    { source: 'SAPPDEMO003', target: 'CIP Sprint', type: 'ENROLLED_IN', properties: {} },
    { source: 'SAPPDEMO003', target: 'M004', type: 'MATCHED_TO', properties: { score: 0.85 } },
    { source: 'SAPPDEMO003', target: 'M003', type: 'MATCHED_TO', properties: { score: 0.85 } },
    { source: 'M001', target: 'GEO_KL', type: 'BASED_IN', properties: {} },
    { source: 'M002', target: 'GEO_PG', type: 'BASED_IN', properties: {} },
    { source: 'M003', target: 'GEO_KL', type: 'BASED_IN', properties: {} },
    { source: 'M004', target: 'GEO_KL', type: 'BASED_IN', properties: {} },
    { source: 'M005', target: 'GEO_JB', type: 'BASED_IN', properties: {} },
    { source: 'CIP Spark', target: 'GEO_KL', type: 'OPERATES_IN', properties: {} },
    { source: 'CIP Sprint', target: 'GEO_KL', type: 'OPERATES_IN', properties: {} },
  ],
};

// ── Milestone mock response ────────────────────────────────────────────────────

export const MOCK_MILESTONE: MilestoneStatus = {
  milestone_name: 'MVP Launch',
  checklist: [
    { criterion: 'User registration and authentication working', verified: true, evidence: 'Login flow visible in video at 0:12' },
    { criterion: 'Core workflow demonstratable end-to-end', verified: true, evidence: 'Full workflow shown at 0:45–2:10' },
    { criterion: 'Basic reporting or dashboard present', verified: false, evidence: 'Not shown in submitted video' },
    { criterion: 'Application accessible via public URL or APK', verified: true, evidence: 'URL shown at 0:08' },
  ],
  verified_count: 3,
  total_count: 4,
  threshold: 3,
  milestone_passed: true,
  confidence: 0.87,
  manual_review_required: false,
};

// ── Interview questions by app ─────────────────────────────────────────────────

export const MOCK_INTERVIEW_QUESTIONS: Record<string, string[]> = {
  APPDEMO001: FINPAY_QA.map((q) => q.question),
  APPDEMO002: MEDTECH_QA.map((q) => q.question),
  APPDEMO003: AGRIDRONE_QA.map((q) => q.question),
  APPDEMO004: [],
  APPDEMO005: GREENHARVEST_QUESTIONS,
  APPDEMO006: NURSINGCARE_QA.map((q) => q.question),
};

// ── Verdict response builder ───────────────────────────────────────────────────

export function buildVerdictResponse(
  applicationId: string,
  verdict: string,
  overrideReason?: string | null,
): VerdictResponse {
  const app = MOCK_APPLICATIONS[applicationId];
  const isApprove = verdict === 'APPROVE';
  const majorityRec = app?.consolidated_analysis?.majority_ai_recommendation ?? 'UNAVAILABLE';
  const alignmentScore = majorityRec === 'UNAVAILABLE' || majorityRec === 'NEEDS_MORE_INFO'
    ? 0
    : isApprove === (majorityRec === 'APPROVE') ? 1 : -1;

  return {
    application_id: applicationId,
    verdict: verdict as never,
    alignment_score: overrideReason ? -1 : alignmentScore,
    matched_mentors: isApprove ? [
      { id: 'M001', name: 'Dr Tan Wei Liang', expertise: 'Fintech', sectors: ['Payments', 'Lending'], country: 'MY' },
      { id: 'M005', name: 'James Ong', expertise: 'SaaS', sectors: ['B2B SaaS', 'Enterprise'], country: 'MY' },
    ] : [],
    programme_enrolled: isApprove ? (app?.programme_applied ?? 'CIP Spark') : null,
    message: overrideReason ? 'Human Override ✓' : 'AI Matched ✓',
  };
}
