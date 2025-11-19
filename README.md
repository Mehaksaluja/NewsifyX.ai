Yeh rahi ekdum **concise aur professional** `README.md` file. Isme sab zaroori baatein hain par faltu ki kahani nahi hai.

Apne `AI_News_System` folder ke root mein `README.md` banao aur yeh paste kar do:

````markdown
# 🤖 Autonomous AI Newsroom

> **A hybrid edge-cloud AI system that curates global news and broadcasts to X (Twitter) autonomously.**

![Status](https://img.shields.io/badge/Status-Operational-success)
![AI Engine](https://img.shields.io/badge/AI-Ollama%20(Local)-orange)
![Stack](https://img.shields.io/badge/Stack-Python%20%2B%20React%20%2B%20Firebase-blue)

## 💡 What is this?
This is a fully automated "digital journalist". It runs on my local machine (**Edge Node**) to process news using **Local LLMs (Zero Cost)** and syncs with a **Cloud Dashboard** for real-time monitoring and remote control.

## 🧠 Architecture

```mermaid
graph TD
    A[News Scraper] -->|Raw Data| B(AI Editor)
    B -->|Selection| C{AI Writer}
    C -->|Draft| D[Hashtag Gen]
    D -->|Final Tweet| E[Broadcaster]
    E -->|POST| F(X / Twitter API)
    E -->|LOG| G[(Firebase Cloud DB)]
    G <-->|Sync| H[React Dashboard]
````

## ✨ Key Features

  * **🕵️‍♂️ Edge AI Processing:** Uses **Ollama (Qwen 2.5)** locally. No API costs.
  * **📱 Remote Mission Control:** A **React + Vite** dashboard deployed on Vercel to Start/Stop the bot remotely via Firebase.
  * **✍️ Context-Aware:** Reads full news summaries to generate accurate tweets and relevant hashtags.
  * **🛡️ Self-Healing:** Automatically retries on network failures or API limits.

## 🚀 Quick Start

### 1\. Backend (Python Agent)

```bash
cd autonomous_tweet_agent
python -m venv venv
# Activate venv and install deps
pip install -r requirements.txt
# Run the Agent
python main.py
```

*Note: Requires `.env` with X API Keys and `firebase_key.json`.*

### 2\. Frontend (Dashboard)

```bash
cd news-dashboard
npm install
npm run dev
```

-----

**Developed by Mehak Saluja**

```
```