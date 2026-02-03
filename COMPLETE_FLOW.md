# Complete Flow: How a Human Builds This Agent

This document explains the **entire flow of the NEWSIFYX.AI app in the order a human would create it**—from idea to running system. Each section matches a natural “next step” in building such an agent.

---

## Table of Contents

1. [Define the Goal](#1-define-the-goal)
2. [Choose the Data Source](#2-choose-the-data-source)
3. [Choose the AI Provider](#3-choose-the-ai-provider)
4. [Design the Pipeline (Steps)](#4-design-the-pipeline-steps)
5. [Implement the Base Tool Contract](#5-implement-the-base-tool-contract)
6. [Implement Each Tool](#6-implement-each-tool)
7. [Create the Tool Registry](#7-create-the-tool-registry)
8. [Build the Planner Agent](#8-build-the-planner-agent)
9. [Build the Controller Agent](#9-build-the-controller-agent)
10. [Wire the Agent Service](#10-wire-the-agent-service)
11. [Add Persistence: Database](#11-add-persistence-database)
12. [Expose an API Layer](#12-expose-an-api-layer)
13. [Build the Dashboard](#13-build-the-dashboard)
14. [Add Scheduling (Optional)](#14-add-scheduling-optional)
15. [End-to-End Flow Summary](#15-end-to-end-flow-summary)

---

## 1. Define the Goal

**What we want:** An autonomous system that:

- Fetches the latest news
- Picks the most interesting story
- Writes an engaging tweet (with hashtags)
- Posts it to X (Twitter)
- Can be monitored and controlled by a human

So the **human creation flow** starts with this single sentence: *“I want a bot that reads news and tweets the best story automatically.”* Everything else is built to satisfy that goal.

---

## 2. Choose the Data Source

**Decision:** Where does the news come from?

- We need a **stable, free, and easy** source.
- **Google News RSS** is chosen: public RSS feed, no auth for reading, good coverage.

**Implementation idea:** A small module that:

- Fetches the RSS URL
- Parses XML
- Returns top N items (e.g. title + summary)

This will later become the **News Scraper Tool**.

---

## 3. Choose the AI Provider

**Decision:** Which LLM will do “pick story,” “write tweet,” and “generate hashtags”?

- We need **fast inference** and **good quality**.
- **Groq API with Llama 3.3 70B** is chosen: fast, capable, API-friendly.

**Implementation idea:** A **model adapter** (`core/model_adapter.py`) that:

- Takes a prompt string
- Calls Groq API
- Returns the generated text

All “AI” steps in the pipeline will use this adapter. So early in the flow we have: **data source (RSS) + AI (Groq)**.

---

## 4. Design the Pipeline (Steps)

**Decision:** What are the exact steps from “raw news” to “tweet posted”?

A human would list them in order:

| # | Step                | Input              | Output                    | Who does it        |
|---|---------------------|--------------------|---------------------------|--------------------|
| 1 | Get latest news     | (none)             | List of 5 news items      | News Scraper       |
| 2 | Pick best story     | List of news       | One selected item         | Headline Selector  |
| 3 | Write tweet text    | Selected news      | Tweet draft (no hashtags) | Tweet Writer       |
| 4 | Generate hashtags   | Tweet + topic      | Hashtag string             | Hashtag Generator  |
| 5 | Assemble final text | Tweet + hashtags   | Final tweet (≤280 chars)  | Final Tweet Tool   |
| 6 | Post to Twitter     | Final tweet        | Tweet ID + success        | Twitter Poster     |

So the **flow order** is: **Scraper → Selector → Writer → Hashtags → Assembler → Poster**.  
We will implement each as a **tool** that the agent can call.

---

## 5. Implement the Base Tool Contract

**Decision:** Every step should look the same from the “orchestrator” point of view.

So we define a **base contract**:

- Each tool has a **name** and **description** (for the planner).
- Each tool has a single method: **`run(input_text: str)`** (async).
- Input is usually a string (or “output from previous step”); output is a string for the next step.

**File:** `tools/base_tool.py`

```python
class BaseTool:
    name = "base"
    description = "Base Tool"
    async def run(self, input_text: str):
        raise NotImplementedError
```

All concrete tools inherit from `BaseTool` and implement `run()`. This keeps the **flow** consistent: every step is “run this tool with this input, get string output.”

---

## 6. Implement Each Tool

In **human creation order**, we implement tools in **pipeline order**:

1. **News Scraper** (`news_scraper_tool.py`)  
   - Fetches Google News RSS, parses it, returns a formatted string of top 5 items (title + summary).  
   - Input is effectively ignored (or a simple “get latest news” string).

2. **Headline Selector** (`headline_selection_tool.py`)  
   - Input: the string from the scraper.  
   - Uses the **model adapter** (Groq) to choose the single best story.  
   - Output: that one item as a string (title + summary).

3. **Tweet Writer** (`tweet_writer_tool.py`)  
   - Input: selected news string.  
   - Uses Groq to generate tweet text (short, engaging, no hashtags).  
   - Output: structured string (e.g. TOPIC / SUMMARY / TWEET).

4. **Hashtag Generator** (`hashtag_tool.py`)  
   - Input: tweet + topic/summary.  
   - Uses Groq to generate 3–4 hashtags.  
   - Output: string with TWEET and HASHTAGS.

5. **Final Tweet Assembler** (`final_tweet_tool.py`)  
   - Input: tweet text + hashtags.  
   - Pure logic: combine and trim to ≤280 characters.  
   - Output: final tweet string.

6. **Twitter Poster** (`twitter_poster_tool.py`)  
   - Input: final tweet string.  
   - Calls Twitter API v2 to post.  
   - Logs to DB (topic, text, tweet_id).  
   - Output: e.g. “Success: Tweet posted with ID …”

So the **flow** is: **implement pipeline in order, each step = one tool**. Data flows as strings from one tool to the next.

---

## 7. Create the Tool Registry

**Decision:** The “controller” must get a tool by name (e.g. `"news_scraper"`, `"headline_selector"`). So we need a **registry**: name → tool instance.

**File:** `tools/tool_registry.py`

- `register(tool)` → store by `tool.name`
- `get(name)` → return the tool

**Flow:** On startup we will:

1. Create a `ToolRegistry`.
2. Instantiate each tool and `register()` it.
3. Pass the registry to the **Controller Agent**.

So the **human flow** is: “I have N tools; I need one place to register and look them up.”

---

## 8. Build the Planner Agent

**Decision:** We don’t want to hardcode the sequence in the controller. We want the **LLM to output a plan** (e.g. a JSON list of steps) from a high-level user request like “post the news.”

**Planner Agent** (`agents/planner_agent.py`):

- **Input:** User query (e.g. “Get the top news, write a tweet about the most interesting story, and post it to Twitter.”).
- **Prompt:** Describe the 6 tools (name + what they do) and ask for a JSON plan with steps like `{"tool": "news_scraper", "input": "get latest news"}`, etc.
- **Output:** A JSON object, e.g. `{"steps": [ ... ]}`.

So the **flow** is: **Human describes the goal in one sentence → Planner turns it into an ordered list of tool calls.**  
This keeps the system flexible (e.g. we could add tools or change the plan format later).

---

## 9. Build the Controller Agent

**Decision:** Something must **execute** the plan step by step and pass outputs along.

**Controller Agent** (`agents/controller_agent.py`):

- **Input:** The plan (list of steps) from the Planner.
- **Logic:**  
  - For each step: get `tool_name` and `input`.  
  - If input is “output from previous step,” use the **last tool’s output** as input.  
  - Get the tool from the **registry** by name, call `await tool.run(input)`.  
  - Append output to results and set it as `last_output` for the next step.
- **Output:** List of all step outputs (last one typically contains “Success: Tweet posted with ID …”).

So the **flow** is: **Plan (from Planner) → Controller runs each step in order, threading output from step N into step N+1.**

---

## 10. Wire the Agent Service

**Decision:** One place that owns “run one full cycle”: plan → execute → return result.

**Agent Service** (`api/services.py`):

1. **On init:**  
   - Create `ToolRegistry`, register all 6 tools.  
   - Create `PlannerAgent`, `ControllerAgent(registry)`.

2. **On `run_agent_cycle()`:**  
   - Fixed user query: “Get the top news, write a tweet about the most interesting story, and post it to Twitter.”  
   - Call `planner.plan(user_query)` → get plan.  
   - Call `controller.execute_plan(plan)` → get list of outputs.  
   - Parse last output for tweet ID / errors.  
   - Return a single result dict: `success`, `tweet_id`, `execution_time`, `error` (if any).

So the **flow** is: **Service = Planner + Controller + Registry; one method = one full run from news to tweet.**

---

## 11. Add Persistence: Database

**Decision:** We need to:

- **Store every posted tweet** (topic, text, tweet_id, timestamp) for the dashboard and analytics.
- **Store bot configuration** (is_active, tweets_per_day, active_hours, etc.) so the dashboard and scheduler can read/update it.

**Choice:** **Firebase Firestore** (or similar).  
**File:** `core/db_handler.py`

- **Init:** Load credentials (env or `firebase_key.json`), initialize Firestore client.
- **Collections:**  
  - `tweets`: one document per tweet (topic, tweet_text, tweet_id, timestamp).  
  - `bot_config`: e.g. document `main_settings` (is_active, tweets_per_day, active_hours_start, active_hours_end, force_run).
- **Functions:**  
  - `log_tweet(topic, tweet_text, tweet_id)` – called by **Twitter Poster** after a successful post.  
  - `get_bot_config()` – used by API and scheduler.  
  - `turn_off_force_run()` – after a manual “Post Now” run.

So in the **human flow**: after we can “run one cycle,” we add **where to store results and config**, and we plug that into the last tool (poster) and into the API.

---

## 12. Expose an API Layer

**Decision:** The dashboard (and maybe external monitors) need to:

- Trigger a run
- Get status (agent ready, config)
- Get tweets list and stats
- Update config

So we add a **REST API** in front of the Agent Service and DB.

**Stack:** **FastAPI** (`api/main.py`, `api/routes.py`).

**Endpoints (flow as a human would expect):**

| Endpoint            | Purpose                          |
|---------------------|----------------------------------|
| `GET /api/health`   | Is the server and agent up?      |
| `GET /api/status`   | Bot config + agent_ready         |
| `POST /api/run-agent` | Run one cycle (manual trigger) |
| `GET /api/tweets`   | List recent tweets from DB       |
| `GET /api/stats`    | Counts: today, week, month      |
| `PUT /api/config`   | Update is_active, frequency, hours |

**Flow:**  
- `POST /api/run-agent` → call `agent_service.run_agent_cycle()` → return success/tweet_id/error.  
- Other endpoints read from `agent_service.get_status()` or from `db_handler` (Firestore).

So the **human flow** is: “I have a working agent and DB; now I expose triggers and read-only/update operations via API.”

---

## 13. Build the Dashboard

**Decision:** A human needs a **single place** to:

- See if the system is healthy (API + agent).
- See recent tweets (from `/api/tweets`).
- Trigger a run (“Post Now”) via `/api/run-agent`.
- See and change config (active/paused, tweets per day, active hours) via `/api/status` and `/api/config`.

**Stack:** **React + Vite** (`news-dashboard/`).

**Flow:**

1. **App load:**  
   - Call `GET /api/health` and `GET /api/status` (e.g. in `useApiHealth`, `useApiStatus`).
2. **Live feed:**  
   - `TweetFeed` fetches `GET /api/tweets` and shows list; optional refresh/polling.
3. **Post Now:**  
   - Button → `POST /api/run-agent` → show success/error and refresh feed.
4. **Settings:**  
   - `SettingsPanel` loads config from status, sends updates via `PUT /api/config`.

So the **human flow** is: “I have an API; now I build a UI that calls it so I can monitor and control the agent without touching the backend.”

---

## 14. Add Scheduling (Optional)

**Decision:** Besides manual “Post Now,” we want the agent to run **automatically** on a schedule (e.g. N times per day within active hours).

**Option A – Same process as API:**  
A background loop (e.g. in `main.py` or a worker) that:

- Every few seconds/minutes: read `get_bot_config()`.
- If `force_run` is true → run one cycle, then `turn_off_force_run()` (handles “Post Now” from dashboard).
- If `is_active` is false or outside active hours → sleep and re-check.
- If inside active hours and it’s “time for next tweet” (based on `tweets_per_day` and last run) → run one cycle and schedule next run.

**Option B – Separate worker:**  
A separate process (e.g. `main.py` Flask/worker) that only does this loop and shares the same DB config; the FastAPI app only serves the API.  
(Your repo has both: FastAPI for API, and `main.py` for a legacy Flask + scheduler loop.)

So in the **human flow**: after “manual run works,” we add **“run on a timer using the same config the dashboard writes.”**

---

## 15. End-to-End Flow Summary

In **creation order**, a human builds this system as follows:

1. **Goal** – “Autonomous news → tweet agent.”
2. **Data** – Google News RSS → News Scraper tool.
3. **AI** – Groq (Llama 3.3 70B) → model adapter; used by Selector, Writer, Hashtags.
4. **Pipeline** – 6 steps designed in order: Scraper → Selector → Writer → Hashtags → Assembler → Poster.
5. **Base tool** – Single contract: `run(input_text)` → string.
6. **Tools** – Implement each step as a tool (same order as pipeline).
7. **Registry** – Register tools by name so the controller can look them up.
8. **Planner** – LLM turns a user query into a JSON plan (list of tool calls).
9. **Controller** – Executes plan step by step, passing “previous output” as input.
10. **Agent Service** – Wires planner + controller + registry; one method = one full cycle.
11. **Database** – Firestore for tweets and bot_config; poster logs tweets; API and scheduler read/update config.
12. **API** – FastAPI: health, status, run-agent, tweets, stats, config.
13. **Dashboard** – React: monitor, “Post Now,” view tweets, change settings.
14. **Scheduling** – Optional loop (same or separate process) that runs the agent on a timer using DB config.

**Runtime flow (when a cycle runs):**

```
User or Timer triggers
    → API: POST /api/run-agent (or scheduler calls agent_service.run_agent_cycle())
    → Agent Service: user query
    → Planner: plan (JSON steps)
    → Controller: for each step, registry.get(tool_name).run(input)
        → Scraper → Selector → Writer → Hashtags → Assembler → Poster
    → Poster posts to Twitter and logs to Firestore
    → Service returns { success, tweet_id, ... }
    → Dashboard can show new tweet and updated stats
```

This document reflects the **complete flow of the app in the order a human would create such an agent**, from goal to running system.
