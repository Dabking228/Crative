import logging
from langgraph.graph import StateGraph, END
from graph.state import GraphState
from graph.nodes.ocr_node import ocr_node
from graph.nodes.few_shot_retrieval import few_shot_retrieval
from graph.nodes.screening_agent import screening_agent, route_after_screening, rejection_node
from graph.nodes.interview_agent import interview_agent
from graph.nodes.judging_consolidator import judging_consolidator
from graph.nodes.alignment_node import alignment_node
from graph.nodes.linkage_node import linkage_node

logger = logging.getLogger(__name__)


def create_workflow() -> StateGraph:
    workflow = StateGraph(GraphState)

    workflow.add_node("ocr_node", ocr_node)
    workflow.add_node("few_shot_retrieval", few_shot_retrieval)
    workflow.add_node("screening_agent", screening_agent)
    workflow.add_node("rejection_node", rejection_node)
    workflow.add_node("interview_agent", interview_agent)
    workflow.add_node("judging_consolidator", judging_consolidator)
    workflow.add_node("alignment_node", alignment_node)
    workflow.add_node("linkage_node", linkage_node)

    workflow.set_entry_point("ocr_node")
    workflow.add_edge("ocr_node", "few_shot_retrieval")
    workflow.add_edge("few_shot_retrieval", "screening_agent")

    workflow.add_conditional_edges(
        "screening_agent",
        route_after_screening,
        {
            "rejection_node": "rejection_node",
            "interview_agent": "interview_agent"
        }
    )

    workflow.add_edge("rejection_node", END)
    # interview_agent stops here — judging triggered by /api/interview/{id}/submit
    workflow.add_edge("interview_agent", END)
    # judging_consolidator stops here — verdict submitted via /api/judge/{id}/verdict
    workflow.add_edge("judging_consolidator", END)
    workflow.add_edge("alignment_node", "linkage_node")
    workflow.add_edge("linkage_node", END)

    return workflow.compile()


app_workflow = create_workflow()
