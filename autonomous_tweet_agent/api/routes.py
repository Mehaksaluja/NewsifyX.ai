from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from fastapi.responses import Response
from datetime import datetime, timedelta
from typing import List
from api.models import (
    HealthResponse,
    AgentStatusResponse,
    RunAgentResponse,
    TweetsResponse,
    StatsResponse,
    ErrorResponse,
    ConfigUpdateRequest,
    ConfigUpdateResponse,
    TweetItem
)
from api.services import agent_service
from core.db_handler import get_bot_config, turn_off_force_run, log_tweet

router = APIRouter()

# Ultra-lightweight ping endpoint for monitoring services (avoids rate limits)
@router.get("/ping", tags=["Health"])
async def ping():
    """Ultra-lightweight endpoint for monitoring services. Returns minimal response."""
    return Response(status_code=200, content="OK")

@router.head("/ping", tags=["Health"])
async def ping_head():
    """HEAD method for ping endpoint."""
    return Response(status_code=200)

@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check_get():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        agent_initialized=agent_service.is_ready()
    )

@router.post("/health", response_model=HealthResponse, tags=["Health"])
async def health_check_post():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        agent_initialized=agent_service.is_ready()
    )

@router.head("/health", tags=["Health"])
async def health_check_head():
    return Response(status_code=200)

@router.options("/health", tags=["Health"])
async def health_check_options():
    return Response(status_code=200, headers={"Allow": "GET, POST, HEAD, OPTIONS"})

@router.get("/status", response_model=AgentStatusResponse, tags=["Status"])
async def get_status():
    status = agent_service.get_status()
    
    if status.get("status") == "error":
        raise HTTPException(status_code=500, detail=status.get("error"))
    
    return AgentStatusResponse(
        status=status.get("status", "online"),
        is_active=status.get("is_active", True),
        tweets_per_day=status.get("tweets_per_day", 4),
        active_hours_start=status.get("active_hours_start", 9),
        active_hours_end=status.get("active_hours_end", 22),
        force_run=status.get("force_run", False),
        agent_ready=status.get("agent_ready", False),
        timestamp=status.get("timestamp", datetime.now().isoformat())
    )

@router.post("/run-agent", response_model=RunAgentResponse, tags=["Agent"])
async def run_agent(background_tasks: BackgroundTasks):
    try:
        config = get_bot_config()
        
        result = await agent_service.run_agent_cycle()
        
        if result.get("success"):
            tweet_id = result.get("tweet_id")
            if not tweet_id:
                raise HTTPException(
                    status_code=500,
                    detail="Tweet was not posted. No tweet ID was returned. This indicates the tweet posting failed."
                )
            turn_off_force_run()
            return RunAgentResponse(
                success=True,
                message=result.get("message", "Agent cycle completed successfully"),
                timestamp=datetime.now().isoformat(),
                execution_time=result.get("execution_time"),
                tweet_id=tweet_id
            )
        else:
            error_msg = result.get("error", "Unknown error occurred")
            raise HTTPException(
                status_code=500,
                detail=error_msg
            )
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[API] Error in run_agent: {e}")
        print(error_details)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/tweets", response_model=TweetsResponse, tags=["Tweets"])
