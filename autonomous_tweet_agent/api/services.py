from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from core.db_handler import get_bot_config, turn_off_force_run, log_tweet
from agents.planner_agent import PlannerAgent
from agents.controller_agent import ControllerAgent
from tools.tool_registry import ToolRegistry
from tools.tweet_writer_tool import TweetWriterTool
from tools.hashtag_tool import HashtagGeneratorTool
from tools.final_tweet_tool import FinalTweetAssemblerTool
from tools.news_scraper_tool import NewsScraperTool
from tools.headline_selection_tool import HeadlineSelectionTool
from tools.twitter_poster_tool import TwitterPosterTool
import time

class AgentService:
    def __init__(self):
        self.planner = None
        self.controller = None
        self.registry = None
        self.initialized = False
        self._initialize()

    def _initialize(self):
        if self.initialized:
            return
        
        try:
            self.registry = ToolRegistry()
            self.registry.register(TweetWriterTool())
            self.registry.register(HashtagGeneratorTool())
            self.registry.register(FinalTweetAssemblerTool())
            self.registry.register(NewsScraperTool())
            self.registry.register(HeadlineSelectionTool())
            self.registry.register(TwitterPosterTool())

            self.planner = PlannerAgent()
            self.controller = ControllerAgent(self.registry)
            self.initialized = True
            print("[SERVICE] Agent service initialized successfully")
        except Exception as e:
            print(f"[SERVICE] Error initializing agent service: {e}")
            self.initialized = False

    def is_ready(self) -> bool:
        return self.initialized and self.planner is not None and self.controller is not None

    async def run_agent_cycle(self) -> Dict[str, Any]:
        if not self.is_ready():
            return {
                "success": False,
                "error": "Agent not initialized. Please check service status."
            }

        start_time = time.time()
        
        try:
            print("="*50)
            print(f"Starting Agent Cycle at {datetime.now().strftime('%H:%M:%S')}...")
            
            user_query = "Get the top news, write a tweet about the most interesting story, and post it to Twitter."
            
            plan = await self.planner.plan(user_query)
            if plan.get("error"):
                error_msg = f"Error creating plan: {plan.get('error')}"
                print(error_msg)
                return {
                    "success": False,
                    "error": error_msg
                }

            print("Executing Plan...")
            outputs = await self.controller.execute_plan(plan)
            
            execution_time = time.time() - start_time
            
            tweet_id = None
            error_message = None
            
            if outputs and len(outputs) > 0:
                for output in outputs:
                    output_str = str(output)
                    if "Error:" in output_str:
                        error_message = output_str
                        print(f"[SERVICE] Error detected in output: {error_message}")
                        break
                    elif "Success: Tweet posted with ID" in output_str:
                        try:
                            tweet_id = output_str.split("ID ")[1].strip()
                            print(f"[SERVICE] Tweet posted successfully with ID: {tweet_id}")
                        except:
                            pass

            print("\n--- CYCLE COMPLETE ---")
            print("="*50 + "\n")
            
            if error_message:
                return {
                    "success": False,
                    "error": error_message,
                    "execution_time": round(execution_time, 2),
                    "tweet_id": None
                }
            
            if tweet_id is None:
                return {
                    "success": False,
                    "error": "Tweet was not posted. No tweet ID was returned from the Twitter API. Check Twitter API credentials and rate limits.",
                    "execution_time": round(execution_time, 2),
                    "tweet_id": None
                }
            
            return {
                "success": True,
                "message": "Agent cycle completed successfully",
                "execution_time": round(execution_time, 2),
                "tweet_id": tweet_id,
                "outputs_count": len(outputs)
            }
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"[SERVICE] Error in agent cycle: {e}")
            print(error_details)
            return {
                "success": False,
                "error": str(e),
                "execution_time": round(time.time() - start_time, 2)
            }

    def get_status(self) -> Dict[str, Any]:
        try:
            config = get_bot_config()
            return {
                "status": "online",
                "is_active": config.get("is_active", True),
                "tweets_per_day": config.get("tweets_per_day", 4),
                "active_hours_start": config.get("active_hours_start", 9),
                "active_hours_end": config.get("active_hours_end", 22),
                "force_run": config.get("force_run", False),
                "agent_ready": self.is_ready(),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "agent_ready": self.is_ready(),
                "timestamp": datetime.now().isoformat()
            }

agent_service = AgentService()

