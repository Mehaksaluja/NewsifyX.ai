import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useApiStatus } from '../hooks/useApi';
import { Sliders, Power, Clock, Zap, AlertTriangle, CheckCircle, X, RefreshCw, ExternalLink } from 'lucide-react';

const SettingsPanel = () => {
  const [config, setConfig] = useState({
    is_active: true,
    tweets_per_day: 4,
    active_hours_start: 9,
    active_hours_end: 22,
    force_run: false
  });
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth <= 480);
  const [updating, setUpdating] = useState(false);
  const [postedTweet, setPostedTweet] = useState(null);

  const { online, error: apiError } = useApiStatus();
  const [modalState, setModalState] = useState('idle');

  useEffect(() => {
    const handleResize = () => setIsSmallMobile(window.innerWidth <= 480);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          force_run: data.force_run || false
        });
        
        if (modalState === 'processing' && !data.force_run) {
          setModalState('success');
        }
      } else {
        setConnectionError(result.error || 'Failed to load configuration');
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading config:", error);
      setConnectionError("Failed to connect to API. Please check if the backend server is running.");
      setLoading(false);
    }
  };

  const updateConfig = async (key, value) => {
    if (updating) return;
    
    setUpdating(true);
    setConnectionError(null);
    
    try {
      const updateData = { [key]: value };
      const result = await apiService.updateConfig(updateData);
      
      if (result.success) {
        setConfig(prev => ({ ...prev, [key]: value }));
      } else {
        setConnectionError(result.error || 'Failed to update configuration');
        setTimeout(() => setConnectionError(null), 5000);
      }
    } catch (error) {
      console.error("Error updating config:", error);
      setConnectionError("Network error. Please try again.");
      setTimeout(() => setConnectionError(null), 5000);
    } finally {
      setUpdating(false);
    }
  };

  const handleTriggerClick = () => {
    if (!online) {
      setConnectionError("API server is offline. Please start the backend server.");
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
        if (tweetId) {
          try {
            const tweetsResult = await apiService.getTweets(1);
            if (tweetsResult.success && tweetsResult.data?.tweets?.length > 0) {
              const latestTweet = tweetsResult.data.tweets[0];
              if (latestTweet.tweet_id === tweetId || latestTweet.id) {
                setPostedTweet(latestTweet);
              }
            }
          } catch (e) {
            console.log("Could not fetch tweet details:", e);
          }
        }
        setModalState('success');
      } else {
        const errorMsg = result.error || 'Failed to trigger agent';
        setConnectionError(errorMsg);
        setModalState('error');
      }
    } catch (error) {
      console.error("Error triggering post:", error);
      const errorMsg = error.message || "Failed to trigger agent. Please try again.";
      setConnectionError(errorMsg);
      setModalState('error');
    }
  };

  const closeModal = () => {
    setModalState('idle');
  };

  const handleRefresh = () => {
    setLoading(true);
    loadConfig();
  };

  if (loading) {
    return (
      <div className="panel">
        <div style={{padding: '40px', textAlign: 'center', color: '#333'}}>
          Connecting to API...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="panel">
        <div className="panel-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <Sliders size={14} /> Configuration
          </div>
          <button
            onClick={handleRefresh}
            style={{
              background: 'none',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s'
            }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {!online && (
          <div style={{
            padding: isSmallMobile ? '10px' : '12px',
            marginBottom: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: isSmallMobile ? '0.8rem' : '0.85rem',
            wordWrap: 'break-word'
          }}>
            <strong>API Offline:</strong> Backend server is not reachable. Please start the API server.
          </div>
        )}

        {connectionError && (
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
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)'
          }}>
            <div style={{flex: 1, lineHeight: '1.5'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px'}}>
                <AlertTriangle size={isSmallMobile ? 16 : 18} />
                <strong style={{fontSize: isSmallMobile ? '0.85rem' : '0.9rem'}}>Error</strong>
              </div>
              <div style={{marginLeft: isSmallMobile ? '24px' : '26px', fontSize: isSmallMobile ? '0.75rem' : '0.8rem', opacity: 0.95}}>
                {connectionError}
              </div>
            </div>
            <button
              onClick={() => setConnectionError(null)}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                fontSize: '18px',
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '24px',
                minHeight: '24px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
            >
              <X size={14} />
            </button>
          </div>
        )}


        <div className="control-group" style={{borderBottom:'1px solid #262626', paddingBottom:'20px'}}>
          <button 
            className="power-btn"
            style={{
              background: 'rgba(59, 130, 246, 0.1)', 
              color: '#3b82f6', 
              borderColor: '#3b82f6',
              opacity: (!online || updating || modalState === 'processing') ? 0.6 : 1,
              cursor: (!online || updating || modalState === 'processing') ? 'not-allowed' : 'pointer'
            }}
            onClick={handleTriggerClick}
            disabled={!online || updating || modalState === 'processing' || config.force_run}
          >
            <Zap size={18} fill={modalState === 'processing' || config.force_run ? "currentColor" : "none"} /> 
            {modalState === 'processing' ? "PROCESSING..." : config.force_run ? "AGENT WORKING..." : "TRIGGER POST NOW"}
          </button>
          {!online && (
            <div style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '8px', textAlign: 'center'}}>
              Start backend server to enable
            </div>
          )}
        </div>

        <div className="control-group">
          <button 
            className={`power-btn ${config.is_active ? 'active' : 'inactive'}`}
            onClick={() => updateConfig('is_active', !config.is_active)}
            disabled={!online || updating}
            style={{
              opacity: (!online || updating) ? 0.6 : 1,
              cursor: (!online || updating) ? 'not-allowed' : 'pointer'
            }}
          >
            <Power size={18} />
            {updating ? "UPDATING..." : config.is_active ? "SYSTEM ONLINE" : "SYSTEM PAUSED"}
          </button>
        </div>

        <div className="control-group">
          <div className="label-row">
            <span>Frequency</span>
            <span style={{color:'#3b82f6'}}>{config.tweets_per_day}/day</span>
          </div>
          <input 
            type="range" min="1" max="12" 
            value={config.tweets_per_day}
            onChange={(e) => updateConfig('tweets_per_day', parseInt(e.target.value))}
            disabled={!online || updating}
            style={{
              opacity: (!online || updating) ? 0.6 : 1,
              cursor: (!online || updating) ? 'not-allowed' : 'pointer'
            }}
          />
        </div>
      </div>

      {modalState === 'confirm' && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon">
              <AlertTriangle size={30} />
            </div>
            <div className="modal-title">Deploy Agent?</div>
            <div className="modal-desc">
              This will force the AI to find news and post immediately. It overrides the schedule.
            </div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn btn-confirm" onClick={confirmPost}>Yes, Post Now</button>
            </div>
          </div>
        </div>
      )}

      {modalState === 'processing' && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="spinner"></div>
            <div className="modal-title">Agent is Working...</div>
            <div className="modal-desc">
              Finding news, writing tweet, and generating hashtags. Please wait (approx 20-30s).
            </div>
          </div>
        </div>
      )}

      {modalState === 'error' && (
        <div className="modal-overlay">
          <div className="modal-card" style={{
            maxWidth: isSmallMobile ? '90%' : '400px',
            padding: isSmallMobile ? '20px 16px' : '30px'
          }}>
            <div className="modal-icon" style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              width: isSmallMobile ? '50px' : '60px',
              height: isSmallMobile ? '50px' : '60px'
            }}>
              <AlertTriangle size={isSmallMobile ? 24 : 30} />
            </div>
            <div className="modal-title" style={{
              color: '#ef4444',
              fontSize: isSmallMobile ? '1.1rem' : '1.25rem',
              marginTop: '16px'
            }}>Error</div>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: isSmallMobile ? '14px' : '16px',
              marginTop: '20px',
              color: '#ef4444',
              fontSize: isSmallMobile ? '0.8rem' : '0.875rem',
              wordBreak: 'break-word',
              textAlign: 'left',
              maxHeight: '250px',
              overflowY: 'auto',
              lineHeight: '1.5'
            }}>
              {connectionError || 'An unknown error occurred'}
            </div>
            <div className="modal-actions" style={{
              marginTop: '24px',
              gap: '12px',
              flexDirection: isSmallMobile ? 'column' : 'row'
            }}>
              <button 
                className="btn btn-confirm" 
                onClick={() => {
                  setModalState('idle');
                  setConnectionError(null);
                }}
                style={{
                  width: isSmallMobile ? '100%' : 'auto',
                  minWidth: isSmallMobile ? 'auto' : '100px'
                }}
              >
                Close
              </button>
              <button 
                className="btn btn-cancel" 
                onClick={() => {
                  setModalState('idle');
                  setConnectionError(null);
                  setTimeout(() => handleTriggerClick(), 100);
                }}
                style={{
                  width: isSmallMobile ? '100%' : 'auto',
                  minWidth: isSmallMobile ? 'auto' : '100px'
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState === 'success' && (
        <div className="modal-overlay">
          <div className="modal-card" style={{
            maxWidth: isSmallMobile ? '90%' : '450px',
            padding: isSmallMobile ? '20px 16px' : '30px'
          }}>
            <div className="modal-icon success">
              <CheckCircle size={isSmallMobile ? 28 : 30} />
            </div>
            <div className="modal-title" style={{fontSize: isSmallMobile ? '1.1rem' : '1.25rem'}}>
              Tweet Posted Successfully!
            </div>
            
            {postedTweet && (
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #262626',
                borderRadius: '12px',
                padding: isSmallMobile ? '14px' : '18px',
                marginTop: '20px',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #262626'
                }}>
                  <span style={{
                    fontSize: isSmallMobile ? '0.75rem' : '0.8rem',
                    color: '#3b82f6',
                    fontWeight: 600
                  }}>
                    {postedTweet.topic || 'News Update'}
                  </span>
                  <span style={{
                    fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                    color: '#52525b'
                  }}>
                    {postedTweet.created_at || 'Just now'}
                  </span>
                </div>
                <div style={{
                  color: '#ededed',
                  fontSize: isSmallMobile ? '0.875rem' : '0.9rem',
                  lineHeight: '1.6',
                  wordBreak: 'break-word',
                  marginBottom: '16px'
                }}>
                  {postedTweet.tweet_text || 'Tweet content'}
                </div>
                {postedTweet.tweet_id && (
                  <a
                    href={`https://x.com/i/web/status/${postedTweet.tweet_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontSize: isSmallMobile ? '0.8rem' : '0.85rem',
                      padding: '8px 12px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                    }}
                  >
                    <ExternalLink size={14} />
                    View on X
                  </a>
                )}
              </div>
            )}
            
            {!postedTweet && (
              <div className="modal-desc" style={{marginBottom: '20px'}}>
                Your AI agent has successfully broadcasted the update to X.
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className="btn btn-confirm" 
                onClick={() => {
                  setModalState('idle');
                  setPostedTweet(null);
                }}
                style={{
                  width: isSmallMobile ? '100%' : 'auto',
                  minWidth: isSmallMobile ? 'auto' : '120px'
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