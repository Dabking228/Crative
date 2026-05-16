"""
Demo data loader — populates the in-memory applications dict with pre-built
GraphState objects covering every use case, and writes APPROVED startups
into Neo4j so the ecosystem graph has live nodes.

Called from main.py lifespan after Neo4j seed.
"""
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict

from graph.state import ApplicationStatus, GraphState
from services.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)

# ── Shared consolidated analysis factory ─────────────────────────────────────

def _make_analysis(
    gemini_scores: dict, claude_scores: dict, grok_scores: dict,
    gemini_rec: str, claude_rec: str, grok_rec: str
) -> dict:
    DIMS = ["strengths", "weaknesses", "market_value", "problem_statement",
            "business_model", "target_users", "judging_criteria"]

    def model_block(scores: dict, rec: str, model: str) -> dict:
        dims = {}
        for d in DIMS:
            s = scores.get(d, 6)
            dims[d] = {
                "score": s,
                "reasoning": _reasoning(d, s, model),
                "red_flags": _red_flags(d, s)
            }
        return {
            "model": model,
            "dimensions": dims,
            "overall_recommendation": rec,
            "recommendation_reasoning": _rec_reasoning(rec, model),
            "error": False
        }

    g = model_block(gemini_scores, gemini_rec, "Gemini 3 Flash Preview")
    c = model_block(claude_scores, claude_rec, "Claude Sonnet 4.6")
    k = model_block(grok_scores, grok_rec, "Grok 4.20 reasoning")

    consolidated_dims = {}
    for d in DIMS:
        scores = [g["dimensions"][d]["score"], c["dimensions"][d]["score"], k["dimensions"][d]["score"]]
        variance = max(scores) - min(scores)
        consolidated_dims[d] = {
            "gemini": g["dimensions"][d],
            "claude": c["dimensions"][d],
            "grok": k["dimensions"][d],
            "score_variance": variance,
            "mean_score": sum(scores) / 3,
            "high_variance": variance > 2
        }

    recs = [gemini_rec, claude_rec, grok_rec]
    majority = max(set(recs), key=recs.count)

    return {
        "dimensions": consolidated_dims,
        "model_recommendations": {
            "gemini": {"recommendation": gemini_rec, "reasoning": _rec_reasoning(gemini_rec, "Gemini"), "error": False},
            "claude": {"recommendation": claude_rec, "reasoning": _rec_reasoning(claude_rec, "Claude"), "error": False},
            "grok": {"recommendation": grok_rec, "reasoning": _rec_reasoning(grok_rec, "Grok"), "error": False},
        },
        "majority_ai_recommendation": majority
    }


def _reasoning(dim: str, score: int, model: str) -> str:
    templates = {
        "strengths": [
            f"Strong technical foundation with clear IP ownership and experienced founding team. Score {score}/10 reflects validated market entry.",
            f"Demonstrated traction with paying customers and letter of intent pipeline is compelling. {model} notes the B2B GTM motion is well-structured.",
            f"Product differentiation is evident in the demo; core value proposition maps cleanly to the target segment's pain point."
        ],
        "weaknesses": [
            f"Limited go-to-market depth outside Klang Valley. Score {score}/10 flags geographic concentration risk for a national programme.",
            f"Unit economics are early-stage and unvalidated at scale. Customer acquisition cost assumptions require stress-testing.",
            f"Founding team lacks a dedicated sales leader; current traction appears founder-led which creates scaling bottleneck."
        ],
        "market_value": [
            f"Malaysian SME TAM of ~RM 4.2B is well-documented. Competitive intensity from regional players is a risk at score {score}/10.",
            f"SEA market fit is strong given regulatory environment alignment. {model} flags that Singapore entry may face incumbent pressure.",
            f"Total addressable market sizing is credible; beachhead segment is specific and reachable within the programme timeline."
        ],
        "problem_statement": [
            f"Problem is clearly articulated with evidence from primary research. Score {score}/10 reflects strong validation methodology.",
            f"The pain point is real and acute for the stated customer segment. Quantified impact metrics strengthen the case.",
            f"Problem definition is precise; the team demonstrates deep domain understanding validated through customer discovery."
        ],
        "business_model": [
            f"SaaS subscription model with usage-based upsell is appropriate for the segment. Score {score}/10 due to early churn data.",
            f"Revenue model is straightforward; pricing benchmarked against regional comparables. LTV/CAC ratio needs further validation.",
            f"Recurring revenue structure provides predictability. Gross margin assumptions are reasonable for a software-first business."
        ],
        "target_users": [
            f"Customer segment is specific and reachable. Score {score}/10 reflects strong ICP definition with quantified personas.",
            f"Target user profile is well-researched with 3 documented interviews. Buyer vs. user distinction is understood.",
            f"Segment reachability through existing channels is demonstrated. Willingness to pay is validated through pilot pricing."
        ],
        "judging_criteria": [
            f"Strong CIP Spark alignment — Malaysian ownership, resident directors, and sub-5-year company age all confirmed. Score {score}/10.",
            f"Programme investment readiness signals are present: traction, team, and IP ownership. Stage-appropriate ask.",
            f"Eligibility criteria met across the board. Milestone-based deployment plan aligns with CIP programme structure."
        ]
    }
    import random
    random.seed(score + len(dim))
    return random.choice(templates.get(dim, [f"Analysis score {score}/10 for {dim}."]))


