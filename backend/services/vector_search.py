import logging
from typing import List

logger = logging.getLogger(__name__)


async def find_similar_mentors(sector: str, top_k: int = 3) -> List[str]:
    """Sector-based mentor matching for demo. Production would use vector similarity."""
    sector_lower = sector.lower()
    sector_map: dict = {
        "fintech": ["M001", "M005"],
        "healthtech": ["M002", "M003"],
        "agritech": ["M004", "M003"],
        "ai/ml": ["M003", "M002"],
        "e-commerce": ["M004", "M005"],
        "saas": ["M005", "M004"],
        "edtech": ["M005", "M003"],
    }
    ids = sector_map.get(sector_lower, ["M003", "M004", "M005"])
    return ids[:top_k]
