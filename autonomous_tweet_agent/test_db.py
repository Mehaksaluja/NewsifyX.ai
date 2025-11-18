from core.db_handler import init_firebase, log_tweet, get_bot_config

# 1. Connect
init_firebase()

# 2. Test Logging (Write)
print("Testing Write...")
log_tweet(
    topic="Firebase Test", 
    tweet_text="This is a test entry for the dashboard.", 
    tweet_id="12345_TEST_ID"
)

# 3. Test Reading Config (Read)
print("\nTesting Read Config...")
config = get_bot_config()
print(f"Current Settings: {config}")

print("\nCheck your Firebase Console -> Firestore Database. You should see 'tweets' and 'bot_config' collections!")