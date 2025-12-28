from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime
import os
from dotenv import load_dotenv
from api.routes import router
from api.services import agent_service

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[API] Starting FastAPI server...")
    print("[API] Initializing agent service...")
    agent_service._initialize()
    if agent_service.is_ready():
        print("[API] Agent service initialized successfully")
    else:
        print("[API] Warning: Agent service initialization failed")
    yield
    print("[API] Shutting down...")

app = FastAPI(
    title="NEWSIFYX.AI API",
    description="API for controlling and monitoring the NEWSIFYX.AI autonomous news tweeting agent",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api", tags=["API"])

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "NEWSIFYX.AI API",
        "status": "online",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "health": "/api/health",
            "status": "/api/status",
            "run_agent": "POST /api/run-agent",
            "tweets": "/api/tweets",
            "stats": "/api/stats",
            "config": "PUT /api/config",
            "docs": "/docs"
        }
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    error_details = traceback.format_exc()
    print(f"[API] Unhandled exception: {exc}")
    print(error_details)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

