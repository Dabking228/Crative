from typing import TypedDict, Optional, List, Dict, Any
from enum import Enum


class ApplicationStatus(str, Enum):
    SUBMITTED = "submitted"
    OCR_COMPLETE = "ocr_complete"
    ELIGIBLE = "eligible"
    REJECTED = "rejected"
    INTERVIEW_PENDING = "interview_pending"
    INTERVIEW_COMPLETE = "interview_complete"
    JUDGING = "judging"
    AWAITING_VERDICT = "awaiting_verdict"
    APPROVED = "approved"
    DECLINED = "declined"


class GraphState(TypedDict):
    # Identity
    application_id: str
    startup_name: str
    sector: str
    programme_applied: str

    # Raw document inputs (base64)
    ssm_document_base64: str
    pitch_deck_base64: str

    # OCR output
    ocr_structured_json: Optional[Dict[str, Any]]
    ocr_markdown: Optional[str]

    # Eligibility
    eligibility_result: Optional[str]   # PASS | FAIL | MANUAL_REVIEW
    eligibility_reasoning: str
    eligibility_flags: List[str]
    eligibility_confidence: Optional[float]

    # Few-shot cases retrieved from Neo4j
    few_shot_cases: List[Dict[str, Any]]

    # Interview
    interview_questions: List[str]
    interview_answers: List[str]

    # Judge analyses — raw model outputs
    gemini_analysis: Optional[Dict[str, Any]]
    claude_analysis: Optional[Dict[str, Any]]
    grok_analysis: Optional[Dict[str, Any]]
    consolidated_analysis: Optional[Dict[str, Any]]

    # Human verdict
    judge_verdict: Optional[str]   # APPROVE | DECLINE
    judge_override_reason: Optional[str]
    alignment_score: Optional[int]   # +1 or -1

    # Graph outputs
    neo4j_startup_id: Optional[str]
    matched_mentors: List[Dict[str, Any]]

    # Submission metadata
    registration_no: Optional[str]
    incorporation_date: Optional[str]
    total_malaysian_ownership_pct: Optional[float]
    business_description: Optional[str]
    stage: Optional[str]
    submitted_at: Optional[str]

    # Lifecycle
    status: ApplicationStatus
    error_message: Optional[str]