def _red_flags(dim: str, score: int) -> list:
    if score >= 7:
        return []
    if score >= 5:
        return [f"Early-stage validation — more evidence needed for {dim.replace('_', ' ')}"]
    return [
        f"Significant gap identified in {dim.replace('_', ' ')}",
        "Requires substantive improvement before programme entry"
    ]


def _rec_reasoning(rec: str, model: str) -> str:
    map_ = {
        "APPROVE": f"{model} recommends approval. Eligibility criteria are met and traction signals are sufficient for programme entry at this stage.",
        "DECLINE": f"{model} recommends decline. Key eligibility criteria or programme readiness signals are insufficient at this stage.",
        "NEEDS_MORE_INFO": f"{model} requires additional information on ownership structure and revenue validation before a recommendation can be made."
    }
    return map_.get(rec, f"{model}: {rec}")


# ── Demo application builders ─────────────────────────────────────────────────

def _base_state(app_id: str, name: str, sector: str, stage: str, programme: str,
                reg_no: str, inc_date: str, ownership: float, description: str,
                submitted_days_ago: int) -> GraphState:
    submitted = (datetime.utcnow() - timedelta(days=submitted_days_ago)).isoformat()
    return GraphState(
        application_id=app_id,
        startup_name=name,
        sector=sector,
        programme_applied=programme,
        ssm_document_base64="",
        pitch_deck_base64="",
        ocr_structured_json={
            "company_name": name,
            "registration_no": reg_no,
            "incorporation_date": inc_date,
            "total_malaysian_ownership_pct": ownership,
            "business_description": description,
            "directors": [
                {"name": "Ahmad Razif bin Abdullah", "ic_no": "850312-14-5678", "nationality": "Malaysian", "shareholding_pct": 60, "is_resident": True},
                {"name": "Lim Wei Ming", "ic_no": "880901-10-1234", "nationality": "Malaysian", "shareholding_pct": ownership - 60, "is_resident": True}
            ] if ownership >= 60 else [
                {"name": "Dr Nurul Hana binti Ismail", "ic_no": "791204-03-5432", "nationality": "Malaysian", "shareholding_pct": 45, "is_resident": True},
                {"name": "Singapore Health Ventures Pte Ltd", "nationality": "Foreign entity", "shareholding_pct": 25, "is_resident": False}
            ],
            "missing_fields": []
        },
        ocr_markdown="",
        eligibility_result=None,
        eligibility_reasoning="",
        eligibility_flags=[],
        eligibility_confidence=None,
        few_shot_cases=[],
        interview_questions=[],
        interview_answers=[],
        gemini_analysis=None,
        claude_analysis=None,
        grok_analysis=None,
        consolidated_analysis=None,
        judge_verdict=None,
        judge_override_reason=None,
        alignment_score=None,
        neo4j_startup_id=None,
        matched_mentors=[],
        registration_no=reg_no,
        incorporation_date=inc_date,
        total_malaysian_ownership_pct=ownership,
        business_description=description,
        stage=stage,
        submitted_at=submitted,
        status=ApplicationStatus.SUBMITTED,
        error_message=None,
    )


