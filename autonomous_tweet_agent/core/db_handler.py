import firebase_admin
from firebase_admin import credentials, firestore
import datetime
import os
import json

db_client = None

def init_firebase():
    global db_client
    if not firebase_admin._apps:
        cred = None

        firebase_json_str = os.environ.get("FIREBASE_CREDENTIALS_JSON")
        if firebase_json_str:
            print("Loading Firebase from Environment Variable")
            cred_dict = json.loads(firebase_json_str)
            cred = credentials.Certificate(cred_dict)

        elif os.path.exists("firebase_key.json"):
            print("Loading Firebase from local JSON file")
            cred = credentials.Certificate("firebase_key.json")
            
        else:
            print("CRITICAL ERROR: No Firebase credentials found!")
            return None
            
        firebase_admin.initialize_app(cred)
    
    db_client = firestore.client()
    return db_client

def log_tweet(topic, tweet_text, tweet_id):
    if db_client is None: init_firebase()
    data = {
        "topic": topic,
        "tweet_text": tweet_text,
        "tweet_id": tweet_id,
        "timestamp": datetime.datetime.now(),
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    try:
        db_client.collection("tweets").add(data)
        print(f"Tweet logged to Firebase: {tweet_id}")
    except Exception as e:
        print(f"DB Log Error: {e}")

def get_bot_config():
    if db_client is None: init_firebase()
    try:
        config_ref = db_client.collection("bot_config").document("main_settings")
        doc = config_ref.get()
        if doc.exists: return doc.to_dict()
        else:
            default = {"is_active": True, "tweets_per_day": 4, "active_hours_start": 9, "active_hours_end": 22}
            config_ref.set(default)
            return default
    except Exception as e:
        print(f"Config Read Error: {e}")
        return {}

def turn_off_force_run():
    if db_client is None: init_firebase()
    try:
        config_ref = db_client.collection("bot_config").document("main_settings")
        config_ref.update({"force_run": False})
        print("Force run flag reset.")
    except Exception as e:
        print(f"Error resetting flag: {e}")