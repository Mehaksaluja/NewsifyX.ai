import tweepy
import os
import asyncio
from tools.base_tool import BaseTool
from core.db_handler import log_tweet

class TwitterPosterTool(BaseTool):
    name = "twitter_poster"
    description = "Posts tweets using Tweepy Client (API v2) - Free Tier Compatible."

    def __init__(self):
        print("\nINITIALIZING TWITTER V2 CLIENT...")
        try:
            self.api_key = os.environ.get("X_API_KEY")
            self.api_secret = os.environ.get("X_API_SECRET")
            self.access_token = os.environ.get("X_ACCESS_TOKEN")
            self.access_token_secret = os.environ.get("X_ACCESS_TOKEN_SECRET")

            if not all([self.api_key, self.api_secret, self.access_token, self.access_token_secret]):
                print("Error: Missing Twitter Keys in .env")
                self.client = None
                return

            self.client = tweepy.Client(
                consumer_key=self.api_key,
                consumer_secret=self.api_secret,
                access_token=self.access_token,
                access_token_secret=self.access_token_secret
            )
            print("Twitter Client (v2) Ready.", flush=True)
        
        except Exception as e:
            print(f"Error initializing Twitter Tool: {e}")
            self.client = None

    async def run(self, tweet_text: str):
        if self.client is None:
            return "Error: Twitter Client not initialized."

        if not tweet_text or len(tweet_text.strip()) == 0:
            return "Error: Empty tweet."

        if "output from" in tweet_text.lower():
             print("Cleaning garbage input...", flush=True)

        print(f"\nAttempting to post:\n---\n{tweet_text}\n---", flush=True)
        
        try:
            loop = asyncio.get_event_loop()

            response = await loop.run_in_executor(
                None, 
                lambda: self.client.create_tweet(text=tweet_text)
            )
            
            tweet_id = response.data['id']
            success_msg = f"SUCCESS! Posted Tweet ID: {tweet_id}"
            print(success_msg, flush=True)

            try:
                log_tweet(
                    topic="News Update", 
                    tweet_text=tweet_text, 
                    tweet_id=str(tweet_id)
                )
                print("Saved to Database.", flush=True)
            except Exception as db_e:
                print(f"DB Log Warning: {db_e}")

            return success_msg

        except Exception as e:
            error_msg = f"POST ERROR: {e}"
            print(error_msg, flush=True)
            if "403" in str(e):
                return "Error 403: Duplicate Tweet detected by Twitter. Try posting different news."
                
            return error_msg