FINPAY_QA = [
    {"q": "What specific problem are you solving, and how did you validate it with real users?",
     "a": "Malaysian SMEs with 10–200 employees spend an average of 14 hours per month manually processing payroll across 3–5 disconnected tools. We validated this through 40 structured interviews with HR managers and confirmed it with 3 paying pilots at RM 15,000/month each."},
    {"q": "Walk us through your unit economics — what does it cost to acquire and serve one customer?",
     "a": "CAC is approximately RM 2,800 via direct outbound to HR software users. Monthly COGS per customer is RM 800 (infrastructure + support). At RM 5,000 ACV, payback period is under 8 months and LTV exceeds RM 38,000 at 36-month churn."},
    {"q": "Who are your two strongest direct competitors in Malaysia, and what is your defensible advantage?",
     "a": "PayrollPanda and Kakitangan are the incumbents. Our advantage is the open API layer — we sit under existing HR systems rather than replacing them, which reduces switching cost for the buyer and gives us a distribution edge through software partner channels."},
    {"q": "What is the single metric that best predicts your success, and what is it today?",
     "a": "Net Revenue Retention. It is currently 118% — customers expand usage as headcount grows. This is our strongest proof that the product delivers ongoing value beyond initial activation."},
]

MEDTECH_QA = [
    {"q": "Please clarify the foreign entity shareholding — Singapore Health Ventures holds 25%. How does this interact with the 51% Malaysian ownership requirement?",
     "a": "Malaysian shareholders (Dr Nurul Hana 45% + Prof Gan 30%) hold 75% combined, exceeding the 51% minimum. The Singapore entity holds a minority stake and has no board control rights. We obtained a legal opinion confirming this structure satisfies CIP Spark section 3.1."},
    {"q": "The IP is licensed from Universiti Malaya. Does CIP Spark section 4.2 cover your specific arrangement — a perpetual exclusive commercialisation licence?",
     "a": "Yes — our arrangement is a perpetual exclusive commercialisation licence for Malaysia and ASEAN, executed under UM's Technology Licensing Office standard terms. We have the signed agreement available and UM's innovation office has previously supported CIP applications under 4.2."},
    {"q": "You have 2 hospital pilots. What is the pathway from pilot to paid contract, and what is the decision timeline?",
     "a": "Both pilots are with government-linked hospitals. Purchase orders require Ministry of Health procurement approval, estimated 6–9 months. In parallel we are targeting 4 private hospital groups where procurement is faster (2–3 months). First paid contract expected Q3 2025."},
    {"q": "What specific evidence do you have of diabetic retinopathy prevalence in rural Malaysian clinics to justify this market?",
     "a": "MOH 2023 data shows 3.9 million Malaysians with diabetes, 30–40% at risk of retinopathy. Rural clinic screening rates are under 12% due to equipment cost. Our device costs 85% less than the current gold standard and requires no ophthalmologist — validated through 2 pilot sites with 340 screenings completed."},
]

AGRIDRONE_QA = [
    {"q": "You report RM 200K MRR — how is this split across customers and what is your largest single customer?",
     "a": "14 active customers. Largest is Felda subsidiary at RM 45,000/month. Average customer is RM 14,000/month. Top 3 customers account for 55% of MRR — concentration risk we are actively reducing through the SME paddy farmer channel."},
    {"q": "Drone regulations in Malaysia are evolving. What is your regulatory risk, and how are you managing it?",
     "a": "We hold a CAAM operator certificate and all pilots are licensed. The draft CAAM circular on agricultural drones (due Q2 2025) is expected to formalise our operating model. We are part of the industry working group and have a legal team monitoring this quarterly."},
    {"q": "What does your competitive moat look like in 18 months, given DJI's agriculture drone push into SEA?",
     "a": "Our moat is the operations layer — trained local pilots, ground teams, and agronomic data from 3 years of flights. DJI sells hardware; we sell outcomes (yield improvement + treatment records). Our contracts are outcome-based with penalty clauses, which no hardware vendor can replicate."},
]

