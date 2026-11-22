from tools.base_tool import BaseTool
from core.model_adapter import OpenAIModelAdapter

class HashtagGeneratorTool(BaseTool):
    name = "hashtags"
    description = "Generates clean, trending hashtags."

    def __init__(self):
        self.model = OpenAIModelAdapter()

    async def run(self, input_data: str):
        
        try:
            parts = input_data.split("-----")
            context_part = parts[0]
            tweet_draft = parts[1].replace("TWEET:", "").strip()
            
            topic = context_part.split("SUMMARY:")[0].replace("TOPIC:", "").strip()
            summary = context_part.split("SUMMARY:")[1].strip()
            
        except Exception as e:
            print(f"Error parsing in HashtagTool: {e}. Using raw input.")
            topic = "Could not parse topic"
            summary = "Could not parse summary"
            tweet_draft = input_data

        print(f"[Debug] HashtagTool context topic: {topic}")
        print(f"[Debug] HashtagTool context summary: {summary}")
        print(f"[Debug] HashtagTool context tweet: {tweet_draft}")

        prompt = f"""
You are a social media hashtag expert. Generate 3-4 highly relevant, professional hashtags for a news tweet.

Topic: "{topic}"
Summary: "{summary}"
Tweet Draft: "{tweet_draft}"

INSTRUCTIONS:
1. Generate exactly 3-4 hashtags that are directly relevant to the news topic.
2. Use common, widely-recognized hashtags that people actually search for (e.g., #BreakingNews, #WorldNews, #Technology, #Business).
3. Avoid overly generic hashtags like #News or #Update unless they're truly appropriate.
4. Use proper capitalization (PascalCase) for multi-word hashtags (e.g., #BreakingNews, #USPolitics).
5. Keep hashtags concise - no more than 2-3 words per hashtag.
6. Output ONLY the hashtags separated by spaces, nothing else.
7. Do not include any explanation, prefix, or additional text.

Example format: #BreakingNews #WorldNews #Technology

Generate the hashtags now:
"""
        
        hashtags = await self.model.generate(prompt)
    
        clean_hashtags = hashtags.strip().strip('\"').strip("\'").strip('`')

        output = f"TWEET: {tweet_draft}\n-----\nHASHTAGS: {clean_hashtags}"
        
        print(f"[Debug] HashtagTool output:\n{output}")
        return output