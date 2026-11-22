from tools.base_tool import BaseTool
from core.model_adapter import OpenAIModelAdapter

class TweetWriterTool(BaseTool):
    name = "tweetbot"
    description = "Writes an engaging tweet from a title and summary."

    def __init__(self):
        self.model = OpenAIModelAdapter()

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
You are a professional news journalist creating a social media post. Your task is to write a clear, informative, and engaging tweet based on the provided news story.

News Title:
"{title}"

News Summary:
"{summary}"

INSTRUCTIONS:
1. Write a concise, informative tweet (2-3 sentences, maximum 200 characters for the main text).
2. Use the summary to understand the complete story and write a full, complete thought. Never end with "..." or incomplete sentences.
3. Write in a natural, conversational tone - like a professional journalist sharing breaking news.
4. Be factual and accurate. Do not exaggerate or add information not present in the summary.
5. Use proper grammar, capitalization, and punctuation. Avoid excessive exclamation marks or all caps.
6. Add 1-2 relevant emojis that match the topic naturally.
7. CRITICAL: Do NOT include any hashtags in your response. Hashtags will be added separately.
8. Avoid spam-like patterns: no excessive punctuation (!!!), no all caps, no clickbait language.
9. Make it sound human and professional, not automated or promotional.

Write only the tweet text, nothing else:
"""
        
        tweet_text = await self.model.generate(prompt)

        words = tweet_text.split()
        clean_words = [word for word in words if not word.startswith('#')]
        clean_tweet = " ".join(clean_words).strip().strip('\"').strip("\'").strip('`')

        output = f"TOPIC: {title}\nSUMMARY: {summary}\n-----\nTWEET: {clean_tweet}"
        
        print(f"[Debug] TweetWriter output:\n{output}")
        return output