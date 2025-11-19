import asyncio
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from core.db_handler import get_bot_config
from agents.planner_agent import PlannerAgent
from agents.controller_agent import ControllerAgent
from tools.tool_registry import ToolRegistry
from tools.tweet_writer_tool import TweetWriterTool
from tools.hashtag_tool import HashtagGeneratorTool
from tools.final_tweet_tool import FinalTweetAssemblerTool
from tools.news_scraper_tool import NewsScraperTool
from tools.headline_selection_tool import HeadlineSelectionTool
from tools.twitter_poster_tool import TwitterPosterTool

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

async def main():
    print("Loading system...")
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

    print("Autonomous News Agent is ONLINE.")

    next_run_time = datetime.now()

    while True:
        try:
            config = get_bot_config()
        except Exception as e:
            print(f"Config Error: {e}")
            config = {"is_active": True, "tweets_per_day": 4, "active_hours_start": 9, "active_hours_end": 22}

        if not config.get("is_active", True):
            print(f"\rBot is PAUSED via Dashboard. Checking again in 10s...", end="")
            await asyncio.sleep(10)
            continue
        current_hour = datetime.now().hour
        start_hour = config.get("active_hours_start", 9)
        end_hour = config.get("active_hours_end", 22)

        if current_hour < start_hour or current_hour >= end_hour:
            print(f"\r🌙 Off-Hours ({current_hour}:00). Active: {start_hour}-{end_hour}. Checking again in 60s...", end="")
            await asyncio.sleep(60)
            continue
        time_now = datetime.now()
        
        if time_now >= next_run_time:
            try:
                await run_agent_cycle(planner, controller)
            except Exception as e:
                print(f"Critical Error: {e}")
            active_duration = end_hour - start_hour
            if active_duration <= 0: active_duration = 12
            
            freq = config.get("tweets_per_day", 4)
            if freq <= 0: freq = 1
            interval_seconds = (active_duration * 3600) / freq
            next_run_time = datetime.now() + timedelta(seconds=interval_seconds)
            print(f"Cycle Done. Next run scheduled for: {next_run_time.strftime('%H:%M:%S')}")
            
        else:
            remaining = next_run_time - time_now
            minutes = int(remaining.total_seconds() // 60)
            seconds = int(remaining.total_seconds() % 60)
            print(f"\rWaiting... Next run in {minutes}m {seconds}s | Config: {freq} tweets/day", end="")

            await asyncio.sleep(10)

if __name__ == "__main__":
    asyncio.run(main())