import tweepy
import os
import asyncio
import datetime
from tools.base_tool import BaseTool
from core.db_handler import log_tweet

class TwitterPosterTool(BaseTool):
    name = "twitter_poster"
    description = "Posts the final tweet to X (Twitter) and logs it to Firebase."

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
            print("Client Ready.", flush=True)
        
        except Exception as e:
            print(f"Init Error: {e}", flush=True)
            self.client = None

    async def run(self, tweet_text: str):
        if self.client is None: 
            return "Error: Twitter client not initialized. Check API credentials."
        
        clean_tweet = tweet_text.strip()
        
        if len(clean_tweet) > 280:
            clean_tweet = clean_tweet[:277] + "..."
            print(f"Tweet truncated to 280 characters", flush=True)
        
        print(f"\nPosting Tweet to X:\n---\n{clean_tweet}\n---\nCharacter count: {len(clean_tweet)}", flush=True)
        
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.client.create_tweet(text=clean_tweet)
            )
            
            tweet_id = response.data['id']
            print(f"Tweet posted successfully! Tweet ID: {tweet_id}", flush=True)
            
            topic = "News Update"
            try:
                tweet_parts = clean_tweet.split('\n\n')
                if tweet_parts:
                    first_line = tweet_parts[0].split('\n')[0].strip()
                    if len(first_line) > 10:
                        topic = first_line[:50]
                    else:
                        all_lines = tweet_parts[0].split('\n')
                        for line in all_lines:
                            if len(line.strip()) > 15:
                                topic = line.strip()[:50]
                                break
            except Exception as e:
                print(f"Error extracting topic: {e}. Using default.", flush=True)
                topic = clean_tweet.split('\n')[0][:50] if clean_tweet else "News Update"
            
            try: 
                log_tweet(topic, clean_tweet, str(tweet_id))
                print(f"Tweet logged to Firebase", flush=True)
            except Exception as log_error:
                print(f"Firebase logging error (non-critical): {log_error}", flush=True)

            return f"Success: Tweet posted with ID {tweet_id}"

        except Exception as e:
            error_msg = str(e)
            print(f"POST ERROR: {error_msg}", flush=True)
            
            if "duplicate" in error_msg.lower():
                return f"Error: Duplicate tweet detected. Please wait before posting similar content."
            elif "spam" in error_msg.lower() or "suspended" in error_msg.lower():
                return f"Error: Content flagged. Please review tweet content for spam or policy violations."
            else:
                return f"Error: Failed to post tweet. {error_msg}"