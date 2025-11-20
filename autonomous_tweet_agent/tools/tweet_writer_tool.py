from tools.base_tool import BaseTool
from core.model_adapter import GroqModelAdapter

class TweetWriterTool(BaseTool):
    name = "tweetbot"
    description = "Writes an engaging tweet from a title and summary."

    def __init__(self):
        self.model = GroqModelAdapter("llama-3.3-70b-versatile")

    async def run(self, item_data: str):
        
        try:
            title = item_data.split("SUMMARY:")[0].replace("TITLE:", "").strip()
            summary = item_data.split("SUMMARY:")[1].strip()
        except Exception:
            title = item_data
            summary = "No summary provided."

        print(f"[Debug] TweetWriter received Title: {title}")
        print(f"[Debug] TweetWriter received Summary: {summary}")

        prompt = f"""
You are an AI News Journalist. Write an engaging tweet (2-3 lines) based on this news item.
Use the Summary to find the *real* story and complete any "..." in the title.

News Title:
"{title}"

News Summary:
"{summary}"

RULES:
- Write 2-3 short, engaging lines.
- Use the Summary to write a *complete* thought. DO NOT end with "...".
- Add 1-2 relevant emojis.
- CRITICAL: Do NOT include any hashtags.

Tweet:
"""
        
        tweet_text = await self.model.generate(prompt)

        words = tweet_text.split()
        clean_words = [word for word in words if not word.startswith('#')]
        clean_tweet = " ".join(clean_words).strip().strip('\"').strip("\'").strip('`')

        output = f"TOPIC: {title}\nSUMMARY: {summary}\n-----\nTWEET: {clean_tweet}"
        
        print(f"[Debug] TweetWriter output:\n{output}")
        return output