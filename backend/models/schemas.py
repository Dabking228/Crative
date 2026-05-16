from pydantic import BaseModel
from typing import Optional, List, Dict, Any
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


class ApplyRequest(BaseModel):
    startup_name: str
    sector: str
    stage: str
    programme_applied: str
    registration_no: str
    incorporation_date: str
    total_malaysian_ownership_pct: float
    business_description: str
    ssm_document_base64: str
    pitch_deck_base64: str


class InterviewSubmitRequest(BaseModel):
    questions: List[str]
    answers: List[str]


class VerdictRequest(BaseModel):
    verdict: str  # APPROVE | DECLINE
    override_reason: Optional[str] = None
    judge_id: Optional[str] = "judge_001"


class MilestoneUploadRequest(BaseModel):
    video_base64: str
    milestone_description: str
    milestone_name: str


class ApplicationResponse(BaseModel):
    application_id: str
    status: str
    message: str


class StatusResponse(BaseModel):
    application_id: str
    status: str
    eligibility_result: Optional[str] = None
    eligibility_reasoning: Optional[str] = None
    eligibility_flags: List[str] = []
    eligibility_confidence: Optional[float] = None
    programme_recommended: Optional[str] = None
    startup_name: Optional[str] = None
    sector: Optional[str] = None


class JudgeQueueItem(BaseModel):
    application_id: str
    startup_name: str
    sector: str
    stage: str
    programme_applied: str
    submitted_at: str
    eligibility_result: Optional[str] = None
    status: str


class JudgeDetailResponse(BaseModel):
    application_id: str
    startup_name: str
    sector: str
    stage: str
    programme_applied: str
    submitted_at: str
    eligibility_result: Optional[str] = None
    eligibility_reasoning: Optional[str] = None
    eligibility_flags: List[str] = []
    eligibility_confidence: Optional[float] = None
    consolidated_analysis: Optional[Dict[str, Any]] = None
    interview_qa: List[Dict[str, str]] = []
    status: str
    judge_verdict: Optional[str] = None
    matched_mentors: List[Dict[str, Any]] = []


class VerdictResponse(BaseModel):
    application_id: str
    verdict: str
    alignment_score: int
    matched_mentors: List[Dict[str, Any]] = []
    programme_enrolled: Optional[str] = None
    message: str


class HealthResponse(BaseModel):
    status: str
    vertex_ai: bool
    neo4j: bool
    auradb_instance: Optional[str] = None
    timestamp: str


class GraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    links: List[Dict[str, Any]]


class MilestoneStatusResponse(BaseModel):
    milestone_name: str
    checklist: List[Dict[str, Any]]
    verified_count: int
    total_count: int
    threshold: int
    milestone_passed: bool
    confidence: float
    manual_review_required: bool
