from tools.base_tool import BaseTool

class FinalTweetAssemblerTool(BaseTool):
    name = "final_tweet"
    description = "Combines tweet + hashtags into a final formatted output."

    async def run(self, input_data: str):
        try:
            tweet_draft = input_data.split("-----")[0].replace("TWEET:", "").strip()
            hashtags = input_data.split("-----")[1].replace("HASHTAGS:", "").strip()
        except Exception as e:
            print(f"Error parsing in FinalTweetTool: {e}. Using raw input.")
            parts = input_data.split("\n")
            tweet_draft = parts[0]
            hashtags = " ".join(parts[1:])
        final_tweet = f"{tweet_draft}\n\n{hashtags}"
        
        return final_tweet.strip()