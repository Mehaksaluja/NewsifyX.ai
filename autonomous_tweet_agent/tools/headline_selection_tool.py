from tools.base_tool import BaseTool
from core.model_adapter import OpenAIModelAdapter

class HeadlineSelectionTool(BaseTool):
    name = "headline_selector"
    description = "Selects the single most tweet-worthy news item (Title + Summary) from a list."

    def __init__(self):
        self.model = OpenAIModelAdapter()

    async def run(self, news_data: str):
        
        if not news_data.strip() or "Error:" in news_data:
            return "Error: No news data provided to select from."

        prompt = f"""
You are an AI news editor. Here are 5 trending news items.
Pick the *single* most interesting one.

News Items:
\"\"\"
{news_data}
\"\"\"

RULES:
- Respond with ONLY the full, complete block for the single best item.
- (e.g., "TITLE: ...\nSUMMARY: ...")
- DO NOT add "BEST ITEM:" or "```" or any explanation.
"""
        print("\nAI Editor is selecting the best item (with summary)...")
        selected_item = await self.model.generate(prompt)
        
        selected_item = selected_item.replace("Best Item:", "").replace("BEST ITEM:", "")
        selected_item = selected_item.strip().strip('\"').strip("\'").strip('`')
            
        print(f"AI Editor selected:\n{selected_item}")
        return selected_item