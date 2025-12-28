import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Activity, ExternalLink, Twitter, RefreshCw, AlertCircle } from 'lucide-react';

const TweetFeed = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth <= 480);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsSmallMobile(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadTweets = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
      }
      setError(null);
      
      const result = await apiService.getTweets(10);
      
      if (result.success) {
        const tweetData = result.data.tweets || [];
        setTweets(tweetData);
        setLastRefresh(new Date());
        setRetryCount(0);
      } else {
        throw new Error(result.error || 'Failed to load tweets');
      }
      setLoading(false);
    } catch (err) {
      console.error("Error loading tweets:", err);
      const errorMessage = err.message || "Cannot connect to API. Please check VITE_API_URL in .env file and ensure backend is running.";
      setError(errorMessage);
      setLoading(false);
      
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
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
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="panel" style={{minHeight: isMobile ? '400px' : '500px'}}>
      <div className="panel-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <Activity size={14} /> Live Activity Log
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          {lastRefresh && !error && (
            <span style={{
              fontSize: '0.7rem',
              color: '#a1a1aa',
              whiteSpace: 'nowrap'
            }}>
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: loading ? '#52525b' : '#a1a1aa',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s',
              opacity: loading ? 0.5 : 1
            }}
            title="Refresh"
          >
            <RefreshCw size={14} style={{animation: loading ? 'spin 1s linear infinite' : 'none'}} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: isSmallMobile ? '12px' : '14px',
          marginBottom: '16px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '10px',
          color: '#ef4444',
          fontSize: isSmallMobile ? '0.8rem' : '0.875rem',
          wordWrap: 'break-word',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)'
        }}>
          <AlertCircle size={isSmallMobile ? 18 : 20} style={{flexShrink: 0, marginTop: '2px'}} />
          <div style={{flex: 1, lineHeight: '1.5'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px'}}>
              <strong style={{fontSize: isSmallMobile ? '0.85rem' : '0.9rem'}}>Connection Error</strong>
            </div>
            <div style={{fontSize: isSmallMobile ? '0.75rem' : '0.8rem', opacity: 0.95, marginBottom: retryCount > 0 ? '8px' : '0'}}>
              {error}
            </div>
            {retryCount > 0 && retryCount < 3 && (
              <div style={{
                fontSize: '0.75rem',
                marginTop: '8px',
                padding: '6px 10px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '6px',
                display: 'inline-block'
              }}>
                Retrying... ({retryCount}/3)
              </div>
            )}
            {retryCount >= 3 && (
              <div style={{
                fontSize: '0.75rem',
                marginTop: '8px',
                padding: '6px 10px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '6px',
                display: 'inline-block'
              }}>
                Max retries reached. Click refresh to try again.
              </div>
            )}
          </div>
        </div>
      )}

      {loading && tweets.length === 0 ? (
        <div style={{
          padding: isSmallMobile ? '30px 20px' : '40px',
          textAlign: 'center',
          color: '#333'
        }}>
          <div style={{marginBottom: '10px'}}>
            <RefreshCw size={24} style={{animation: 'spin 1s linear infinite', display: 'inline-block'}} />
          </div>
          Loading tweets...
        </div>
      ) : !loading && tweets.length === 0 && !error ? (
        <div style={{
          padding: isSmallMobile ? '30px 20px' : '40px',
          textAlign: 'center',
          color: '#333'
        }}>
          <AlertCircle size={32} style={{marginBottom: '12px', opacity: 0.5, display: 'block', margin: '0 auto 12px'}} />
          No activity recorded yet.
          <div style={{fontSize: '0.85rem', color: '#666', marginTop: '8px'}}>
            Tweets will appear here once the agent posts.
          </div>
        </div>
      ) : (
        <div style={{opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s'}}>
          {tweets.map((tweet) => (
            <div key={tweet.id || tweet.tweet_id} className="tweet-item">
              <div className="tweet-avatar">
                <Twitter size={isSmallMobile ? 18 : 20} />
              </div>
              <div className="tweet-content">
                <div className="tweet-meta">
                  <span className="tweet-topic-badge" style={{
                    maxWidth: isSmallMobile ? '60%' : 'none'
                  }}>
                    {tweet.topic ? (isSmallMobile ? tweet.topic.substring(0, 30) + "..." : tweet.topic.substring(0, 50) + "...") : "Update"}
                  </span>
                  <span style={{
                    fontSize: isSmallMobile ? '0.75rem' : '0.8rem',
                    color: '#52525b',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatDate(tweet.created_at || tweet.timestamp)}
                  </span>
                </div>
                
                <div className="tweet-body" style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  {tweet.tweet_text || tweet.text || 'No content'}
                </div>

                {tweet.tweet_id && (
                  <div className="tweet-actions">
                    <a 
                      href={`https://x.com/i/web/status/${tweet.tweet_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="action-link"
                      style={{
                        minHeight: isSmallMobile ? '36px' : 'auto',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      View Live Post <ExternalLink size={isSmallMobile ? 10 : 12}/>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TweetFeed;