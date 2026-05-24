import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  X,
  Zap,
  Settings,
  Activity,
  Clock,
  Power,
  RefreshCw,
} from 'lucide-react';

const HowToUse = ({ onClose }) => {
  const [expandedSection, setExpandedSection] = useState('overview');

  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <BookOpen size={18} />,
      content: (
        <>
          <p>
            NEWSIFYX.AI is an autonomous system that curates global news, drafts engaging posts with
            Groq LLM, and broadcasts to X on your schedule.
          </p>
          <p style={{ marginTop: 12 }}>
            Use this dashboard to monitor activity, adjust frequency, and trigger manual posts.
          </p>
        </>
      ),
    },
    {
      id: 'getting-started',
      title: 'Getting started',
      icon: <Zap size={18} />,
      content: (
        <ol>
          <li>Start the FastAPI backend (<code>uvicorn api.main:app</code>)</li>
          <li>Set <code>VITE_API_URL</code> in <code>news-dashboard/.env</code></li>
          <li>Confirm API shows <strong>Online</strong> in System health</li>
          <li>Configure frequency and toggle <strong>System online</strong></li>
          <li>Use <strong>Trigger post now</strong> to test before going live</li>
        </ol>
      ),
    },
    {
      id: 'controls',
      title: 'Agent controls',
      icon: <Settings size={18} />,
      content: (
        <>
          <h4>System status</h4>
          <ul>
            <li><strong>System online</strong> — automatic scheduled posting</li>
            <li><strong>System paused</strong> — stops schedule; manual trigger still works</li>
          </ul>
          <h4>Frequency</h4>
          <p>Choose 1–12 tweets per day. Posts are spread across your active hours.</p>
          <h4>Manual trigger</h4>
          <p>Runs a full agent cycle immediately — scrape, select, write, hashtag, post.</p>
        </>
      ),
    },
    {
      id: 'live-feed',
      title: 'Live activity',
      icon: <Activity size={18} />,
      content: (
        <ul>
          <li>Last 10 posted tweets, newest first</li>
          <li>Topic, content, and timestamp for each</li>
          <li>Open any post on X via <strong>View on X</strong></li>
          <li>Auto-refresh every 30 seconds</li>
        </ul>
      ),
    },
    {
      id: 'posting',
      title: 'How posting works',
      icon: <Clock size={18} />,
      content: (
        <>
          <h4>Automatic flow</h4>
          <ol>
            <li>Scrape top news from RSS sources</li>
            <li>AI picks the most compelling story</li>
            <li>Write tweet + generate hashtags</li>
            <li>Post to X and log to Firebase</li>
          </ol>
          <h4>Active hours</h4>
          <p>
            By default the agent posts between 9 AM and 10 PM. Intervals are calculated from your
            frequency setting.
          </p>
        </>
      ),
    },
    {
      id: 'tips',
      title: 'Tips',
      icon: <Power size={18} />,
      content: (
        <ul>
          <li>Start with 2–4 tweets/day while tuning quality</li>
          <li>Review the live feed regularly</li>
          <li>Test with manual trigger before enabling automation</li>
          <li>Pause the system when you need a break from posting</li>
        </ul>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <RefreshCw size={18} />,
      content: (
        <>
          <h4 style={{ color: 'var(--danger)' }}>API offline</h4>
          <ul>
            <li>Ensure backend is running on the URL in <code>VITE_API_URL</code></li>
            <li>Check browser console (F12) for CORS or network errors</li>
          </ul>
          <h4 style={{ color: 'var(--danger)' }}>No tweets appearing</h4>
          <ul>
            <li>Confirm system is <strong>online</strong></li>
            <li>Current time must fall within active hours</li>
            <li>Try a manual trigger to verify the pipeline</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className="guide-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="guide-panel" role="dialog" aria-labelledby="guide-title">
        <header className="guide-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="panel-header__icon">
              <BookOpen size={18} />
            </div>
            <h1 id="guide-title">How to use NEWSIFYX.AI</h1>
          </div>
          <button type="button" className="btn-close-guide" onClick={onClose} aria-label="Close guide">
            <X size={18} />
          </button>
        </header>

        <div className="guide-sections">
          {sections.map((section) => {
            const isOpen = expandedSection === section.id;
            return (
              <div key={section.id} className="guide-section">
                <button
                  type="button"
                  className="guide-section__trigger"
                  onClick={() => setExpandedSection(isOpen ? null : section.id)}
                  aria-expanded={isOpen}
                >
                  <span className="guide-section__head">
                    <span className="guide-section__icon">{section.icon}</span>
                    {section.title}
                  </span>
                  <ChevronRight
                    size={18}
                    className={`guide-section__chevron ${isOpen ? 'guide-section__chevron--open' : ''}`}
                  />
                </button>
                {isOpen && <div className="guide-section__body">{section.content}</div>}
              </div>
            );
          })}
        </div>

        <div className="guide-footer">
          Need API details? Visit <code>/docs</code> on your backend URL.
        </div>
      </div>
    </div>
  );
};

export default HowToUse;
