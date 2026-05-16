import logging
from graph.state import GraphState
from services.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)


async def few_shot_retrieval(state: GraphState) -> GraphState:
    sector = state.get("sector", "")

    try:
        async with Neo4jClient.session() as session:
            result = await session.run(
                """
                MATCH (s:Startup)-[r:REVIEWED_BY]->(v:JudgeVerdict)
                WHERE r.alignment_score = 1
                  AND (s.sector = $sector OR $sector = '')
                RETURN s.name AS name, s.sector AS sector, s.stage AS stage,
                       v.verdict AS verdict, v.reasoning_summary AS reasoning,
                       v.key_eligibility_signals AS signals
                ORDER BY rand()
                LIMIT 5
                """,
                sector=sector
            )
            records = await result.data()

        if not records:
            async with Neo4jClient.session() as session2:
                result2 = await session2.run(
                    """
                    MATCH (s:Startup)-[r:REVIEWED_BY]->(v:JudgeVerdict)
                    WHERE r.alignment_score = 1
                    RETURN s.name AS name, s.sector AS sector, s.stage AS stage,
                           v.verdict AS verdict, v.reasoning_summary AS reasoning,
                           v.key_eligibility_signals AS signals
                    LIMIT 5
                    """
                )
                records = await result2.data()

        few_shot_cases = [
            {
                "startup_name": r["name"],
                "sector": r["sector"],
                "stage": r["stage"],
                "verdict": r["verdict"],
                "reasoning_summary": r["reasoning"],
                "key_eligibility_signals": r["signals"] or []
            }
            for r in records
        ]
        return {**state, "few_shot_cases": few_shot_cases}

    except Exception as e:
        logger.error(f"Few-shot retrieval failed: {e}")
        return {**state, "few_shot_cases": []}
