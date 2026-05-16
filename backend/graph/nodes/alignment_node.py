import logging
from graph.state import GraphState

logger = logging.getLogger(__name__)


def compute_alignment_score(judge_verdict: str, majority_ai_recommendation: str) -> int:
    verdict_map = {"APPROVE": "APPROVE", "DECLINE": "DECLINE"}
    ai_map = {"APPROVE": "APPROVE", "DECLINE": "DECLINE", "NEEDS_MORE_INFO": None}

    judge_normalised = verdict_map.get(judge_verdict)
    ai_normalised = ai_map.get(majority_ai_recommendation)

    if ai_normalised is None:
        return 0
    return 1 if judge_normalised == ai_normalised else -1


async def alignment_node(state: GraphState) -> GraphState:
    judge_verdict = state.get("judge_verdict", "")
    consolidated = state.get("consolidated_analysis") or {}
    majority_ai = consolidated.get("majority_ai_recommendation", "UNAVAILABLE")

    score = compute_alignment_score(judge_verdict, majority_ai)
    logger.info(f"Alignment score: {score} (judge={judge_verdict}, ai={majority_ai})")

    return {**state, "alignment_score": score}
