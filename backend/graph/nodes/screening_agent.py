import json
import logging
import re
from graph.state import GraphState, ApplicationStatus
from services.vertex_ai import call_gemini_flash
from prompts.gatekeeper import GATEKEEPER_PROMPT

logger = logging.getLogger(__name__)


def _repair_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        for part in text.split("```"):
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            try:
                return json.loads(part)
            except Exception:
                continue
    try:
        return json.loads(text)
    except Exception:
        pass
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    return {
        "result": "MANUAL_REVIEW",
        "programme_recommended": None,
        "flags": ["JSON_PARSE_ERROR"],
        "reasoning": text[:500],
        "confidence": 0.5
    }


async def screening_agent(state: GraphState) -> GraphState:
    few_shot_text = json.dumps(state.get("few_shot_cases", []), indent=2)
    ocr_text = json.dumps(state.get("ocr_structured_json", {}), indent=2)

    prompt = GATEKEEPER_PROMPT.format(
        few_shot_cases=few_shot_text,
        ocr_structured_json=ocr_text
    )

    try:
        response_text = await call_gemini_flash(
            prompt=prompt,
            system_prompt="You are a strict eligibility gatekeeper. Return only valid JSON."
        )

        result = _repair_json(response_text)
        eligibility_result = result.get("result", "MANUAL_REVIEW")

        if eligibility_result == "FAIL":
            new_status = ApplicationStatus.REJECTED
        else:
            new_status = ApplicationStatus.ELIGIBLE

        return {
            **state,
            "eligibility_result": eligibility_result,
            "eligibility_reasoning": result.get("reasoning", ""),
            "eligibility_flags": result.get("flags", []),
            "eligibility_confidence": result.get("confidence", 0.5),
            "programme_applied": result.get("programme_recommended") or state.get("programme_applied", ""),
            "status": new_status
        }

    except Exception as e:
        logger.error(f"Screening agent failed: {e}")
        return {
            **state,
            "eligibility_result": "MANUAL_REVIEW",
            "eligibility_reasoning": f"Screening error: {str(e)}",
            "eligibility_flags": ["SCREENING_ERROR"],
            "eligibility_confidence": 0.0,
            "status": ApplicationStatus.ELIGIBLE
        }


def route_after_screening(state: GraphState) -> str:
    return "rejection_node" if state.get("eligibility_result") == "FAIL" else "interview_agent"


async def rejection_node(state: GraphState) -> GraphState:
    return {
        **state,
        "status": ApplicationStatus.REJECTED,
        "error_message": "Application did not meet CIP Spark/Sprint eligibility criteria."
    }
