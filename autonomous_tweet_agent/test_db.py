import tweepy
import os
from dotenv import load_dotenv

# 1. Load updated keys
load_dotenv()

api_key = os.getenv("X_API_KEY")
api_secret = os.getenv("X_API_SECRET")
access_token = os.getenv("X_ACCESS_TOKEN")
access_token_secret = os.getenv("X_ACCESS_TOKEN_SECRET")

print("--- CHECKING KEYS ---")
print(f"API Key: {api_key[:5]}... (loaded)")
print(f"Access Token: {access_token[:5]}... (loaded)")

# 2. Connect using API v2 (Required for Free Tier)
client = tweepy.Client(
    consumer_key=api_key,
    consumer_secret=api_secret,
    access_token=access_token,
    access_token_secret=access_token_secret
)

# 3. Test Write Permission
print("\n--- ATTEMPTING TO POST ---")
try:
    response = client.create_tweet(text="Final configuration check! 🤖 #AI_News_System")
    print(f"✅ SUCCESS! Tweet posted. ID: {response.data['id']}")
except Exception as e:
    print(f"❌ FAILED: {e}")
    if "403" in str(e):
        print("\n⚠️  DIAGNOSIS: Still 403?")
        print("1. Did you switch permission to JUST 'Read and Write' (No DM)?")
        print("2. Did you verify a Phone Number on the Twitter account settings?")
        print("3. Did you regenerate BOTH Consumer Keys AND Access Tokens?")