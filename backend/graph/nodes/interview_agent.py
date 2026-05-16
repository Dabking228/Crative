import json
import logging
from graph.state import GraphState, ApplicationStatus
from services.vertex_ai import call_claude
from prompts.interviewer import INTERVIEWER_PROMPT

logger = logging.getLogger(__name__)


async def interview_agent(state: GraphState) -> GraphState:
    flags = state.get("eligibility_flags", [])
    business_desc = state.get("business_description", "") or (
        (state.get("ocr_structured_json") or {}).get("business_description", "")
    )

    num_questions = max(3, min(len(flags) + 2, 6))
    flags_text = "\n".join(f"- {f}" for f in flags) if flags else "- No major flags; probe for general business validation"

    prompt = INTERVIEWER_PROMPT.format(
        eligibility_flags=flags_text,
        pitch_deck_summary=business_desc or "No pitch deck summary available",
        num_questions=num_questions
    )

    try:
        response_text = await call_claude(
            messages=[{"content": prompt}],
            system_prompt="You are a structured investment interviewer. Return only a JSON array of question strings.",
            use_cache=True
        )

        questions = _parse_questions(response_text)
        if not isinstance(questions, list) or not questions:
            raise ValueError("Empty or invalid question list")

    except Exception as e:
        logger.error(f"Interview agent failed: {e}")
        questions = [
            "What specific problem are you solving, and how did you validate it with real users?",
            "What is your current monthly recurring revenue and how many paying customers do you have?",
            "Who are your two strongest direct competitors in Malaysia, and what is your defensible advantage?",
            "Walk us through your unit economics — what does it cost to acquire and serve one customer?",
            "What is the single metric that best predicts your success, and what is it today?"
        ][:num_questions]

    return {
        **state,
        "interview_questions": questions,
        "status": ApplicationStatus.INTERVIEW_PENDING
    }


def _parse_questions(text: str) -> list:
    text = text.strip()
    if text.startswith("```"):
        for part in text.split("```"):
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            try:
                result = json.loads(part)
                if isinstance(result, list):
                    return result
            except Exception:
                continue
    try:
        result = json.loads(text)
        if isinstance(result, list):
            return result
    except Exception:
        pass
    import re
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group())
            if isinstance(result, list):
                return result
        except Exception:
            pass
    return []
