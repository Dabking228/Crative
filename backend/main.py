import asyncio
import json
import logging
import os
import re
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from graph.state import ApplicationStatus, GraphState
from graph.workflow import app_workflow
from models.schemas import (
    ApplyRequest,
    ApplicationResponse,
    GraphResponse,
    HealthResponse,
    InterviewSubmitRequest,
    JudgeDetailResponse,
    JudgeQueueItem,
    MilestoneStatusResponse,
    MilestoneUploadRequest,
    StatusResponse,
    VerdictRequest,
    VerdictResponse,
)
from services.neo4j_client import Neo4jClient
from services.vertex_ai import init_vertex_ai, test_vertex_ai_connection
from graph.nodes.vision_verification import verify_milestone_video
from graph.nodes.judging_consolidator import judging_consolidator
from graph.nodes.alignment_node import alignment_node
from graph.nodes.linkage_node import linkage_node

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory application store (production: use Redis)
applications: Dict[str, GraphState] = {}


async def _run_seed_if_needed():
    try:
        async with Neo4jClient.session() as session:
            result = await session.run("MATCH (p:Programme) RETURN count(p) AS cnt")
            record = await result.single()
            if record and record["cnt"] > 0:
                logger.info("Neo4j already seeded — skipping")
                return
        logger.info("Seeding Neo4j...")
        from seed.seed_neo4j import seed
        await seed()
    except Exception as e:
        logger.error(f"Seed check failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Cradle API…")

    try:
        init_vertex_ai()
        logger.info("Vertex AI initialised")
    except Exception as e:
        logger.warning(f"Vertex AI init warning: {e}")

    try:
        await Neo4jClient.connect()
        logger.info("Neo4j connected")
        await _run_seed_if_needed()
        from seed.load_from_neo4j import load_approved_from_neo4j
        await load_approved_from_neo4j(applications)
        from seed.demo_data import load_demo_data
        await load_demo_data(applications)
        logger.info("Demo data loaded")
    except Exception as e:
        logger.error(f"Neo4j connection failed: {e}")
        raise RuntimeError(f"Database unavailable: {e}")

    yield

    await Neo4jClient.close()
    logger.info("Shutdown complete")


