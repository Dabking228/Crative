JUDGE_PROMPT = """You are an expert investment analyst reviewing a startup application for Cradle Fund Malaysia.

APPLICATION SUMMARY:
{shared_context}

INTERVIEW Q&A:
{interview_qa}

Analyse this startup across ALL 7 dimensions below. For each dimension provide:
- score: integer 1 to 10
- reasoning: 2 to 3 sentences with specific evidence from the application
- red_flags: list of specific concerns (empty list if none)

DIMENSIONS:
1. strengths          — what the startup genuinely does well
2. weaknesses         — genuine gaps or risks the judge should probe
3. market_value       — TAM, competitive landscape, SEA market fit
4. problem_statement  — clarity and specificity of the problem being solved
5. business_model     — revenue model, pricing logic, unit economics viability
6. target_users       — specificity and reachability of the customer segment
7. judging_criteria   — CIP Spark / Sprint programme investment readiness signals

Return ONLY valid JSON matching this exact schema. No text outside the JSON object:
{{
  "model": "{model_name}",
  "dimensions": {{
    "strengths":          {{"score": 7, "reasoning": "reasoning here", "red_flags": []}},
    "weaknesses":         {{"score": 5, "reasoning": "reasoning here", "red_flags": []}},
    "market_value":       {{"score": 7, "reasoning": "reasoning here", "red_flags": []}},
    "problem_statement":  {{"score": 8, "reasoning": "reasoning here", "red_flags": []}},
    "business_model":     {{"score": 6, "reasoning": "reasoning here", "red_flags": []}},
    "target_users":       {{"score": 7, "reasoning": "reasoning here", "red_flags": []}},
    "judging_criteria":   {{"score": 7, "reasoning": "reasoning here", "red_flags": []}}
  }},
  "overall_recommendation": "APPROVE",
  "recommendation_reasoning": "reasoning for overall recommendation"
}}

Valid values for overall_recommendation: "APPROVE", "DECLINE", "NEEDS_MORE_INFO"
"""
