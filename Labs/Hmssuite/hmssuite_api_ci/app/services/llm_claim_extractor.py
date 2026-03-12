from __future__ import annotations

import json
import os
import re
from typing import Any

import httpx

from app.schemas import ExtractedClaim


def _default_base_url(provider: str) -> str:
    if provider == "groq":
        return "https://api.groq.com/openai/v1"
    return "https://api.openai.com/v1"


def _parse_json_payload(text: str) -> dict[str, Any] | None:
    text = text.strip()
    if not text:
        return None

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Extract first JSON object from fenced or mixed content.
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def extract_claims_via_llm(input_text: str) -> tuple[list[ExtractedClaim], bool, str | None]:
    enabled = os.getenv("HMS_LLM_EXTRACTOR_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}
    if not enabled:
        return [], False, None

    provider = os.getenv("HMS_LLM_EXTRACTOR_PROVIDER", "openai").strip().lower() or "openai"
    api_key = os.getenv("HMS_LLM_API_KEY", "").strip()
    model = os.getenv("HMS_LLM_MODEL", "").strip()
    base_url = os.getenv("HMS_LLM_BASE_URL", "").strip() or _default_base_url(provider)

    if not api_key or not model or not input_text.strip():
        return [], False, provider

    system_prompt = (
        "You extract clinical claims from patient-facing narrative text. "
        "Return strict JSON object with key 'claims' as array. "
        "Each claim must include: category, entity, polarity, confidence, claim_text. "
        "Polarity must be one of present/absent/uncertain. "
        "Confidence is number in range 0 to 1."
    )

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": (
                    "Extract clinically meaningful claims from this text and output JSON only.\n\n"
                    f"TEXT:\n{input_text}"
                ),
            },
        ],
        "temperature": 0,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(f"{base_url.rstrip('/')}/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            raw = response.json()
    except Exception:
        return [], False, provider

    content = (
        raw.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
    )
    parsed = _parse_json_payload(content)
    if not parsed:
        return [], False, provider

    claims = parsed.get("claims", [])
    if not isinstance(claims, list):
        return [], False, provider

    extracted: list[ExtractedClaim] = []
    for idx, item in enumerate(claims, start=1):
        if not isinstance(item, dict):
            continue

        category = str(item.get("category", "other")).strip().lower() or "other"
        entity = str(item.get("entity", "unknown")).strip().lower() or "unknown"
        polarity = str(item.get("polarity", "present")).strip().lower() or "present"
        if polarity not in {"present", "absent", "uncertain"}:
            polarity = "uncertain"

        try:
            confidence = float(item.get("confidence", 0.5))
        except (TypeError, ValueError):
            confidence = 0.5
        confidence = max(0.0, min(1.0, confidence))

        claim_text = str(item.get("claim_text", "")).strip()
        if not claim_text:
            continue

        extracted.append(
            ExtractedClaim(
                claim_id=f"llm-{idx}",
                source=f"llm:{provider}",
                category=category,
                entity=entity,
                polarity=polarity,
                confidence=confidence,
                claim_text=claim_text,
            )
        )

    return extracted, bool(extracted), provider
