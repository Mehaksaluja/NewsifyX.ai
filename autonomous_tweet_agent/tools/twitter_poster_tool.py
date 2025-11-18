import tweepy
import os
import asyncio
from tools.base_tool import BaseTool
# Database logger import kiya
from core.db_handler import log_tweet

class TwitterPosterTool(BaseTool):
    name = "twitter_poster"
    description = "Posts the final tweet text to X (Twitter) and logs to DB."

    def __init__(self):
        try:
            self.api_key = os.environ["X_API_KEY"]
            self.api_secret = os.environ["X_API_SECRET"]
            self.access_token = os.environ["X_ACCESS_TOKEN"]
            self.access_token_secret = os.environ["X_ACCESS_TOKEN_SECRET"]

            if not all([self.api_key, self.api_secret, self.access_token, self.access_token_secret]):
                raise ValueError("Missing keys")

            self.client = tweepy.Client(
                consumer_key=self.api_key,
                consumer_secret=self.api_secret,
                access_token=self.access_token,
                access_token_secret=self.access_token_secret
            )
            print("TwitterPosterTool initialized.")
        
        except Exception as e:
            print(f"Error init TwitterPosterTool: {e}")
            self.client = None

    async def run(self, tweet_text: str):
        if self.client is None:
            return "Error: Client not initialized."

        if not tweet_text or len(tweet_text.strip()) == 0:
            return "Error: Empty tweet."

        # Safai: Agar input mein 'output from...' jaisa kuch aa gaya galti se
        if "output from" in tweet_text.lower():
             print("Cleaning input text...")
             # Yahan hum assume kar rahe hain ki text saaf hai, 
             # par safety ke liye print kar rahe hain
        
        print(f"Attempting to post: \n{tweet_text}")
        
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.client.create_tweet(text=tweet_text)
            )
            
            tweet_id = response.data.get('id')
            success_msg = f"Successfully posted tweet! ID: {tweet_id}"
            print(success_msg)

            # --- DATABASE LOGGING ---
            # Tweet post hone ke baad use database mein save karo
            try:
                log_tweet(
                    topic="News Update", # Filhal generic topic rakh rahe hain
                    tweet_text=tweet_text, 
                    tweet_id=str(tweet_id)
                )
            except Exception as db_e:
                print(f"Warning: Could not save to DB: {db_e}")
            # ------------------------

            return success_msg

        except Exception as e:
            return f"Error posting tweet: {e}"