import json
import logging
import re
from services.vertex_ai import call_gemini_flash

logger = logging.getLogger(__name__)

VISION_SYSTEM = "You are reviewing a startup video demo against a roadmap milestone. Produce a structured JSON verification checklist."

VISION_PROMPT = """MILESTONE: {milestone_name}
ROADMAP DESCRIPTION: {roadmap_description}

Carefully review the video content and verify each claim from the roadmap description.

Return ONLY a JSON object (no other text):
{{
  "checklist": [
    {{"criterion": "Feature or claim from roadmap", "verified": true, "evidence": "What you saw in the video"}}
  ],
  "confidence": 0.85,
  "manual_review_required": false
}}

Rules:
- Do not mark verified=true if you cannot clearly see the feature working
- Do not mark verified=false merely because the video didn't show it — use verified=false with evidence="Not demonstrated in video"
- Set manual_review_required=true if video quality is too poor to judge
- Generate at least 3 checklist items derived from the roadmap description
"""


async def verify_milestone_video(
    video_base64: str,
    roadmap_description: str,
    milestone_name: str,
    threshold: int = 3
) -> dict:
    prompt = VISION_PROMPT.format(
        milestone_name=milestone_name,
        roadmap_description=roadmap_description
    )

    try:
        response_text = await call_gemini_flash(
            prompt=prompt,
            system_prompt=VISION_SYSTEM,
            thinking_level="medium"
        )

        result = _parse_result(response_text)
        checklist = result.get("checklist", [])
        verified_count = sum(1 for item in checklist if item.get("verified"))
        total_count = len(checklist)

        return {
            "milestone_name": milestone_name,
            "checklist": checklist,
            "verified_count": verified_count,
            "total_count": total_count,
            "threshold": threshold,
            "milestone_passed": verified_count >= threshold,
            "confidence": result.get("confidence", 0.7),
            "manual_review_required": result.get("manual_review_required", False) or total_count == 0
        }

    except Exception as e:
        logger.error(f"Vision verification failed: {e}")
        fallback = [
            {"criterion": "Core feature demonstrated", "verified": False, "evidence": "Verification error — manual review required"},
            {"criterion": "User interface shown", "verified": False, "evidence": "Verification error — manual review required"},
            {"criterion": "Key functionality working end-to-end", "verified": False, "evidence": "Verification error — manual review required"}
        ]
        return {
            "milestone_name": milestone_name,
            "checklist": fallback,
            "verified_count": 0,
            "total_count": 3,
            "threshold": threshold,
            "milestone_passed": False,
            "confidence": 0.0,
            "manual_review_required": True
        }


def _parse_result(text: str) -> dict:
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
    return {}