CRYPTOSAFE_QA = [
    {"q": "Malaysian ownership is 40% — this is below the 51% minimum. Can this be remediated before programme entry?",
     "a": "The current cap table reflects a Series A round with a Cayman Islands fund taking 60% for a RM 3M investment. We do not have a clear path to restructure ownership to 51% Malaysian within the next 12 months without triggering investor rights."},
    {"q": "The company is incorporated in Labuan, not as a Sdn Bhd on the Peninsular. Does this affect eligibility?",
     "a": "We incorporated in Labuan as an IBFC entity. We understand this may not be equivalent to a Sdn Bhd under SSM for the purposes of CIP Spark eligibility. We are exploring a dual structure but do not have a resolution yet."},
]


# ── Main demo data loader ─────────────────────────────────────────────────────

def build_demo_applications() -> Dict[str, GraphState]:
    apps: Dict[str, GraphState] = {}

    # ── APP001: FinPay Sdn Bhd — PASS → AWAITING_VERDICT ──────────────────
    finpay = _base_state(
        app_id="APPDEMO001",
        name="FinPay Sdn Bhd",
        sector="Fintech",
        stage="Pre-seed",
        programme="CIP Spark",
        reg_no="202301012345",
        inc_date="2023-03-15",
        ownership=100.0,
        description="B2B embedded finance API for SME payroll and expense management. Enables non-financial apps to offer payroll, expense cards, and working capital loans via white-label API. 12 pilot customers, RM 45,000 MRR.",
        submitted_days_ago=3
    )
    finpay_analysis = _make_analysis(
        gemini_scores={"strengths": 8, "weaknesses": 5, "market_value": 7, "problem_statement": 8, "business_model": 7, "target_users": 8, "judging_criteria": 9},
        claude_scores={"strengths": 8, "weaknesses": 6, "market_value": 7, "problem_statement": 9, "business_model": 7, "target_users": 8, "judging_criteria": 8},
        grok_scores={"strengths": 9, "weaknesses": 4, "market_value": 6, "problem_statement": 8, "business_model": 6, "target_users": 7, "judging_criteria": 8},
        gemini_rec="APPROVE", claude_rec="APPROVE", grok_rec="APPROVE"
    )
    apps["APPDEMO001"] = {
        **finpay,
        "eligibility_result": "PASS",
        "eligibility_reasoning": "Company meets all CIP Spark criteria: incorporated in Malaysia as Sdn Bhd, 100% Malaysian ownership (exceeds 51% minimum), both directors are Malaysian residents with valid IC numbers, company is 2 years old (under 5-year limit), and business description confirms it is not a subsidiary of a large entity. Recommended programme: CIP Spark.",
        "eligibility_flags": [],
        "eligibility_confidence": 0.97,
        "few_shot_cases": [],
        "interview_questions": [qa["q"] for qa in FINPAY_QA],
        "interview_answers": [qa["a"] for qa in FINPAY_QA],
        "gemini_analysis": finpay_analysis["dimensions"]["strengths"],  # will be overwritten below
        "claude_analysis": None,
        "grok_analysis": None,
        "consolidated_analysis": finpay_analysis,
        "status": ApplicationStatus.AWAITING_VERDICT,
        "submitted_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
    }
    # Fix — store full model outputs separately
    apps["APPDEMO001"]["gemini_analysis"] = {
        "model": "Gemini 3 Flash Preview", "error": False,
        "dimensions": {d: finpay_analysis["dimensions"][d]["gemini"] for d in finpay_analysis["dimensions"]},
        "overall_recommendation": "APPROVE",
        "recommendation_reasoning": _rec_reasoning("APPROVE", "Gemini")
    }
    apps["APPDEMO001"]["claude_analysis"] = {
        "model": "Claude Sonnet 4.6", "error": False,
        "dimensions": {d: finpay_analysis["dimensions"][d]["claude"] for d in finpay_analysis["dimensions"]},
        "overall_recommendation": "APPROVE",
        "recommendation_reasoning": _rec_reasoning("APPROVE", "Claude")
    }
    apps["APPDEMO001"]["grok_analysis"] = {
        "model": "Grok 4.20 reasoning", "error": False,
        "dimensions": {d: finpay_analysis["dimensions"][d]["grok"] for d in finpay_analysis["dimensions"]},
        "overall_recommendation": "APPROVE",
        "recommendation_reasoning": _rec_reasoning("APPROVE", "Grok")
    }

    # ── APP002: MedTech IP Co — MANUAL_REVIEW → AWAITING_VERDICT (override demo) ──
    medtech = _base_state(
        app_id="APPDEMO002",
        name="MedTech IP Co Sdn Bhd",
        sector="Healthtech",
        stage="Pre-seed",
        programme="CIP Spark",
        reg_no="202209098765",
        inc_date="2022-09-01",
        ownership=75.0,
        description="AI-powered early diabetic retinopathy screening tool for rural Malaysian clinics. Licensed diagnostic algorithm from Universiti Malaya under exclusive commercialisation agreement (CIP Spark section 4.2). 2 hospital pilots confirmed.",
        submitted_days_ago=5
    )
    medtech_analysis = _make_analysis(
        gemini_scores={"strengths": 7, "weaknesses": 6, "market_value": 8, "problem_statement": 9, "business_model": 5, "target_users": 8, "judging_criteria": 6},
        claude_scores={"strengths": 7, "weaknesses": 5, "market_value": 7, "problem_statement": 8, "business_model": 5, "target_users": 7, "judging_criteria": 5},
        grok_scores={"strengths": 8, "weaknesses": 7, "market_value": 8, "problem_statement": 9, "business_model": 6, "target_users": 8, "judging_criteria": 7},
        gemini_rec="NEEDS_MORE_INFO", claude_rec="NEEDS_MORE_INFO", grok_rec="APPROVE"
    )
    apps["APPDEMO002"] = {
        **medtech,
        "eligibility_result": "MANUAL_REVIEW",
        "eligibility_reasoning": "Application triggers manual review due to: (1) foreign entity (Singapore Health Ventures) holds 25% — while total Malaysian ownership is 75% exceeding the 51% threshold, the presence of a non-resident foreign entity requires verification of board control rights; (2) core IP is licensed from Universiti Malaya — this may qualify under CIP Spark section 4.2 (university IP exception) but requires documentation confirming the licence terms; (3) one director IC number listed as N/A. Overall Malaysian ownership is above threshold, but these flags require human assessment.",
        "eligibility_flags": ["FOREIGN_ENTITY_SHAREHOLDING_25PCT", "UNIVERSITY_IP_LICENCE_SECTION_4.2_VERIFICATION_REQUIRED", "DIRECTOR_IC_MISSING"],
        "eligibility_confidence": 0.62,
        "few_shot_cases": [],
        "interview_questions": [qa["q"] for qa in MEDTECH_QA],
        "interview_answers": [qa["a"] for qa in MEDTECH_QA],
        "consolidated_analysis": medtech_analysis,
        "status": ApplicationStatus.AWAITING_VERDICT,
        "submitted_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
    }
    apps["APPDEMO002"]["gemini_analysis"] = {
        "model": "Gemini 3 Flash Preview", "error": False,
        "dimensions": {d: medtech_analysis["dimensions"][d]["gemini"] for d in medtech_analysis["dimensions"]},
        "overall_recommendation": "NEEDS_MORE_INFO",
        "recommendation_reasoning": _rec_reasoning("NEEDS_MORE_INFO", "Gemini")
    }
    apps["APPDEMO002"]["claude_analysis"] = {
        "model": "Claude Sonnet 4.6", "error": False,
        "dimensions": {d: medtech_analysis["dimensions"][d]["claude"] for d in medtech_analysis["dimensions"]},
        "overall_recommendation": "NEEDS_MORE_INFO",
        "recommendation_reasoning": _rec_reasoning("NEEDS_MORE_INFO", "Claude")
    }
    apps["APPDEMO002"]["grok_analysis"] = {
        "model": "Grok 4.20 reasoning", "error": False,
        "dimensions": {d: medtech_analysis["dimensions"][d]["grok"] for d in medtech_analysis["dimensions"]},
        "overall_recommendation": "APPROVE",
        "recommendation_reasoning": _rec_reasoning("APPROVE", "Grok")
    }

    # ── APP003: AgriDrone Solutions — APPROVED (already through full pipeline) ──
    agridrone = _base_state(
        app_id="APPDEMO003",
        name="AgriDrone Solutions Sdn Bhd",
        sector="AgriTech",
        stage="Seed",
        programme="CIP Sprint",
        reg_no="201808087654",
        inc_date="2018-08-30",
        ownership=72.0,
        description="Precision drone spraying and monitoring for paddy and palm oil smallholders. RM 200K MRR, 14 enterprise customers across Kedah, Perak and Johor. CAAM-certified operator with 24 licensed pilots.",
        submitted_days_ago=14
    )
    agridrone_analysis = _make_analysis(
        gemini_scores={"strengths": 9, "weaknesses": 5, "market_value": 8, "problem_statement": 8, "business_model": 8, "target_users": 7, "judging_criteria": 8},
        claude_scores={"strengths": 8, "weaknesses": 6, "market_value": 8, "problem_statement": 8, "business_model": 8, "target_users": 8, "judging_criteria": 9},
        grok_scores={"strengths": 9, "weaknesses": 5, "market_value": 7, "problem_statement": 8, "business_model": 8, "target_users": 7, "judging_criteria": 8},
        gemini_rec="APPROVE", claude_rec="APPROVE", grok_rec="APPROVE"
    )
    apps["APPDEMO003"] = {
        **agridrone,
        "eligibility_result": "PASS",
        "eligibility_reasoning": "Company meets all CIP Sprint criteria: incorporated in Malaysia as Sdn Bhd, 72% Malaysian ownership (exceeds 51% minimum), resident directors confirmed, company is 6 years old (within 10-year Sprint limit), RM 200K MRR demonstrates commercialisation. Recommended programme: CIP Sprint.",
        "eligibility_flags": [],
        "eligibility_confidence": 0.94,
        "few_shot_cases": [],
        "interview_questions": [qa["q"] for qa in AGRIDRONE_QA],
        "interview_answers": [qa["a"] for qa in AGRIDRONE_QA],
        "consolidated_analysis": agridrone_analysis,
        "judge_verdict": "APPROVE",
        "judge_override_reason": None,
        "alignment_score": 1,
        "neo4j_startup_id": "SAPPDEMO003",
        "matched_mentors": [
            {"id": "M004", "name": "Ahmad Razif", "expertise": "E-commerce", "sectors": ["Retail Tech", "Logistics"], "country": "MY"},
            {"id": "M003", "name": "Priya Nair", "expertise": "AI/ML", "sectors": ["Computer Vision", "NLP"], "country": "MY"},
        ],
        "status": ApplicationStatus.APPROVED,
        "submitted_at": (datetime.utcnow() - timedelta(days=14)).isoformat(),
    }
    apps["APPDEMO003"]["gemini_analysis"] = {
        "model": "Gemini 3 Flash Preview", "error": False,
        "dimensions": {d: agridrone_analysis["dimensions"][d]["gemini"] for d in agridrone_analysis["dimensions"]},
        "overall_recommendation": "APPROVE",
        "recommendation_reasoning": _rec_reasoning("APPROVE", "Gemini")
    }
    apps["APPDEMO003"]["claude_analysis"] = {
        "model": "Claude Sonnet 4.6", "error": False,
        "dimensions": {d: agridrone_analysis["dimensions"][d]["claude"] for d in agridrone_analysis["dimensions"]},
        "overall_recommendation": "APPROVE",
        "recommendation_reasoning": _rec_reasoning("APPROVE", "Claude")
    }
    apps["APPDEMO003"]["grok_analysis"] = {
        "model": "Grok 4.20 reasoning", "error": False,
        "dimensions": {d: agridrone_analysis["dimensions"][d]["grok"] for d in agridrone_analysis["dimensions"]},
        "overall_recommendation": "APPROVE",
        "recommendation_reasoning": _rec_reasoning("APPROVE", "Grok")
    }

    # ── APP004: CryptoSafe MY — DECLINED (eligibility FAIL) ───────────────────
    cryptosafe = _base_state(
        app_id="APPDEMO004",
        name="CryptoSafe MY Sdn Bhd",
        sector="Fintech",
        stage="Pre-seed",
        programme="CIP Spark",
        reg_no="202011054321",
        inc_date="2020-11-20",
        ownership=40.0,
        description="Institutional-grade crypto custody and compliance platform for Malaysian digital asset exchanges. Cayman Islands Series A investor holds 60% equity.",
        submitted_days_ago=10
    )
    apps["APPDEMO004"] = {
        **cryptosafe,
        "eligibility_result": "FAIL",
        "eligibility_reasoning": "Application fails CIP Spark eligibility on two grounds: (1) Malaysian ownership is 40%, which is below the mandatory 51% minimum threshold — the Cayman Islands fund holds 60% majority; (2) the company appears to be incorporated in Labuan as an IBFC entity, not as a standard Sdn Bhd under SSM. Both issues are categorical failures under the programme rules. There is no exception pathway for either criterion.",
        "eligibility_flags": ["MALAYSIAN_OWNERSHIP_BELOW_51PCT", "LABUAN_IBFC_NOT_SDN_BHD", "FOREIGN_MAJORITY_SHAREHOLDER"],
        "eligibility_confidence": 0.98,
        "interview_questions": [qa["q"] for qa in CRYPTOSAFE_QA],
        "interview_answers": [qa["a"] for qa in CRYPTOSAFE_QA],
        "consolidated_analysis": None,
        "judge_verdict": "DECLINE",
        "judge_override_reason": None,
        "alignment_score": 0,
        "status": ApplicationStatus.REJECTED,
        "submitted_at": (datetime.utcnow() - timedelta(days=10)).isoformat(),
    }

    # ── APP005: GreenHarvest Platform — interview_pending (mid-pipeline) ──────
    greenharvest = _base_state(
        app_id="APPDEMO005",
        name="GreenHarvest Platform Sdn Bhd",
        sector="AgriTech",
        stage="Pre-seed",
        programme="CIP Spark",
        reg_no="202305023456",
        inc_date="2023-05-01",
        ownership=100.0,
        description="B2B marketplace connecting Malaysian smallholders directly to supermarket buyers, eliminating middlemen. RM 30K GMV in month one. 100% Malaysian founded.",
        submitted_days_ago=1
    )
    apps["APPDEMO005"] = {
        **greenharvest,
        "eligibility_result": "PASS",
        "eligibility_reasoning": "All CIP Spark criteria met: 100% Malaysian ownership, resident founder-director, company incorporated 12 months ago (well under 5-year limit), business description indicates no subsidiary relationship. Clean application. Recommended: CIP Spark.",
        "eligibility_flags": [],
        "eligibility_confidence": 0.99,
        "interview_questions": [
            "What is your current GMV and month-on-month growth rate for the first 3 months of operation?",
            "How do you ensure supply reliability from smallholders during peak demand from supermarket buyers?",
            "Walk us through how a smallholder onboards and lists produce on your platform — what does the UX look like for a non-tech-savvy farmer?",
            "Who are your two strongest competitors and how does your commission or fee structure compare?",
        ],
        "interview_answers": [],
        "status": ApplicationStatus.INTERVIEW_PENDING,
        "submitted_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
    }

    # ── APP006: NursingCare Tech — judging in progress ─────────────────────
    nursingcare = _base_state(
        app_id="APPDEMO006",
        name="NursingCare Tech Sdn Bhd",
        sector="Healthtech",
        stage="Pre-seed",
        programme="CIP Spark",
        reg_no="202303045678",
        inc_date="2023-03-10",
        ownership=100.0,
        description="SaaS scheduling and patient management tool for private Malaysian clinics. 12 paying clinics at RM 499/month. Founder is a registered nurse with 8 years of clinical experience.",
        submitted_days_ago=7
    )
    apps["APPDEMO006"] = {
        **nursingcare,
        "eligibility_result": "PASS",
        "eligibility_reasoning": "All CIP Spark criteria met: 100% Malaysian ownership, registered nurse founder holds resident director status with valid IC, company is 14 months old, no subsidiary relationship. Strong application with immediate traction evidence. Recommended: CIP Spark.",
        "eligibility_flags": [],
        "eligibility_confidence": 0.96,
        "interview_questions": [
            "You have 12 paying clinics at RM 499/month — what is your month-on-month churn rate and NPS score?",
            "As a solo technical founder, how are you managing product development, sales, and clinical ops simultaneously?",
            "What prevents a large EHR vendor like iMedic or Doctoroncall from replicating your scheduling feature?",
            "Walk us through your expansion plan from 12 to 100 clinics — what is the primary growth lever?",
        ],
        "interview_answers": [
            "Churn is zero in 6 months of operation — no clinic has cancelled. NPS is 72, collected through an in-app survey. Clinics cite staff scheduling automation as the primary value driver.",
            "I co-founded with a CTO who handles all engineering. My focus is clinical workflow design and sales to clinic owners, which I can reach through the Malaysian Medical Association network.",
            "iMedic's scheduling module is buried in a RM 15,000/year EHR system. Our tool is standalone, mobile-first, and set up in under 2 hours. The TAM we address — clinics with 1–5 doctors — is too small for large vendors to prioritise.",
            "Primary lever is word-of-mouth within clinic owner networks. 8 of 12 current clinics came through referrals. We plan to formalise this with a referral programme and target Malaysian Medical Clinic Association events for Q3 expansion.",
        ],
        "status": ApplicationStatus.JUDGING,
        "submitted_at": (datetime.utcnow() - timedelta(days=7)).isoformat(),
    }

    return apps


