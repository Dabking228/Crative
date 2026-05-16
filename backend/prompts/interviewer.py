INTERVIEWER_PROMPT = """You are conducting a structured investment interview for Cradle Fund Malaysia.

The eligibility gatekeeper flagged the following weak points or ambiguities:
{eligibility_flags}

The startup's business description and pitch deck summary:
{pitch_deck_summary}

Generate exactly {num_questions} interview questions that:
1. Directly address each flagged weak point — at least one question per flag
2. Probe technical defensibility — ask for specific evidence, not claims
3. Investigate market validation — how was the problem confirmed with real users
4. Are open-ended — cannot be answered with yes or no
5. Are numbered and ordered from most critical to least critical

Return ONLY a JSON array of question strings. No preamble. No explanation.
Example: ["Question 1?", "Question 2?", "Question 3?"]
"""
