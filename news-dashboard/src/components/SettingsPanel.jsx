import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useApiStatus } from '../hooks/useApi';
import {
  Sliders,
  Power,
  Zap,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';
import AgentPostModal from './AgentPostModal';

const SettingsPanel = ({ onModalOpen }) => {
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
  const [postResult, setPostResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const { online } = useApiStatus();
  const [modalState, setModalState] = useState('idle');

  const openModal = (state) => {
    onModalOpen?.();
    setModalState(state);
  };

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
          openModal('success');
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
    openModal('confirm');
  };

  const confirmPost = async () => {
    openModal('processing');
    setConnectionError(null);
    setPostedTweet(null);
    setPostResult(null);
    setCopied(false);

    try {
      const result = await apiService.runAgent();

      if (result.success) {
        const data = result.data || {};
        const tweetId = data.tweet_id;

        if (!tweetId) {
          setConnectionError(
            'Tweet was not generated. No ID returned — the agent cycle may have failed.'
          );
          openModal('error');
          return;
        }

        setPostResult({
          manualPost: Boolean(data.manual_post),
          message: data.message,
          instructions: data.instructions,
          tweetText: data.tweet_text,
          tweetId,
        });

        let tweetForModal = null;

        try {
          const tweetsResult = await apiService.getTweets(1);
          if (tweetsResult.success && tweetsResult.data?.tweets?.length > 0) {
            const latestTweet = tweetsResult.data.tweets[0];
            if (latestTweet.tweet_id === tweetId || latestTweet.id) {
              tweetForModal = latestTweet;
            }
          }
        } catch (e) {
          console.log('Could not fetch tweet details:', e);
        }

        if (!tweetForModal && data.tweet_text) {
          tweetForModal = {
            topic: 'News update',
            tweet_text: data.tweet_text,
            tweet_id: tweetId,
            post_mode: data.manual_post ? 'manual' : 'api',
            created_at: 'Just now',
          };
        }

        setPostedTweet(tweetForModal);
        openModal('success');
      } else {
        setConnectionError(result.error || 'Failed to trigger agent');
        openModal('error');
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
      openModal('error');
    }
  };

  const closeModal = () => {
    setModalState('idle');
    setPostResult(null);
    setPostedTweet(null);
    setCopied(false);
  };

  const handleCopyTweet = async () => {
    const tweetBody = postedTweet?.tweet_text || postResult?.tweetText || '';
    if (!tweetBody) return;
    try {
      await navigator.clipboard.writeText(tweetBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setConnectionError('Could not copy to clipboard. Select the text and copy manually.');
    }
  };

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

      <AgentPostModal
        modalState={modalState}
        connectionError={connectionError}
        postResult={postResult}
        postedTweet={postedTweet}
        copied={copied}
        onClose={closeModal}
        onConfirm={confirmPost}
        onRetry={() => {
          closeModal();
          setTimeout(handleTriggerClick, 100);
        }}
        onCopyTweet={handleCopyTweet}
      />
    </>
  );
};

export default SettingsPanel;
