import json
import logging
from typing import Dict

from graph.state import GraphState, ApplicationStatus
from services.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)

_QUERY = """
MATCH (s:Startup)
WHERE s.app_id IS NOT NULL AND s.app_id <> ''
OPTIONAL MATCH (s)-[:ENROLLED_IN]->(p:Programme)
OPTIONAL MATCH (s)-[:MATCHED_TO]->(m:Mentor)
OPTIONAL MATCH (s)-[rv:REVIEWED_BY]->(v:JudgeVerdict)
OPTIONAL MATCH (s)-[:HAS_INFERENCE]->(i:InferenceResult)
RETURN
    s.app_id            AS app_id,
    s.id                AS neo4j_startup_id,
    s.name              AS startup_name,
    s.sector            AS sector,
    s.stage             AS stage,
    s.incorporation_date AS incorporation_date,
    p.name              AS programme,
    collect(DISTINCT {id: m.id, name: m.name, expertise: m.expertise,
                      sectors: m.sectors, country: m.country}) AS mentors,
    v.verdict           AS verdict,
    v.reasoning         AS reasoning,
    v.override_reason   AS override_reason,
    rv.alignment_score  AS alignment_score,
    i.consolidated_json AS consolidated_json,
    i.gemini_json       AS gemini_json,
    i.claude_json       AS claude_json,
    i.grok_json         AS grok_json
"""


async def load_approved_from_neo4j(applications: Dict[str, GraphState]) -> None:
    """Reload previously approved applications from Neo4j into the in-memory store.

    Skips any app_id already present (demo apps or duplicates).
    """
    try:
        async with Neo4jClient.session() as session:
            result = await session.run(_QUERY)
            records = await result.data()

        loaded = 0
        for rec in records:
            app_id = rec.get("app_id")
            if not app_id or app_id in applications:
                continue

            consolidated = _parse(rec.get("consolidated_json"))
            gemini      = _parse(rec.get("gemini_json"))
            claude      = _parse(rec.get("claude_json"))
            grok        = _parse(rec.get("grok_json"))

            mentors = [m for m in (rec.get("mentors") or []) if m.get("id")]

            state: GraphState = {
                "application_id":               app_id,
                "startup_name":                 rec.get("startup_name") or "",
                "sector":                       rec.get("sector") or "",
                "stage":                        rec.get("stage") or "Pre-seed",
                "programme_applied":            rec.get("programme") or "CIP Spark",
                "incorporation_date":           rec.get("incorporation_date") or "",
                "status":                       ApplicationStatus.APPROVED,
                "judge_verdict":                rec.get("verdict") or "APPROVE",
                "judge_override_reason":        rec.get("override_reason") or None,
                "alignment_score":              rec.get("alignment_score"),
                "neo4j_startup_id":             rec.get("neo4j_startup_id"),
                "matched_mentors":              mentors,
                "consolidated_analysis":        consolidated,
                "gemini_analysis":              gemini,
                "claude_analysis":              claude,
                "grok_analysis":                grok,
                "eligibility_result":           "PASS",
                "eligibility_reasoning":        rec.get("reasoning") or "",
                "eligibility_flags":            [],
                "eligibility_confidence":       None,
                "few_shot_cases":               [],
                "interview_questions":          [],
                "interview_answers":            [],
                "ssm_document_base64":          "",
                "pitch_deck_base64":            "",
                "ocr_structured_json":          None,
                "ocr_markdown":                 None,
                "registration_no":              None,
                "total_malaysian_ownership_pct": None,
                "business_description":         None,
                "submitted_at":                 None,
                "error_message":                None,
            }
            applications[app_id] = state
            loaded += 1

        logger.info(f"Loaded {loaded} approved application(s) from Neo4j")

    except Exception as e:
        logger.warning(f"Could not load approved apps from Neo4j: {e}")


def _parse(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return {}
