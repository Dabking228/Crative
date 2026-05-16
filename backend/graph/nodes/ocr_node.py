import json
import logging
from graph.state import GraphState, ApplicationStatus
from services.vertex_ai import call_mistral_ocr, call_gemini_flash

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are extracting structured data from an SSM registration document OCR output.

OCR Markdown:
{ocr_markdown}

Extract ALL of the following fields into a JSON object. If a field cannot be found, set it to null.
Do not guess values. Return ONLY the JSON object, no other text.

{{
  "company_name": null,
  "registration_no": null,
  "incorporation_date": null,
  "directors": [],
  "total_malaysian_ownership_pct": null,
  "paid_up_capital": null,
  "address": null,
  "business_description": null
}}
"""


async def ocr_node(state: GraphState) -> GraphState:
    try:
        ssm_b64 = state.get("ssm_document_base64", "")

        if ssm_b64 and len(ssm_b64) > 100:
            ocr_result = await call_mistral_ocr(ssm_b64)
            ocr_markdown = (
                ocr_result.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )
            if not ocr_markdown:
                ocr_markdown = str(ocr_result)
        else:
            ocr_markdown = f"""
# SSM Registration Certificate — Demo
Company Name: {state.get('startup_name', 'Unknown')}
Registration No: {state.get('registration_no', 'N/A')}
Incorporation Date: {state.get('incorporation_date', 'N/A')}
Malaysian Ownership: {state.get('total_malaysian_ownership_pct', 100)}%
Business: {state.get('business_description', 'N/A')}
Director 1: Ahmad Razif bin Abdullah | IC: 850312-14-5678 | Malaysian | 60% | Resident
Director 2: James Tan Wei Ming | IC: 880901-10-1234 | Malaysian | 40% | Resident
"""

        extraction_prompt = EXTRACTION_PROMPT.format(ocr_markdown=ocr_markdown)
        extracted_text = await call_gemini_flash(
            prompt=extraction_prompt,
            system_prompt="You are a precise data extraction assistant. Return only valid JSON."
        )

        structured_json = _parse_extracted(extracted_text)

        # Merge form-submitted values (they override OCR if present)
        for field, key in [
            ("total_malaysian_ownership_pct", "total_malaysian_ownership_pct"),
            ("incorporation_date", "incorporation_date"),
            ("business_description", "business_description"),
            ("registration_no", "registration_no"),
        ]:
            if state.get(field):
                structured_json[key] = state[field]

        missing = [
            k for k in ["company_name", "registration_no", "incorporation_date", "total_malaysian_ownership_pct"]
            if not structured_json.get(k)
        ]
        structured_json["missing_fields"] = missing

        return {
            **state,
            "ocr_markdown": ocr_markdown,
            "ocr_structured_json": structured_json,
            "status": ApplicationStatus.OCR_COMPLETE
        }

    except Exception as e:
        logger.error(f"OCR node failed: {e}")
        fallback = {
            "company_name": state.get("startup_name"),
            "registration_no": state.get("registration_no", "N/A"),
            "incorporation_date": state.get("incorporation_date", "N/A"),
            "total_malaysian_ownership_pct": state.get("total_malaysian_ownership_pct", 100),
            "business_description": state.get("business_description", ""),
            "directors": [],
            "missing_fields": ["OCR_INCOMPLETE"],
        }
        return {
            **state,
            "ocr_structured_json": fallback,
            "ocr_markdown": "",
            "status": ApplicationStatus.OCR_COMPLETE
        }


def _parse_extracted(text: str) -> dict:
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
        import re
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
    return {"_parse_error": True}
