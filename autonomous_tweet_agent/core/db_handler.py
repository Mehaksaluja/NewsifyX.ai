import firebase_admin
from firebase_admin import credentials, firestore
import datetime
import os
import json

db_client = None

def init_firebase():
    global db_client
    try:
        print("[FB] Initializing Firebase...")
        
        if not firebase_admin._apps:
            cred = None

            firebase_json_str = os.environ.get("FIREBASE_CREDENTIALS_JSON")
            if firebase_json_str:
                print("[FB] Loading Firebase from Environment Variable...")
                try:
                    cred_dict = json.loads(firebase_json_str)
                    cred = credentials.Certificate(cred_dict)
                    print("[FB] Credentials loaded from environment")
                except json.JSONDecodeError as e:
                    print(f"[FB] ERROR: Error parsing FIREBASE_CREDENTIALS_JSON: {e}")
                    return None

            elif os.path.exists("firebase_key.json"):
                print("[FB] Loading Firebase from local JSON file...")
                try:
                    cred = credentials.Certificate("firebase_key.json")
                    print("[FB] Credentials loaded from file")
                except Exception as e:
                    print(f"[FB] ERROR: Error loading firebase_key.json: {e}")
                    return None
                
            else:
                print("[FB] CRITICAL ERROR: No Firebase credentials found!")
                print("[FB] Please provide either:")
                print("[FB]   1. FIREBASE_CREDENTIALS_JSON environment variable, OR")
                print("[FB]   2. firebase_key.json file in the autonomous_tweet_agent directory")
                return None
            
            print("[FB] Connecting to Firebase...")
            try:
                firebase_admin.initialize_app(cred)
                print("[FB] Firebase app initialized")
            except Exception as e:
                print(f"[FB] ERROR: Error initializing Firebase app: {e}")
                return None
        else:
            print("[FB] Firebase app already initialized")
        
        print("[FB] Creating Firestore client...")
        db_client = firestore.client()
        print("[FB] Firebase connection established successfully!")
        return db_client
        
    except Exception as e:
        print(f"[FB] ERROR: Firebase initialization error: {e}")
        import traceback
        traceback.print_exc()
        return None

def log_tweet(topic, tweet_text, tweet_id, post_mode="api"):
    if db_client is None: 
        result = init_firebase()
        if result is None:
            print(f"[DB] WARNING: Cannot log tweet - Firebase not available. Tweet ID: {tweet_id}")
            return
    
    data = {
        "topic": topic,
        "tweet_text": tweet_text,
        "tweet_id": tweet_id,
        "post_mode": post_mode,
        "timestamp": datetime.datetime.now(),
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    try:
        db_client.collection("tweets").add(data)
        print(f"[DB] Tweet logged to Firebase: {tweet_id}")
    except Exception as e:
        print(f"[DB] WARNING: DB Log Error: {e}")

def get_bot_config():
    if db_client is None: 
        result = init_firebase()
        if result is None:
            print("[CONFIG] WARNING: Firebase not initialized, using default config")
            return {"is_active": True, "tweets_per_day": 4, "force_run": False, "active_hours_start": 9, "active_hours_end": 22}
    
    try:
        print("[CONFIG] Reading bot configuration from Firebase...")
        config_ref = db_client.collection("bot_config").document("main_settings")
        doc = config_ref.get()
        if doc.exists: 
            config = doc.to_dict()
            print("[CONFIG] Config loaded from Firebase")
            return config
        else:
            print("[CONFIG] Creating default config in Firebase...")
            default = {"is_active": True, "tweets_per_day": 4, "force_run": False, "active_hours_start": 9, "active_hours_end": 22}
            config_ref.set(default)
            print("[CONFIG] Default config created")
            return default
    except Exception as e:
        print(f"[CONFIG] WARNING: Config Read Error: {e}")
        print("[CONFIG] Using fallback default config")
        return {"is_active": True, "tweets_per_day": 4, "force_run": False, "active_hours_start": 9, "active_hours_end": 22}

def turn_off_force_run():
    if db_client is None: 
        result = init_firebase()
        if result is None:
            print("[CONFIG] WARNING: Cannot reset force_run flag - Firebase not available")
            return
    
    try:
        config_ref = db_client.collection("bot_config").document("main_settings")
        config_ref.update({"force_run": False})
        print("[CONFIG] Force run flag reset")
    except Exception as e:
        print(f"[CONFIG] WARNING: Error resetting flag: {e}")