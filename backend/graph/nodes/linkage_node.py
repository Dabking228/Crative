import uuid
import json
import logging
from graph.state import GraphState, ApplicationStatus
from services.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)


async def linkage_node(state: GraphState) -> GraphState:
    if state.get("judge_verdict") != "APPROVE":
        return {**state, "status": ApplicationStatus.DECLINED}

    startup_id = state.get("neo4j_startup_id") or f"S{uuid.uuid4().hex[:8].upper()}"
    verdict_id = f"V{uuid.uuid4().hex[:8].upper()}"
    inference_id = f"I{uuid.uuid4().hex[:8].upper()}"
    consolidated = state.get("consolidated_analysis") or {}

    try:
        async with Neo4jClient.session() as session:
            await session.run(
                """
                MERGE (s:Startup {id: $startup_id})
                SET s.name = $name, s.sector = $sector, s.stage = $stage,
                    s.incorporation_date = $incorporation_date,
                    s.country = 'MY', s.milestone_count = 0,
                    s.video_verified = false, s.status = 'approved',
                    s.approved_at = datetime()
                """,
                startup_id=startup_id,
                name=state.get("startup_name", "Unknown"),
                sector=state.get("sector", "Unknown"),
                stage=state.get("stage", "Pre-seed"),
                incorporation_date=state.get("incorporation_date", "")
            )

            programme = state.get("programme_applied", "CIP Spark")
            await session.run(
                """
                MATCH (s:Startup {id: $startup_id})
                MATCH (p:Programme {name: $programme_name})
                MERGE (s)-[:ENROLLED_IN]->(p)
                """,
                startup_id=startup_id, programme_name=programme
            )

            await session.run(
                """
                MERGE (v:JudgeVerdict {id: $verdict_id})
                SET v.verdict = $verdict, v.reasoning = $reasoning,
                    v.override_reason = $override_reason,
                    v.timestamp = datetime(), v.judge_id = $judge_id
                WITH v
                MATCH (s:Startup {id: $startup_id})
                MERGE (s)-[:REVIEWED_BY {alignment_score: $alignment_score}]->(v)
                """,
                verdict_id=verdict_id,
                verdict=state.get("judge_verdict"),
                reasoning=state.get("eligibility_reasoning", ""),
                override_reason=state.get("judge_override_reason") or "",
                judge_id="judge_001",
                startup_id=startup_id,
                alignment_score=state.get("alignment_score", 0)
            )

            sector = state.get("sector", "")
            result = await session.run(
                """
                MATCH (m:Mentor)
                WHERE m.expertise = $sector OR $sector IN m.sectors
                WITH m LIMIT 3
                RETURN m.id AS id, m.name AS name, m.expertise AS expertise,
                       m.sectors AS sectors, m.country AS country
                """,
                sector=sector
            )
            mentor_records = await result.data()

            if not mentor_records:
                fallback = await session.run(
                    "MATCH (m:Mentor) RETURN m.id AS id, m.name AS name, m.expertise AS expertise, m.sectors AS sectors, m.country AS country LIMIT 3"
                )
                mentor_records = await fallback.data()

            for m in mentor_records:
                await session.run(
                    """
                    MATCH (s:Startup {id: $startup_id})
                    MATCH (m:Mentor {id: $mentor_id})
                    MERGE (s)-[:MATCHED_TO {score: 0.85, matched_at: datetime()}]->(m)
                    """,
                    startup_id=startup_id, mentor_id=m["id"]
                )

            await session.run(
                """
                MERGE (i:InferenceResult {id: $inference_id})
                SET i.gemini_json = $gemini_json, i.claude_json = $claude_json,
                    i.grok_json = $grok_json, i.consolidated_json = $consolidated_json,
                    i.timestamp = datetime()
                WITH i
                MATCH (s:Startup {id: $startup_id})
                MERGE (s)-[:HAS_INFERENCE]->(i)
                """,
                inference_id=inference_id,
                gemini_json=json.dumps(state.get("gemini_analysis") or {}),
                claude_json=json.dumps(state.get("claude_analysis") or {}),
                grok_json=json.dumps(state.get("grok_analysis") or {}),
                consolidated_json=json.dumps(consolidated),
                startup_id=startup_id
            )

        matched_mentors = [
            {"id": m["id"], "name": m["name"], "expertise": m["expertise"],
             "sectors": m.get("sectors", []), "country": m.get("country", "MY")}
            for m in mentor_records
        ]

        return {
            **state,
            "neo4j_startup_id": startup_id,
            "matched_mentors": matched_mentors,
            "status": ApplicationStatus.APPROVED
        }

    except Exception as e:
        logger.error(f"Linkage node failed: {e}")
        return {
            **state,
            "neo4j_startup_id": startup_id,
            "matched_mentors": [],
            "status": ApplicationStatus.APPROVED,
            "error_message": f"Graph linkage partial failure: {str(e)}"
        }