async def get_tweets(limit: int = 10):
    try:
        from core.db_handler import db_client, init_firebase
        
        if db_client is None:
            init_firebase()
        
        if db_client is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        tweets_ref = db_client.collection("tweets")
        tweets = tweets_ref.order_by("timestamp", direction="DESCENDING").limit(limit).stream()
        
        tweet_list = []
        for doc in tweets:
            data = doc.to_dict()
            tweet_list.append(TweetItem(
                id=doc.id,
                topic=data.get("topic", "Unknown"),
                tweet_text=data.get("tweet_text", ""),
                tweet_id=data.get("tweet_id", ""),
                created_at=data.get("created_at", ""),
                timestamp=data.get("timestamp").isoformat() if hasattr(data.get("timestamp"), "isoformat") else str(data.get("timestamp", ""))
            ))
        
        return TweetsResponse(
            success=True,
            count=len(tweet_list),
            tweets=tweet_list,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        import traceback
        print(f"[API] Error getting tweets: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching tweets: {str(e)}"
        )

@router.get("/stats", response_model=StatsResponse, tags=["Analytics"])
async def get_stats():
    try:
        from core.db_handler import db_client, init_firebase
        
        if db_client is None:
            init_firebase()
        
        if db_client is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        tweets_ref = db_client.collection("tweets")
        all_tweets = list(tweets_ref.stream())
        
        total_tweets = len(all_tweets)
        
        now = datetime.now()
        today_start = datetime(now.year, now.month, now.day)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = datetime(now.year, now.month, 1)
        
        tweets_today = 0
        tweets_this_week = 0
        tweets_this_month = 0
        last_tweet_time = None
        
        for doc in all_tweets:
            data = doc.to_dict()
            tweet_time = data.get("timestamp")
            
            if tweet_time:
                try:
                    if hasattr(tweet_time, "replace"):
                        tweet_dt = tweet_time
                    elif isinstance(tweet_time, str):
                        tweet_dt = datetime.fromisoformat(tweet_time.replace('Z', '+00:00'))
                    else:
                        continue
                    
                    if tweet_dt >= today_start:
                        tweets_today += 1
                    if tweet_dt >= week_start:
                        tweets_this_week += 1
                    if tweet_dt >= month_start:
                        tweets_this_month += 1
                    
                    if last_tweet_time is None or tweet_dt > last_tweet_time:
                        last_tweet_time = tweet_dt
                except Exception:
                    continue
        
        success_rate = 100.0 if total_tweets > 0 else 0.0
        
        return StatsResponse(
            success=True,
            total_tweets=total_tweets,
            tweets_today=tweets_today,
            tweets_this_week=tweets_this_week,
            tweets_this_month=tweets_this_month,
            success_rate=success_rate,
            last_tweet_time=last_tweet_time.isoformat() if last_tweet_time else None,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        import traceback
        print(f"[API] Error getting stats: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching statistics: {str(e)}"
        )

@router.put("/config", response_model=ConfigUpdateResponse, tags=["Config"])
async def update_config(config_update: ConfigUpdateRequest):
    try:
        from core.db_handler import db_client, init_firebase
        
        if db_client is None:
            init_firebase()
        
        if db_client is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        config_ref = db_client.collection("bot_config").document("main_settings")
        current_config = config_ref.get()
        
        if not current_config.exists:
            raise HTTPException(status_code=404, detail="Config not found")
        
        update_data = {}
        if config_update.is_active is not None:
            update_data["is_active"] = config_update.is_active
        if config_update.tweets_per_day is not None:
            if config_update.tweets_per_day < 1 or config_update.tweets_per_day > 24:
                raise HTTPException(status_code=400, detail="tweets_per_day must be between 1 and 24")
            update_data["tweets_per_day"] = config_update.tweets_per_day
        if config_update.active_hours_start is not None:
            if config_update.active_hours_start < 0 or config_update.active_hours_start > 23:
                raise HTTPException(status_code=400, detail="active_hours_start must be between 0 and 23")
            update_data["active_hours_start"] = config_update.active_hours_start
        if config_update.active_hours_end is not None:
            if config_update.active_hours_end < 0 or config_update.active_hours_end > 23:
                raise HTTPException(status_code=400, detail="active_hours_end must be between 0 and 23")
            update_data["active_hours_end"] = config_update.active_hours_end
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        config_ref.update(update_data)
        updated_config = config_ref.get().to_dict()
        
        return ConfigUpdateResponse(
            success=True,
            message="Config updated successfully",
            config=updated_config,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[API] Error updating config: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error updating config: {str(e)}"
        )

