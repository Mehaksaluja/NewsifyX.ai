import feedparser
import asyncio
from tools.base_tool import BaseTool

class NewsScraperTool(BaseTool):
    name = "news_scraper"
    description = "Fetches top 5 current news (title + summary) from Google News RSS."
    RSS_URL = "https://news.google.com/rss?hl=en-US&gl=US&ceid=IN:en"

    async def run(self, input_text: str = ""):
        print("Fetching news (with summaries) from Google News RSS...")
        try:
            loop = asyncio.get_event_loop()
            feed = await loop.run_in_executor(None, feedparser.parse, self.RSS_URL)
            
            news_items = []
            for entry in feed.entries[:5]:
                title = entry.title
                if " - " in title:
                    title = title.split(" - ")[0].strip()
            
                summary = entry.get("summary", "No summary available.")
                summary = self.clean_html(summary)
                
                news_items.append(f"TITLE: {title}\nSUMMARY: {summary}")

            if not news_items:
                return "No news items found."
                
            print(f"Found {len(news_items)} items (with summaries).")
            
            return "\n-----\n".join(news_items)
            
        except Exception as e:
            print(f"Error fetching RSS feed: {e}")
            return f"Error: Could not fetch news. {e}"

    def clean_html(self, raw_html):
        import re
        clean_text = re.sub('<[^<]+?>', '', raw_html)
        clean_text = clean_text.replace("&nbsp;", " ").replace("&quot;", "'")
        clean_text = re.sub(r'<ol>.*?</ol>', '', clean_text, flags=re.DOTALL)
        clean_text = re.sub(r'<li>.*?</li>', '', clean_text, flags=re.DOTALL)
        return clean_text.strip()