app = FastAPI(title="Cradle Ecosystem Portal API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse)
async def health():
    vertex_ok = await test_vertex_ai_connection()
    neo4j_ok = await Neo4jClient.health_check()
    auradb_instance = await Neo4jClient.get_auradb_instance()
    return HealthResponse(
        status="ok" if (vertex_ok and neo4j_ok) else "degraded",
        vertex_ai=vertex_ok,
        neo4j=neo4j_ok,
        auradb_instance=auradb_instance,
        timestamp=datetime.utcnow().isoformat()
    )


# ── Application submission ─────────────────────────────────────────────────────

@app.post("/api/apply", response_model=ApplicationResponse)
async def apply(request: ApplyRequest):
    application_id = f"APP{uuid.uuid4().hex[:8].upper()}"
    initial_state: GraphState = {
        "application_id": application_id,
        "startup_name": request.startup_name,
        "sector": request.sector,
        "programme_applied": request.programme_applied,
        "ssm_document_base64": request.ssm_document_base64,
        "pitch_deck_base64": request.pitch_deck_base64,
        "registration_no": request.registration_no,
        "incorporation_date": request.incorporation_date,
        "total_malaysian_ownership_pct": request.total_malaysian_ownership_pct,
        "business_description": request.business_description,
        "stage": request.stage,
        "submitted_at": datetime.utcnow().isoformat(),
        "ocr_structured_json": None,
        "ocr_markdown": None,
        "eligibility_result": None,
        "eligibility_reasoning": "",
        "eligibility_flags": [],
        "eligibility_confidence": None,
        "few_shot_cases": [],
        "interview_questions": [],
        "interview_answers": [],
        "gemini_analysis": None,
        "claude_analysis": None,
        "grok_analysis": None,
        "consolidated_analysis": None,
        "judge_verdict": None,
        "judge_override_reason": None,
        "alignment_score": None,
        "neo4j_startup_id": None,
        "matched_mentors": [],
        "status": ApplicationStatus.SUBMITTED,
        "error_message": None,
    }
    applications[application_id] = initial_state
    asyncio.create_task(_run_initial_pipeline(application_id, initial_state))
    return ApplicationResponse(
        application_id=application_id,
        status=ApplicationStatus.SUBMITTED,
        message=f"Application submitted. Stream eligibility at /api/apply/{application_id}/stream"
    )


async def _run_initial_pipeline(application_id: str, state: GraphState):
    try:
        result = await app_workflow.ainvoke(state)
        applications[application_id] = result
        logger.info(f"Pipeline complete for {application_id}: {result.get('status')}")
    except Exception as e:
        logger.error(f"Pipeline failed for {application_id}: {e}")
        applications[application_id] = {
            **state,
            "status": ApplicationStatus.ELIGIBLE,
            "error_message": str(e)
        }


@app.get("/api/apply/{application_id}/stream")
async def stream_gatekeeper(application_id: str):
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")

    async def event_generator():
        from vertexai.generative_models import GenerativeModel, GenerationConfig
        from prompts.gatekeeper import GATEKEEPER_PROMPT

        state = applications[application_id]
        # Wait for OCR to complete (up to 60s)
        for _ in range(60):
            if state.get("status") != ApplicationStatus.SUBMITTED:
                break
            await asyncio.sleep(1)
            state = applications[application_id]

        ocr_text = json.dumps(state.get("ocr_structured_json") or {}, indent=2)
        few_shot_text = json.dumps(state.get("few_shot_cases") or [], indent=2)
        prompt = GATEKEEPER_PROMPT.format(
            few_shot_cases=few_shot_text,
            ocr_structured_json=ocr_text
        )

        try:
            model = GenerativeModel(
                "gemini-3-flash-preview",
                system_instruction="You are a strict eligibility gatekeeper. Return only valid JSON."
            )
            config = GenerationConfig(temperature=0.2, max_output_tokens=2048)
            stream = await model.generate_content_async(prompt, generation_config=config, stream=True)

            full_text = ""
            async for chunk in stream:
                token = getattr(chunk, "text", "") or ""
                if token:
                    full_text += token
                    yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"

            result_json = {}
            match = re.search(r'\{.*\}', full_text, re.DOTALL)
            if match:
                try:
                    result_json = json.loads(match.group())
                except Exception:
                    result_json = {"result": "MANUAL_REVIEW", "flags": [], "reasoning": full_text[:500], "confidence": 0.5}
            else:
                result_json = {"result": state.get("eligibility_result") or "MANUAL_REVIEW",
                               "flags": state.get("eligibility_flags", []),
                               "reasoning": state.get("eligibility_reasoning", ""),
                               "confidence": state.get("eligibility_confidence", 0.5)}

            applications[application_id] = {
                **applications[application_id],
                "eligibility_result": result_json.get("result", "MANUAL_REVIEW"),
                "eligibility_reasoning": result_json.get("reasoning", ""),
                "eligibility_flags": result_json.get("flags", []),
                "eligibility_confidence": result_json.get("confidence", 0.5),
            }
            yield f"data: {json.dumps({'token': '', 'done': True, 'result': result_json})}\n\n"

        except Exception as e:
            logger.error(f"Streaming failed for {application_id}: {e}")
            fallback_result = state.get("eligibility_result") or "MANUAL_REVIEW"
            yield f"data: {json.dumps({'token': f'Result: {fallback_result}', 'done': True, 'result': {'result': fallback_result, 'flags': state.get('eligibility_flags', []), 'reasoning': str(e), 'confidence': 0.5}})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@app.get("/api/apply/{application_id}/status", response_model=StatusResponse)
async def get_status(application_id: str):
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    state = applications[application_id]
    return StatusResponse(
        application_id=application_id,
        status=state.get("status", ""),
        eligibility_result=state.get("eligibility_result"),
        eligibility_reasoning=state.get("eligibility_reasoning", ""),
        eligibility_flags=state.get("eligibility_flags", []),
        eligibility_confidence=state.get("eligibility_confidence"),
        programme_recommended=state.get("programme_applied"),
        startup_name=state.get("startup_name"),
        sector=state.get("sector"),
    )


# ── Interview ──────────────────────────────────────────────────────────────────

@app.post("/api/interview/{application_id}/generate")
async def generate_interview(application_id: str):
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    from graph.nodes.interview_agent import interview_agent
    updated = await interview_agent(applications[application_id])
    applications[application_id] = updated
    return {
        "application_id": application_id,
        "questions": updated.get("interview_questions", []),
        "count": len(updated.get("interview_questions", []))
    }


@app.post("/api/interview/{application_id}/submit")
async def submit_interview(application_id: str, request: InterviewSubmitRequest):
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    updated = {
        **applications[application_id],
        "interview_questions": request.questions,
        "interview_answers": request.answers,
        "status": ApplicationStatus.INTERVIEW_COMPLETE
    }
    applications[application_id] = updated
    asyncio.create_task(_run_judging(application_id, updated))
    return {"application_id": application_id, "status": "interview_submitted", "message": "Judging in progress"}


async def _run_judging(application_id: str, state: GraphState):
    try:
        updated = await judging_consolidator(state)
        applications[application_id] = updated
        logger.info(f"Judging complete for {application_id}")
    except Exception as e:
        logger.error(f"Judging failed for {application_id}: {e}")


# ── Judge ──────────────────────────────────────────────────────────────────────

@app.get("/api/judge/queue")
async def get_judge_queue():
    items = [
        JudgeQueueItem(
            application_id=app_id,
            startup_name=s.get("startup_name", "Unknown"),
            sector=s.get("sector", ""),
            stage=s.get("stage", ""),
            programme_applied=s.get("programme_applied", ""),
            submitted_at=s.get("submitted_at", ""),
            eligibility_result=s.get("eligibility_result"),
            status=s.get("status", "")
        )
        for app_id, s in applications.items()
    ]
    items.sort(key=lambda x: x.submitted_at, reverse=True)
    return {"applications": [item.model_dump() for item in items]}


@app.get("/api/judge/{application_id}")
async def get_judge_detail(application_id: str):
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    state = applications[application_id]
    questions = state.get("interview_questions", [])
    answers = state.get("interview_answers", [])
    return JudgeDetailResponse(
        application_id=application_id,
        startup_name=state.get("startup_name", ""),
        sector=state.get("sector", ""),
        stage=state.get("stage", ""),
        programme_applied=state.get("programme_applied", ""),
        submitted_at=state.get("submitted_at", ""),
        eligibility_result=state.get("eligibility_result"),
        eligibility_reasoning=state.get("eligibility_reasoning", ""),
        eligibility_flags=state.get("eligibility_flags", []),
        eligibility_confidence=state.get("eligibility_confidence"),
        consolidated_analysis=state.get("consolidated_analysis"),
        interview_qa=[
            {"question": q, "answer": answers[i] if i < len(answers) else ""}
            for i, q in enumerate(questions)
        ],
        status=state.get("status", ""),
        judge_verdict=state.get("judge_verdict"),
        matched_mentors=state.get("matched_mentors", [])
    )


@app.post("/api/judge/{application_id}/verdict", response_model=VerdictResponse)
async def submit_verdict(application_id: str, request: VerdictRequest):
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    updated = {
        **applications[application_id],
        "judge_verdict": request.verdict,
        "judge_override_reason": request.override_reason,
    }
    after_alignment = await alignment_node(updated)
    after_linkage = await linkage_node(after_alignment)
    applications[application_id] = after_linkage
    score = after_linkage.get("alignment_score", 0)
    return VerdictResponse(
        application_id=application_id,
        verdict=request.verdict,
        alignment_score=score,
        matched_mentors=after_linkage.get("matched_mentors", []),
        programme_enrolled=after_linkage.get("programme_applied"),
        message="AI Matched ✓" if score >= 0 else "Human Override ✓"
    )


# ── Graph ──────────────────────────────────────────────────────────────────────

@app.get("/api/graph/ecosystem", response_model=GraphResponse)
async def get_ecosystem_graph():
    try:
        async with Neo4jClient.session() as session:
            nodes_result = await session.run(
                """
                MATCH (n)
                WHERE n:Startup OR n:Mentor OR n:Programme OR n:Geography
                RETURN labels(n)[0] AS label, properties(n) AS props
                LIMIT 200
                """
            )
            node_records = await nodes_result.data()

            edges_result = await session.run(
                """
                MATCH (a)-[r]->(b)
                WHERE (a:Startup OR a:Mentor OR a:Programme OR a:Geography)
                  AND (b:Startup OR b:Mentor OR b:Programme OR b:Geography)
                RETURN
                  coalesce(a.id, a.name) AS src,
                  coalesce(b.id, b.name) AS tgt,
                  type(r) AS rel_type,
                  properties(r) AS rel_props
                LIMIT 500
                """
            )
            edge_records = await edges_result.data()

        nodes = []
        for i, rec in enumerate(node_records):
            props = rec["props"]
            node_id = props.get("id") or props.get("name") or f"node_{i}"
            nodes.append({
                "id": node_id,
                "label": rec["label"],
                "name": props.get("name", node_id),
                "properties": {k: (str(v) if not isinstance(v, (str, int, float, bool, type(None))) else v) for k, v in props.items()}
            })

        links = [
            {"source": r["src"], "target": r["tgt"], "type": r["rel_type"], "properties": r.get("rel_props", {})}
            for r in edge_records if r.get("src") and r.get("tgt")
        ]

        return GraphResponse(nodes=nodes, links=links)

    except Exception as e:
        logger.error(f"Graph fetch failed: {e}")
        raise HTTPException(status_code=503, detail={"error": "database_unavailable", "message": str(e)})


@app.get("/api/graph/startup/{startup_id}")
async def get_startup_neighbourhood(startup_id: str):
    try:
        async with Neo4jClient.session() as session:
            result = await session.run(
                """
                MATCH (s:Startup {id: $id})-[r]-(n)
                RETURN s, type(r) AS rel, properties(n) AS neighbour, labels(n)[0] AS label
                LIMIT 50
                """,
                id=startup_id
            )
            records = await result.data()
        return {"startup_id": startup_id, "neighbours": records}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "database_unavailable"})


# ── Milestone ──────────────────────────────────────────────────────────────────

@app.post("/api/milestone/{application_id}/upload", response_model=MilestoneStatusResponse)
async def upload_milestone(application_id: str, request: MilestoneUploadRequest):
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    result = await verify_milestone_video(
        video_base64=request.video_base64,
        roadmap_description=request.milestone_description,
        milestone_name=request.milestone_name
    )
    applications[application_id] = {**applications[application_id], "milestone_verification": result}
    return MilestoneStatusResponse(**result)


@app.get("/api/milestone/{application_id}/status", response_model=MilestoneStatusResponse)
async def get_milestone_status(application_id: str):
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    mv = applications[application_id].get("milestone_verification")
    if not mv:
        raise HTTPException(status_code=404, detail="No milestone verification found")
    return MilestoneStatusResponse(**mv)
