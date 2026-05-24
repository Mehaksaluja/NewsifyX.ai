import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useApiStatus } from '../hooks/useApi';
import {
  Sliders,
  Power,
  Zap,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const SettingsPanel = () => {
  const [config, setConfig] = useState({
    is_active: true,
    tweets_per_day: 4,
    active_hours_start: 9,
    active_hours_end: 22,
    force_run: false,
  });
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [postedTweet, setPostedTweet] = useState(null);
  const { online } = useApiStatus();
  const [modalState, setModalState] = useState('idle');

  useEffect(() => {
    loadConfig();
    const interval = setInterval(loadConfig, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
    try {
      setConnectionError(null);
      const result = await apiService.getStatus();

      if (result.success) {
        const data = result.data;
        setConfig({
          is_active: data.is_active,
          tweets_per_day: data.tweets_per_day,
          active_hours_start: data.active_hours_start,
          active_hours_end: data.active_hours_end,
          force_run: data.force_run || false,
        });

        if (modalState === 'processing' && !data.force_run) {
          setModalState('success');
        }
      } else {
        setConnectionError(result.error || 'Failed to load configuration');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading config:', error);
      setConnectionError(
        'Failed to connect to API. Check VITE_API_URL and ensure the backend is running.'
      );
      setLoading(false);
    }
  };

  const updateConfig = async (key, value) => {
    if (updating) return;

    setUpdating(true);
    setConnectionError(null);

    try {
      const result = await apiService.updateConfig({ [key]: value });

      if (result.success) {
        setConfig((prev) => ({ ...prev, [key]: value }));
      } else {
        setConnectionError(result.error || 'Failed to update configuration');
        setTimeout(() => setConnectionError(null), 5000);
      }
    } catch (error) {
      console.error('Error updating config:', error);
      setConnectionError('Network error. Please try again.');
      setTimeout(() => setConnectionError(null), 5000);
    } finally {
      setUpdating(false);
    }
  };

  const handleTriggerClick = () => {
    if (!online) {
      setConnectionError('API server is offline. Start the backend first.');
      return;
    }
    setModalState('confirm');
  };

  const confirmPost = async () => {
    setModalState('processing');
    setConnectionError(null);
    setPostedTweet(null);

    try {
      const result = await apiService.runAgent();

      if (result.success) {
        const tweetId = result.data?.tweet_id;

        if (!tweetId) {
          setConnectionError(
            'Tweet was not posted. No tweet ID returned — posting may have failed.'
          );
          setModalState('error');
          return;
        }

        try {
          const tweetsResult = await apiService.getTweets(1);
          if (tweetsResult.success && tweetsResult.data?.tweets?.length > 0) {
            const latestTweet = tweetsResult.data.tweets[0];
            if (latestTweet.tweet_id === tweetId || latestTweet.id) {
              setPostedTweet(latestTweet);
            }
          }
        } catch (e) {
          console.log('Could not fetch tweet details:', e);
        }
        setModalState('success');
      } else {
        setConnectionError(result.error || 'Failed to trigger agent');
        setModalState('error');
      }
    } catch (error) {
      console.error('Error triggering post:', error);
      let errorMsg = error.message || 'Failed to trigger agent. Please try again.';

      if (error.message?.includes('detail')) {
        try {
          const errorData = JSON.parse(error.message);
          errorMsg = errorData.detail || error.message;
        } catch {
          const detailMatch = error.message.match(/detail["\s:]*["']?([^"'}]+)["']?/i);
          if (detailMatch?.[1]) errorMsg = detailMatch[1];
        }
      }

      setConnectionError(errorMsg);
      setModalState('error');
    }
  };

  const closeModal = () => setModalState('idle');

  if (loading) {
    return (
      <div className="glass-card">
        <div className="state-box" style={{ padding: '40px 20px' }}>
          <div className="spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
          <p className="state-box__desc">Connecting to API…</p>
        </div>
      </div>
    );
  }

  const triggerDisabled = !online || updating || modalState === 'processing' || config.force_run;
  const powerDisabled = !online || updating;

  return (
    <>
      <div className="glass-card">
        <div className="panel-header">
          <div className="panel-header__left">
            <div className="panel-header__icon">
              <Sliders size={16} />
            </div>
            <h2 className="panel-title panel-title--lg">Agent controls</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              setLoading(true);
              loadConfig();
            }}
            title="Refresh config"
            aria-label="Refresh config"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {!online && (
          <div className="alert alert--warning" role="status">
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>API offline</strong> — Start the FastAPI backend to enable controls.
            </div>
          </div>
        )}

        {connectionError && modalState === 'idle' && (
          <div className="alert alert--error" role="alert">
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div className="alert__title">Error</div>
              {connectionError}
            </div>
            <button
              type="button"
              className="alert__dismiss"
              onClick={() => setConnectionError(null)}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="control-section">
          <button
            type="button"
            className="btn-trigger"
            onClick={handleTriggerClick}
            disabled={triggerDisabled}
          >
            <Zap size={18} fill={modalState === 'processing' || config.force_run ? 'currentColor' : 'none'} />
            {modalState === 'processing'
              ? 'Processing…'
              : config.force_run
                ? 'Agent working…'
                : 'Trigger post now'}
          </button>
          {!online && <p className="hint-text">Backend required for manual trigger</p>}
        </div>

        <div className="control-section">
          <button
            type="button"
            className={`btn-power ${config.is_active ? 'btn-power--on' : 'btn-power--off'}`}
            onClick={() => updateConfig('is_active', !config.is_active)}
            disabled={powerDisabled}
          >
            <Power size={18} />
            {updating ? 'Updating…' : config.is_active ? 'System online' : 'System paused'}
          </button>
        </div>

        <div>
          <div className="label-row">
            <span>Posting frequency</span>
            <span className="label-row__value">{config.tweets_per_day} / day</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={config.tweets_per_day}
            onChange={(e) => updateConfig('tweets_per_day', parseInt(e.target.value, 10))}
            disabled={powerDisabled}
            aria-label="Tweets per day"
          />
        </div>
      </div>

      {modalState === 'confirm' && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="modal-card">
            <div className="modal-icon">
              <AlertTriangle size={28} />
            </div>
            <h3 id="confirm-title" className="modal-title">
              Deploy agent?
            </h3>
            <p className="modal-desc">
              The AI will find news and post immediately, overriding the normal schedule.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmPost}>
                Post now
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState === 'processing' && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-busy="true">
          <div className="modal-card">
            <div className="spinner" />
            <h3 className="modal-title">Agent is working</h3>
            <p className="modal-desc">
              Finding news, writing the tweet, and generating hashtags. This takes about 20–30 seconds.
            </p>
          </div>
        </div>
      )}

      {modalState === 'error' && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--wide">
            <div className="modal-icon modal-icon--error">
              <AlertTriangle size={28} />
            </div>
            <h3 className="modal-title" style={{ color: 'var(--danger)' }}>
              Something went wrong
            </h3>
            <div className="alert alert--error" style={{ textAlign: 'left', marginBottom: 0 }}>
              {connectionError || 'An unknown error occurred'}
            </div>
            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setModalState('idle');
                  setConnectionError(null);
                }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-cancel"
                onClick={() => {
                  setModalState('idle');
                  setConnectionError(null);
                  setTimeout(handleTriggerClick, 100);
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState === 'success' && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--wide">
            <div className="modal-icon modal-icon--success">
              <CheckCircle size={28} />
            </div>
            <h3 className="modal-title">Tweet posted</h3>

            {postedTweet ? (
              <div className="modal-tweet-preview">
                <div className="tweet-card__meta" style={{ marginBottom: 12 }}>
                  <span className="tweet-topic">{postedTweet.topic || 'News update'}</span>
                  <span className="tweet-time">{postedTweet.created_at || 'Just now'}</span>
                </div>
                <p className="tweet-text" style={{ marginBottom: 14 }}>
                  {postedTweet.tweet_text || 'Tweet content'}
                </p>
                {postedTweet.tweet_id && (
                  <a
                    href={`https://x.com/i/web/status/${postedTweet.tweet_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tweet-link"
                  >
                    <ExternalLink size={14} /> View on X
                  </a>
                )}
              </div>
            ) : (
              <p className="modal-desc">Your agent successfully broadcast the update to X.</p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setModalState('idle');
                  setPostedTweet(null);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPanel;