# ── Neo4j writer for approved demo startups ───────────────────────────────────

async def write_approved_to_neo4j(apps: Dict[str, GraphState]):
    """Write APPROVED demo applications into Neo4j as Startup nodes with all relationships."""
    approved = {k: v for k, v in apps.items() if v.get("judge_verdict") == "APPROVE"}

    if not approved:
        return

    try:
        async with Neo4jClient.session() as session:
            for app_id, state in approved.items():
                startup_id = state.get("neo4j_startup_id") or f"S{app_id}"
                verdict_id = f"VDEMO{app_id}"
                inference_id = f"IDEMO{app_id}"

                await session.run(
                    """
                    MERGE (s:Startup {id: $startup_id})
                    SET s.name = $name, s.sector = $sector, s.stage = $stage,
                        s.incorporation_date = $inc_date,
                        s.country = 'MY', s.milestone_count = 0,
                        s.video_verified = false, s.status = 'approved',
                        s.approved_at = datetime()
                    """,
                    startup_id=startup_id,
                    name=state["startup_name"],
                    sector=state["sector"],
                    stage=state.get("stage", "Pre-seed"),
                    inc_date=state.get("incorporation_date", "")
                )

                await session.run(
                    """
                    MATCH (s:Startup {id: $sid})
                    MATCH (p:Programme {name: $prog})
                    MERGE (s)-[:ENROLLED_IN]->(p)
                    """,
                    sid=startup_id,
                    prog=state.get("programme_applied", "CIP Spark")
                )

                await session.run(
                    """
                    MERGE (v:JudgeVerdict {id: $vid})
                    SET v.verdict = 'APPROVE', v.reasoning = $reasoning,
                        v.timestamp = datetime(), v.judge_id = 'judge_001'
                    WITH v
                    MATCH (s:Startup {id: $sid})
                    MERGE (s)-[:REVIEWED_BY {alignment_score: 1}]->(v)
                    """,
                    vid=verdict_id,
                    reasoning=state.get("eligibility_reasoning", ""),
                    sid=startup_id
                )

                for mentor in state.get("matched_mentors", []):
                    await session.run(
                        """
                        MATCH (s:Startup {id: $sid})
                        MATCH (m:Mentor {id: $mid})
                        MERGE (s)-[:MATCHED_TO {score: 0.85, matched_at: datetime()}]->(m)
                        """,
                        sid=startup_id,
                        mid=mentor["id"]
                    )

                if state.get("consolidated_analysis"):
                    await session.run(
                        """
                        MERGE (i:InferenceResult {id: $iid})
                        SET i.consolidated_json = $cjson, i.timestamp = datetime()
                        WITH i
                        MATCH (s:Startup {id: $sid})
                        MERGE (s)-[:HAS_INFERENCE]->(i)
                        """,
                        iid=inference_id,
                        cjson=json.dumps(state["consolidated_analysis"]),
                        sid=startup_id
                    )

        logger.info(f"Wrote {len(approved)} approved demo startups to Neo4j")
    except Exception as e:
        logger.error(f"Failed to write demo data to Neo4j: {e}")


async def load_demo_data(applications: Dict[str, GraphState]):
    """Load all demo applications into the in-memory store and write approved ones to Neo4j."""
    demo_apps = build_demo_applications()
    applications.update(demo_apps)
    logger.info(f"Loaded {len(demo_apps)} demo applications into memory")

    await write_approved_to_neo4j(demo_apps)
