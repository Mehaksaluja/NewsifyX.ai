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


def describe_x_error(e: Exception) -> str:
    """Build a readable reason from an X/tweepy error, including X's own explanation."""
    parts = [str(e).strip()]
    resp = getattr(e, "response", None)
    if resp is not None:
        try:
            body = resp.json()
            for key in ("detail", "title", "reason"):
                if body.get(key) and body[key] not in parts[0]:
                    parts.append(str(body[key]))
        except Exception:
            text = getattr(resp, "text", "")
            if text and text not in parts[0]:
                parts.append(text[:300])
    return " | ".join(p for p in parts if p)


def friendly_reason(error_msg: str) -> str:
    lowered = error_msg.lower()
    if "duplicate" in lowered:
        return "X rejected it as duplicate content"
    if "402" in error_msg or "credit" in lowered or "payment required" in lowered:
        return "X API credits are unavailable"
    if "403" in error_msg or "forbidden" in lowered:
        return "X refused the post (403 Forbidden)"
    if "401" in error_msg or "unauthorized" in lowered:
        return "X API credentials were rejected"
    if "429" in error_msg or "too many requests" in lowered:
        return "X API rate limit reached"
    return "X API posting failed"


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
        self.last_manual_reason = reason
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
        self.last_manual_reason = None

        if not clean_tweet or clean_tweet.lower().startswith("error"):
            return f"Error: No tweet was generated to post. {clean_tweet}"

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
            error_msg = " ".join(describe_x_error(e).split())
            print(f"POST ERROR: {error_msg}", flush=True)
            # The tweet is already written - never throw it away. Hand it over for manual posting.
            return self._manual_post(clean_tweet, f"{friendly_reason(error_msg)}: {error_msg}")
