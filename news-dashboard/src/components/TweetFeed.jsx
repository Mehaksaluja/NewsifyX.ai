import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Activity, ExternalLink, RefreshCw, AlertCircle, Inbox } from 'lucide-react';

const TweetFeed = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadTweets = async (isRetry = false) => {
    try {
      if (!isRetry) setLoading(true);
      setError(null);

      const result = await apiService.getTweets(10);

      if (result.success) {
        setTweets(result.data.tweets || []);
        setLastRefresh(new Date());
        setRetryCount(0);
      } else {
        throw new Error(result.error || 'Failed to load tweets');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading tweets:', err);
      setError(
        err.message ||
          'Cannot connect to API. Check VITE_API_URL and ensure the backend is running.'
      );
      setLoading(false);

      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          loadTweets(true);
        }, 5000);
      }
    }
  };

  useEffect(() => {
    loadTweets();
    const interval = setInterval(() => loadTweets(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRetryCount(0);
    loadTweets();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const truncateTopic = (topic, max = 48) => {
    if (!topic) return 'News update';
    return topic.length > max ? `${topic.slice(0, max)}…` : topic;
  };

  return (
    <section className="glass-card feed-card" aria-label="Live activity feed">
      <div className="panel-header">
        <div className="panel-header__left">
          <div className="panel-header__icon">
            <Activity size={16} />
          </div>
          <div>
            <h2 className="panel-title panel-title--lg">Live activity</h2>
            <p className="feed-meta" style={{ margin: '4px 0 0' }}>
              Auto-refreshes every 30s
            </p>
          </div>
        </div>
        <div className="feed-toolbar">
          {lastRefresh && !error && (
            <span className="feed-meta">{lastRefresh.toLocaleTimeString()}</span>
          )}
          <button
            type="button"
            className={`icon-btn ${loading ? 'icon-btn--spin' : ''}`}
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh feed"
            aria-label="Refresh feed"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div className="alert__title">Connection error</div>
            <div>{error}</div>
            {retryCount > 0 && retryCount < 3 && (
              <div className="hint-text" style={{ textAlign: 'left', marginTop: 8 }}>
                Retrying… ({retryCount}/3)
              </div>
            )}
            {retryCount >= 3 && (
              <div className="hint-text" style={{ textAlign: 'left', marginTop: 8 }}>
                Max retries reached. Use refresh to try again.
              </div>
            )}
          </div>
        </div>
      )}

      {loading && tweets.length === 0 ? (
        <div className="skeleton-list" aria-busy="true" aria-label="Loading tweets">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : !loading && tweets.length === 0 && !error ? (
        <div className="state-box">
          <Inbox size={48} className="state-box__icon" />
          <p className="state-box__title">No broadcasts yet</p>
          <p className="state-box__desc">
            Posted tweets will appear here once the agent completes its first cycle.
          </p>
        </div>
      ) : (
        <div className="tweet-list" style={{ opacity: loading ? 0.65 : 1, transition: 'opacity 0.3s' }}>
          {tweets.map((tweet) => (
            <article key={tweet.id || tweet.tweet_id} className="tweet-card">
              <div className="tweet-card__avatar" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div className="tweet-card__body">
                <div className="tweet-card__meta">
                  <span className="tweet-topic">{truncateTopic(tweet.topic)}</span>
                  <time className="tweet-time" dateTime={tweet.created_at || tweet.timestamp}>
                    {formatDate(tweet.created_at || tweet.timestamp)}
                  </time>
                </div>
                <p className="tweet-text">{tweet.tweet_text || tweet.text || 'No content'}</p>
                {tweet.tweet_id && (
                  <a
                    href={`https://x.com/i/web/status/${tweet.tweet_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tweet-link"
                  >
                    View on X <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default TweetFeed;
