import json
from core.model_adapter import GroqModelAdapter

class PlannerAgent:
    def __init__(self):
        self.model = GroqModelAdapter("llama-3.3-70b-versatile")

    async def plan(self, user_query: str):
        prompt = f"""
You are a planning agent for an autonomous AI news-tweeting system.
Your job is to create a JSON plan to satisfy the user's request.

TOOLS AVAILABLE:
1. "news_scraper" -> Fetches latest news (titles + summaries). Input is ignored.
2. "headline_selector" -> Selects the best news item (title + summary) from a list. Input should be "output from previous step".
3. "tweetbot" -> Writes a tweet draft from a news item. Input is the selected item from previous step.
4. "hashtags" -> Generates hashtags for a tweet. Input is the structured data (TOPIC/TWEET) from previous step.
5. "final_tweet" -> Assembles the final tweet text. Input is the structured data (TWEET/HASHTAGS) from previous step.
6. "twitter_poster" -> Posts the final tweet to X. Input is the final tweet text from previous step.

RULES:
- The plan MUST be a sequence of steps.
- ALWAYS include an "input" for each step.
- The user's request will be simple, like "post the news".
- The plan MUST start with "news_scraper".
- The plan MUST end with "twitter_poster".
- Output ONLY the JSON plan.

Example plan for "post the news":
{{
  "steps": [
    {{"tool": "news_scraper", "input": "get latest news"}},
    {{"tool": "headline_selector", "input": "output from previous step"}},
    {{"tool": "tweetbot", "input": "output from previous step"}},
    {{"tool": "hashtags", "input": "output from previous step"}},
    {{"tool": "final_tweet", "input": "output from previous step"}},
    {{"tool": "twitter_poster", "input": "output from previous step"}}
  ]
}}

User request:
\"\"\"{user_query}\"\"\"
"""

        raw = await self.model.generate(prompt)

        print("\nRAW OUTPUT FROM LLM (PLANNER):\n", raw, "\n")

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            try:
                json_text = self._extract_json(raw)
                return json.loads(json_text)
            except Exception as e:
                print(f"Failed to parse plan: {e}")
                return {"error": "Failed to create a valid plan."}

    def _extract_json(self, text):
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.rfind("```")
            text = text[start:end]
        else:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start == -1 or end == -1:
                raise ValueError("No JSON object found in LLM output.")
            text = text[start:end]
            
        return text.strip()