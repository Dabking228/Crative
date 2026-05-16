import asyncio
import json
import logging
import re
from typing import Dict, Any
from graph.state import GraphState, ApplicationStatus
from services.vertex_ai import call_gemini_flash, call_claude, call_grok
from prompts.judge import JUDGE_PROMPT

logger = logging.getLogger(__name__)

DIMENSIONS = [
    "strengths", "weaknesses", "market_value",
    "problem_statement", "business_model", "target_users", "judging_criteria"
]


def _parse_model_output(text: str, model_name: str) -> Dict[str, Any]:
    try:
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
            return json.loads(match.group())
    except Exception as e:
        logger.error(f"JSON parse failed for {model_name}: {e}")
    return _error_result(model_name, "JSON parse failed")


def _handle_model_result(result: Any, model_name: str) -> Dict[str, Any]:
    if isinstance(result, Exception):
        logger.error(f"{model_name} failed: {result}")
        return _error_result(model_name, str(result)[:200])
    return _parse_model_output(result, model_name)


def _error_result(model_name: str, reason: str) -> Dict[str, Any]:
    return {
        "model": model_name,
        "error": True,
        "dimensions": {
            d: {"score": None, "reasoning": reason, "red_flags": []}
            for d in DIMENSIONS
        },
        "overall_recommendation": "UNAVAILABLE",
        "recommendation_reasoning": reason
    }


def compute_consolidated(gemini: Dict, claude: Dict, grok: Dict) -> Dict[str, Any]:
    result: Dict[str, Any] = {"dimensions": {}, "model_recommendations": {}}

    for dim in DIMENSIONS:
        scores = []
        for model_name, analysis in [("gemini", gemini), ("claude", claude), ("grok", grok)]:
            score = (analysis.get("dimensions") or {}).get(dim, {}).get("score")
            scores.append(score if not analysis.get("error") else None)

        valid = [s for s in scores if s is not None]
        variance = (max(valid) - min(valid)) if len(valid) > 1 else 0

        result["dimensions"][dim] = {
            "gemini": (gemini.get("dimensions") or {}).get(dim, {"score": None, "reasoning": "Unavailable", "red_flags": []}),
            "claude": (claude.get("dimensions") or {}).get(dim, {"score": None, "reasoning": "Unavailable", "red_flags": []}),
            "grok": (grok.get("dimensions") or {}).get(dim, {"score": None, "reasoning": "Unavailable", "red_flags": []}),
            "score_variance": variance,
            "mean_score": sum(valid) / len(valid) if valid else None,
            "high_variance": variance > 2,
        }

    for model_name, analysis in [("gemini", gemini), ("claude", claude), ("grok", grok)]:
        result["model_recommendations"][model_name] = {
            "recommendation": analysis.get("overall_recommendation", "UNAVAILABLE"),
            "reasoning": analysis.get("recommendation_reasoning", "Model unavailable"),
            "error": analysis.get("error", False)
        }

    recs = [
        v["recommendation"] for v in result["model_recommendations"].values()
        if not v["error"] and v["recommendation"] not in ("UNAVAILABLE", None)
    ]
    result["majority_ai_recommendation"] = max(set(recs), key=recs.count) if recs else "UNAVAILABLE"
    return result


def _build_shared_context(state: GraphState) -> str:
    ocr = state.get("ocr_structured_json") or {}
    return json.dumps({
        "startup_name": state.get("startup_name"),
        "sector": state.get("sector"),
        "stage": state.get("stage"),
        "programme_applied": state.get("programme_applied"),
        "business_description": state.get("business_description") or ocr.get("business_description"),
        "incorporation_date": state.get("incorporation_date") or ocr.get("incorporation_date"),
        "total_malaysian_ownership_pct": state.get("total_malaysian_ownership_pct") or ocr.get("total_malaysian_ownership_pct"),
        "eligibility_result": state.get("eligibility_result"),
        "eligibility_flags": state.get("eligibility_flags", []),
        "directors": ocr.get("directors", [])
    }, indent=2)


def _build_interview_qa(state: GraphState) -> str:
    questions = state.get("interview_questions", [])
    answers = state.get("interview_answers", [])
    if not questions:
        return "No interview conducted yet."
    pairs = []
    for i, q in enumerate(questions):
        a = answers[i] if i < len(answers) else "No answer provided"
        pairs.append(f"Q{i+1}: {q}\nA{i+1}: {a}")
    return "\n\n".join(pairs)


async def _call_gemini_judge(shared_context: str, interview_qa: str) -> str:
    prompt = JUDGE_PROMPT.format(
        shared_context=shared_context,
        interview_qa=interview_qa,
        model_name="Gemini 3 Flash Preview"
    )
    return await call_gemini_flash(
        prompt=prompt,
        system_prompt="You are an expert investment analyst. Return only valid JSON."
    )


async def _call_claude_judge(shared_context: str, interview_qa: str) -> str:
    prompt = JUDGE_PROMPT.format(
        shared_context=shared_context,
        interview_qa=interview_qa,
        model_name="Claude Sonnet 4.6"
    )
    return await call_claude(
        messages=[
            {"content": shared_context},
            {"content": f"Interview Q&A:\n{interview_qa}\n\nPerform your analysis now."}
        ],
        system_prompt="You are an expert investment analyst for Cradle Fund Malaysia. Return only valid JSON as specified.",
        use_cache=True
    )


async def _call_grok_judge(shared_context: str, interview_qa: str) -> str:
    prompt = JUDGE_PROMPT.format(
        shared_context=shared_context,
        interview_qa=interview_qa,
        model_name="Grok 4.20 reasoning"
    )
    return await call_grok(
        messages=[{"role": "user", "content": prompt}],
        system_prompt="You are an expert investment analyst. Return only valid JSON."
    )


async def judging_consolidator(state: GraphState) -> GraphState:
    shared_context = _build_shared_context(state)
    interview_qa = _build_interview_qa(state)

    gemini_raw, claude_raw, grok_raw = await asyncio.gather(
        _call_gemini_judge(shared_context, interview_qa),
        _call_claude_judge(shared_context, interview_qa),
        _call_grok_judge(shared_context, interview_qa),
        return_exceptions=True
    )

    gemini_result = _handle_model_result(gemini_raw, "gemini")
    claude_result = _handle_model_result(claude_raw, "claude")
    grok_result = _handle_model_result(grok_raw, "grok")

    consolidated = compute_consolidated(gemini_result, claude_result, grok_result)

    return {
        **state,
        "gemini_analysis": gemini_result,
        "claude_analysis": claude_result,
        "grok_analysis": grok_result,
        "consolidated_analysis": consolidated,
        "status": ApplicationStatus.AWAITING_VERDICT
    }
