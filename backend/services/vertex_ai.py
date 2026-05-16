import vertexai
import os
import httpx
import logging
import google.auth
import google.auth.transport.requests
from vertexai.generative_models import GenerativeModel, GenerationConfig
from anthropic import AnthropicVertex

logger = logging.getLogger(__name__)


def init_vertex_ai():
    """Call once at FastAPI startup. Uses GOOGLE_APPLICATION_CREDENTIALS or ADC."""
    vertexai.init(
        project=os.environ["GOOGLE_CLOUD_PROJECT"],
        location=os.environ["GOOGLE_CLOUD_REGION"]
    )


async def call_gemini_flash(
    prompt: str,
    system_prompt: str,
    thinking_level: str = "none",
    stream: bool = False
):
    model = GenerativeModel(
        "gemini-3-flash-preview",
        system_instruction=system_prompt
    )
    config_kwargs: dict = {"temperature": 0.2, "max_output_tokens": 4096}
    if thinking_level != "none":
        config_kwargs["thinking_config"] = {"thinking_budget": thinking_level}

    config = GenerationConfig(**config_kwargs)

    if stream:
        return model.generate_content_async(prompt, generation_config=config, stream=True)

    response = await model.generate_content_async(prompt, generation_config=config)
    return response.text


def get_claude_client() -> AnthropicVertex:
    return AnthropicVertex(
        project_id=os.environ["GOOGLE_CLOUD_PROJECT"],
        region=os.environ["GOOGLE_CLOUD_REGION"]
    )


async def call_claude(messages: list[dict], system_prompt: str, use_cache: bool = True) -> str:
    client = get_claude_client()
    user_content: list = []

    if use_cache and messages:
        user_content.append({
            "type": "text",
            "text": messages[0]["content"],
            "cache_control": {"type": "ephemeral"}
        })
        for m in messages[1:]:
            user_content.append({"type": "text", "text": m["content"]})
    else:
        user_content = [{"type": "text", "text": m["content"]} for m in messages]

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": user_content}]
    )
    return response.content[0].text


async def call_grok(messages: list[dict], system_prompt: str) -> str:
    credentials, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    credentials.refresh(google.auth.transport.requests.Request())

    region = os.environ["GOOGLE_CLOUD_REGION"]
    project_id = os.environ["GOOGLE_CLOUD_PROJECT"]
    url = (
        f"https://{region}-aiplatform.googleapis.com/v1/projects/{project_id}"
        f"/locations/{region}/endpoints/openapi/chat/completions"
    )

    payload = {
        "model": "xai/grok-4.20-reasoning",
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "max_tokens": 4096,
        "temperature": 0.2
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {credentials.token}",
                "Content-Type": "application/json"
            }
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def call_mistral_ocr(document_base64: str) -> dict:
    credentials, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    credentials.refresh(google.auth.transport.requests.Request())

    region = os.environ["GOOGLE_CLOUD_REGION"]
    project_id = os.environ["GOOGLE_CLOUD_PROJECT"]
    url = (
        f"https://{region}-aiplatform.googleapis.com/v1/projects/{project_id}"
        f"/locations/{region}/publishers/mistralai/models/mistral-ocr-2505:rawPredict"
    )

    payload = {
        "model": "mistral-ocr-2505",
        "document": {"type": "document_url", "data": document_base64}
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {credentials.token}",
                "Content-Type": "application/json"
            }
        )
        resp.raise_for_status()
        return resp.json()


async def test_vertex_ai_connection() -> bool:
    try:
        model = GenerativeModel("gemini-3-flash-preview")
        response = await model.generate_content_async("Say OK in one word.")
        return bool(response.text)
    except Exception as e:
        logger.error(f"Vertex AI health check failed: {e}")
        return False
