import asyncio
import time
import datetime
from dotenv import load_dotenv

# Database Config
from core.db_handler import get_bot_config

# Agents & Registry
from agents.planner_agent import PlannerAgent
from agents.controller_agent import ControllerAgent
from tools.tool_registry import ToolRegistry

# Tools
from tools.tweet_writer_tool import TweetWriterTool
from tools.hashtag_tool import HashtagGeneratorTool
from tools.final_tweet_tool import FinalTweetAssemblerTool
from tools.news_scraper_tool import NewsScraperTool
from tools.headline_selection_tool import HeadlineSelectionTool
from tools.twitter_poster_tool import TwitterPosterTool

async def run_agent_cycle(planner, controller):
    print("="*50)
    print(f"🚀 Starting Agent Cycle at {time.ctime()}...")
    
    user_query = "Get the top news, write a tweet about the most interesting story, and post it to Twitter."
    
    # 1. Plan
    plan = await planner.plan(user_query)
    if plan.get("error"):
        print(f"Error creating plan: {plan.get('error')}")
        return

    # 2. Execute
    print("📋 Executing Plan...")
    outputs = await controller.execute_plan(plan)
    
    print("\n--- CYCLE COMPLETE ---")
    print(outputs[-1] if outputs else "No output.")
    print("="*50 + "\n")

async def main():
    print("Loading system...")
    load_dotenv()
    
    # 1. Registry Setup
    registry = ToolRegistry()
    registry.register(TweetWriterTool())
    registry.register(HashtagGeneratorTool())
    registry.register(FinalTweetAssemblerTool())
    registry.register(NewsScraperTool())
    registry.register(HeadlineSelectionTool())
    registry.register(TwitterPosterTool())

    planner = PlannerAgent()
    controller = ControllerAgent(registry)

    print("🤖 Autonomous News Agent is ONLINE.")

    while True:
        # --- SMART CONFIG CHECK ---
        try:
            config = get_bot_config()
            print(f"\n⚙️ Settings Loaded: {config}")
        except Exception as e:
            print(f"⚠️ Error reading config, using defaults. Error: {e}")
            config = {"is_active": True, "tweets_per_day": 4, "active_hours_start": 9, "active_hours_end": 22}

        # 1. MASTER SWITCH CHECK
        if not config.get("is_active", True):
            print("💤 Bot is PAUSED by Admin (Dashboard). Sleeping for 5 minutes...")
            await asyncio.sleep(300) # 5 min wait check again
            continue

        # 2. TIME WINDOW CHECK
        current_hour = datetime.datetime.now().hour
        start_hour = config.get("active_hours_start", 9)
        end_hour = config.get("active_hours_end", 22)

        if current_hour < start_hour or current_hour >= end_hour:
            print(f"🌙 Off-Hours (Current: {current_hour}, Active: {start_hour}-{end_hour}). Sleeping for 30 mins...")
            await asyncio.sleep(1800) # 30 min wait
            continue

        # --- RUN CYCLE ---
        try:
            await run_agent_cycle(planner, controller)
        except Exception as e:
            print(f"❌ Critical Error in Cycle: {e}")
            await asyncio.sleep(60)
            continue
            
        # 3. DYNAMIC SLEEP CALCULATION
        # Active hours nikaalo (e.g., 22 - 9 = 13 hours)
        active_duration_hours = end_hour - start_hour
        if active_duration_hours <= 0: active_duration_hours = 12 # Fallback
        
        tweets_per_day = config.get("tweets_per_day", 4)
        if tweets_per_day <= 0: tweets_per_day = 1

        # Calculate sleep seconds
        # (Active Hours * 60 * 60) / Tweets Count
        sleep_seconds = (active_duration_hours * 3600) / tweets_per_day
        
        print(f"✅ Cycle Done. Next run in {sleep_seconds/60:.1f} minutes based on schedule.")
        await asyncio.sleep(sleep_seconds)

if __name__ == "__main__":
    asyncio.run(main())