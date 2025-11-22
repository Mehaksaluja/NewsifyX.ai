import tweepy
import os
import asyncio
import time
from tools.base_tool import BaseTool
from core.db_handler import log_tweet

class TwitterPosterTool(BaseTool):
    name = "twitter_poster"
    description = "Posts to X using API v2."

    def __init__(self):
        try:
            self.api_key = os.environ.get("X_API_KEY")
            self.api_secret = os.environ.get("X_API_SECRET")
            self.access_token = os.environ.get("X_ACCESS_TOKEN")
            self.access_token_secret = os.environ.get("X_ACCESS_TOKEN_SECRET")

            if not all([self.api_key, self.api_secret, self.access_token, self.access_token_secret]):
                print("Error: Missing Keys")
                self.client = None
                return

            self.client = tweepy.Client(
                consumer_key=self.api_key,
                consumer_secret=self.api_secret,
                access_token=self.access_token,
                access_token_secret=self.access_token_secret
            )
            print("TwitterPosterTool Initialized.")
        
        except Exception as e:
            print(f"Init Error: {e}")
            self.client = None

    async def run(self, tweet_text: str):
        if self.client is None:
            return "Error: Client not initialized."

        if "output from" in tweet_text.lower():
             print("Cleaning garbage input...")
        import datetime
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        final_tweet = f"{tweet_text}\n\n🕒 {timestamp}" 
        
        print(f"\nAttempting to post:\n---\n{final_tweet}\n---", flush=True)
        
        try:
            loop = asyncio.get_event_loop()
            
            response = await loop.run_in_executor(
                None, 
                lambda: self.client.create_tweet(text=final_tweet)
            )
            
            tweet_id = response.data['id']
            success_msg = f"SUCCESS! Posted Tweet ID: {tweet_id}"
            print(success_msg, flush=True)

            try:
                log_tweet("News Update", final_tweet, str(tweet_id))
            except:
                pass

            return success_msg

        except Exception as e:
            print(f"POST ERROR: {e}", flush=True)
            
            # Error ko analyze karo
            if "403" in str(e):
                return "Error 403: Limit Hit or Duplicate. Try again tomorrow."
            
            return f"Error posting tweet: {e}"