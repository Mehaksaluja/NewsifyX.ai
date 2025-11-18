from tools.base_tool import BaseTool
from core.model_adapter import OllamaModelAdapter

class HashtagGeneratorTool(BaseTool):
    name = "hashtags"
    description = "Generates clean, trending hashtags."

    def __init__(self):
        self.model = OllamaModelAdapter("qwen2.5:1.5b")

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
You are a hashtag expert. Generate 3-4 highly relevant hashtags.
Use the Topic, Summary, and Tweet Draft for context.

Topic: "{topic}"
Summary: "{summary}"
Tweet Draft: "{tweet_draft}"

RULES:
- Output ONLY 3-4 relevant hashtags.
- Single line only.
- Example: #Politics #Immigration #USNews
"""
        
        hashtags = await self.model.generate(prompt)
    
        clean_hashtags = hashtags.strip().strip('\"').strip("\'").strip('`')

        output = f"TWEET: {tweet_draft}\n-----\nHASHTAGS: {clean_hashtags}"
        
        print(f"[Debug] HashtagTool output:\n{output}")
        return output