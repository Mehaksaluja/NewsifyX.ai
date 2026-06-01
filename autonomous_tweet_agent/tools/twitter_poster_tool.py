import tweepy
import os
import asyncio
import datetime
import uuid
from tools.base_tool import BaseTool
from core.db_handler import log_tweet

MANUAL_TWEET_MARKER = "\n---MANUAL_TWEET---\n"


def is_manual_post_mode() -> bool:
    return os.environ.get("MANUAL_POST", "").lower() in ("true", "1", "yes")


def should_fallback_to_manual(error_msg: str) -> bool:
    lowered = error_msg.lower()
    return (
        "402" in error_msg
        or "payment required" in lowered
        or "does not have any credits" in lowered
        or "credit" in lowered and "required" in lowered
    )


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

    def _extract_topic(self, clean_tweet: str) -> str:
        topic = "News Update"
        try:
            tweet_parts = clean_tweet.split('\n\n')
            if tweet_parts:
                first_line = tweet_parts[0].split('\n')[0].strip()
                if len(first_line) > 10:
                    topic = first_line[:50]
                else:
                    for line in tweet_parts[0].split('\n'):
                        if len(line.strip()) > 15:
                            topic = line.strip()[:50]
                            break
        except Exception as e:
            print(f"Error extracting topic: {e}. Using default.", flush=True)
            topic = clean_tweet.split('\n')[0][:50] if clean_tweet else "News Update"
        return topic

    def _manual_post(self, clean_tweet: str, reason: str) -> str:
        manual_id = f"manual-{uuid.uuid4().hex[:12]}"
        topic = self._extract_topic(clean_tweet)

        print(f"\n[MANUAL POST] X API unavailable ({reason}).", flush=True)
        print(f"[MANUAL POST] Tweet saved for manual posting. ID: {manual_id}", flush=True)
        print(f"[MANUAL POST] Copy the tweet below and post it on X:\n---\n{clean_tweet}\n---", flush=True)

        try:
            log_tweet(topic, clean_tweet, manual_id, post_mode="manual")
            print("[MANUAL POST] Tweet logged to Firebase", flush=True)
        except Exception as log_error:
            print(f"[MANUAL POST] Firebase logging error (non-critical): {log_error}", flush=True)

        return f"Success: Manual post ready. ID {manual_id}{MANUAL_TWEET_MARKER}{clean_tweet}"

    async def run(self, tweet_text: str):
        clean_tweet = tweet_text.strip()

        if len(clean_tweet) > 280:
            clean_tweet = clean_tweet[:277] + "..."
            print("Tweet truncated to 280 characters", flush=True)

        print(f"\nPosting Tweet to X:\n---\n{clean_tweet}\n---\nCharacter count: {len(clean_tweet)}", flush=True)

        if is_manual_post_mode():
            return self._manual_post(clean_tweet, "MANUAL_POST mode enabled")

        if self.client is None:
            return self._manual_post(clean_tweet, "Twitter client not initialized")

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.create_tweet(text=clean_tweet)
            )

            tweet_id = response.data['id']
            print(f"Tweet posted successfully! Tweet ID: {tweet_id}", flush=True)

            topic = self._extract_topic(clean_tweet)

            try:
                log_tweet(topic, clean_tweet, str(tweet_id), post_mode="api")
                print("Tweet logged to Firebase", flush=True)
            except Exception as log_error:
                print(f"Firebase logging error (non-critical): {log_error}", flush=True)

            return f"Success: Tweet posted with ID {tweet_id}"

        except Exception as e:
            error_msg = str(e)
            print(f"POST ERROR: {error_msg}", flush=True)

            if should_fallback_to_manual(error_msg):
                return self._manual_post(clean_tweet, error_msg)

            if "duplicate" in error_msg.lower():
                return "Error: Duplicate tweet detected. Please wait before posting similar content."
            if "spam" in error_msg.lower() or "suspended" in error_msg.lower():
                return "Error: Content flagged. Please review tweet content for spam or policy violations."

            return f"Error: Failed to post tweet. {error_msg}"
