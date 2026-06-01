from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    agent_initialized: bool
    version: str = "1.0.0"

class AgentStatusResponse(BaseModel):
    status: str
    is_active: bool
    tweets_per_day: int
    active_hours_start: int
    active_hours_end: int
    force_run: bool
    agent_ready: bool
    timestamp: str

class RunAgentResponse(BaseModel):
    success: bool
    message: str
    timestamp: str
    execution_time: Optional[float] = None
    tweet_id: Optional[str] = None
    tweet_text: Optional[str] = None
    manual_post: bool = False
    instructions: Optional[str] = None
    error: Optional[str] = None

class TweetItem(BaseModel):
    id: str
    topic: str
    tweet_text: str
    tweet_id: str
    created_at: str
    timestamp: str
    post_mode: Optional[str] = "api"

class TweetsResponse(BaseModel):
    success: bool
    count: int
    tweets: List[TweetItem]
    timestamp: str

class StatsResponse(BaseModel):
    success: bool
    total_tweets: int
    tweets_today: int
    tweets_this_week: int
    tweets_this_month: int
    success_rate: float
    last_tweet_time: Optional[str] = None
    timestamp: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    timestamp: str
    details: Optional[Dict[str, Any]] = None

class ConfigUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    tweets_per_day: Optional[int] = None
    active_hours_start: Optional[int] = None
    active_hours_end: Optional[int] = None

class ConfigUpdateResponse(BaseModel):
    success: bool
    message: str
    config: Dict[str, Any]
    timestamp: str

