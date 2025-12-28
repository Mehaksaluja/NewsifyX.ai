import asyncio
import time
import threading
import os
from flask import Flask
from datetime import datetime, timedelta
from dotenv import load_dotenv
from core.db_handler import get_bot_config, turn_off_force_run
from agents.planner_agent import PlannerAgent
from agents.controller_agent import ControllerAgent
from tools.tool_registry import ToolRegistry
from tools.tweet_writer_tool import TweetWriterTool
from tools.hashtag_tool import HashtagGeneratorTool
from tools.final_tweet_tool import FinalTweetAssemblerTool
from tools.news_scraper_tool import NewsScraperTool
from tools.headline_selection_tool import HeadlineSelectionTool
from tools.twitter_poster_tool import TwitterPosterTool

app = Flask(__name__)

@app.route('/')
def home():
    return "NEWSIFYX.AI is Running! System Online."

def run_bot_loop():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(main_logic())

async def run_agent_cycle(planner, controller):
    print("="*50)
    print(f"Starting Agent Cycle at {datetime.now().strftime('%H:%M:%S')}...")
    
    user_query = "Get the top news, write a tweet about the most interesting story, and post it to Twitter."
    
    plan = await planner.plan(user_query)
    if plan.get("error"):
        print(f"Error creating plan: {plan.get('error')}")
        return

    print("Executing Plan...")
    outputs = await controller.execute_plan(plan)
    
    print("\n--- CYCLE COMPLETE ---")
    print("="*50 + "\n")

async def main_logic():
    print("[INIT] Loading system...")
    load_dotenv()

    registry = ToolRegistry()
    registry.register(TweetWriterTool())
    registry.register(HashtagGeneratorTool())
    registry.register(FinalTweetAssemblerTool())
    registry.register(NewsScraperTool())
    registry.register(HeadlineSelectionTool())
    registry.register(TwitterPosterTool())

    planner = PlannerAgent()
    controller = ControllerAgent(registry)

    print("[INIT] NEWSIFYX.AI is ONLINE.")
    print("[INIT] All tools registered and ready.")
    next_run_time = datetime.now()

    while True:
        try:
            config = get_bot_config()
        except Exception as e:
            print(f"Config Error: {e}")
            config = {"is_active": True, "tweets_per_day": 4, "force_run": False, "active_hours_start": 9, "active_hours_end": 22}

        if config.get("force_run", False) == True:
            print("\n[TRIGGER] RECEIVED 'POST NOW' COMMAND FROM DASHBOARD!")
            try:
                await run_agent_cycle(planner, controller)
                
                turn_off_force_run()
                active_duration = config.get("active_hours_end", 22) - config.get("active_hours_start", 9)
                if active_duration <= 0: active_duration = 12
                freq = config.get("tweets_per_day", 4)
                if freq <= 0: freq = 1
                interval_seconds = (active_duration * 3600) / freq
                
                next_run_time = datetime.now() + timedelta(seconds=interval_seconds)
                print(f"[TRIGGER] Forced Run Complete. Schedule reset. Next run: {next_run_time.strftime('%H:%M:%S')}")
                
            except Exception as e:
                print(f"[ERROR] Error during Force Run: {e}")
                import traceback
                traceback.print_exc()
                turn_off_force_run()
            
            continue

        if not config.get("is_active", True):
            print(f"[STATUS] Bot is PAUSED via Dashboard. Checking again in 10s...")
            await asyncio.sleep(10) 
            continue
        
        current_hour = datetime.now().hour
        start_hour = config.get("active_hours_start", 9)
        end_hour = config.get("active_hours_end", 22)

        if current_hour < start_hour or current_hour >= end_hour:
            print(f"[STATUS] Off-Hours ({current_hour}:00). Active hours: {start_hour}-{end_hour}. Checking again in 60s...")
            await asyncio.sleep(60) 
            continue

        time_now = datetime.now()
        
        freq = config.get("tweets_per_day", 4)
        if freq <= 0: freq = 1
        
        if time_now >= next_run_time:
            try:
                await run_agent_cycle(planner, controller)
            except Exception as e:
                print(f"[ERROR] Critical Error: {e}")
                import traceback
                traceback.print_exc()

            active_duration = end_hour - start_hour
            if active_duration <= 0: active_duration = 12
            
            interval_seconds = (active_duration * 3600) / freq
            
            next_run_time = datetime.now() + timedelta(seconds=interval_seconds)
            print(f"[SCHEDULE] Cycle Done. Next run scheduled for: {next_run_time.strftime('%H:%M:%S')}")
            
        else:
            remaining = next_run_time - time_now
            minutes = int(remaining.total_seconds() // 60)
            seconds = int(remaining.total_seconds() % 60)
            
            print(f"[STATUS] Waiting... Next run in {minutes}m {seconds}s | Config: {freq} tweets/day")
            await asyncio.sleep(10)

if __name__ == "__main__":
    t = threading.Thread(target=run_bot_loop)
    t.daemon = True
    t.start()
    print("Starting Web Server for Render...")
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)