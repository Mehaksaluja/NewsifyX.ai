import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import datetime
import os

# Global client variable
db_client = None

def init_firebase():
    """
    Initializes the Firebase connection using the JSON key.
    """
    global db_client
    
    # Check if already initialized to avoid errors
    if not firebase_admin._apps:
        # Ensure the key file exists
        if not os.path.exists("firebase_key.json"):
            print("Error: firebase_key.json not found!")
            return None
            
        cred = credentials.Certificate("firebase_key.json")
        firebase_admin.initialize_app(cred)
        print("🔥 Firebase Initialized Successfully!")
    
    db_client = firestore.client()
    return db_client

def log_tweet(topic, tweet_text, tweet_id):
    """
    Saves a posted tweet to the 'tweets' collection in Firestore.
    """
    if db_client is None:
        init_firebase()

    data = {
        "topic": topic,
        "tweet_text": tweet_text,
        "tweet_id": tweet_id,
        "timestamp": datetime.datetime.now(),
        # Frontend par dikhane ke liye formatted time
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Add to 'tweets' collection
    db_client.collection("tweets").add(data)
    print(f"✅ Tweet logged to Firebase: {tweet_id}")

def get_bot_config():
    """
    Reads the bot settings (active hours, frequency) from 'bot_config'.
    If no config exists, it creates a default one.
    """
    if db_client is None:
        init_firebase()

    config_ref = db_client.collection("bot_config").document("main_settings")
    doc = config_ref.get()

    if doc.exists:
        return doc.to_dict()
    else:
        # Create default settings if not found
        default_config = {
            "is_active": True,         # Bot ON/OFF
            "tweets_per_day": 4,       # Frequency
            "active_hours_start": 9,   # 9 AM
            "active_hours_end": 22     # 10 PM
        }
        config_ref.set(default_config)
        print("⚙️ Default config created in Firebase.")
        return default_config