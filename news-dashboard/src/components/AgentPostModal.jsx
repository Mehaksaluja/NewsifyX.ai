import React, { useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  X,
  Copy,
  ClipboardCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const X_COMPOSE_URL = 'https://twitter.com/intent/tweet';

const AgentPostModal = ({
  modalState,
  connectionError,
  postResult,
  postedTweet,
  copied,
  onClose,
  onConfirm,
  onRetry,
  onCopyTweet,
}) => {
  useEffect(() => {
    if (modalState === 'idle') {
      document.body.classList.remove('popup-open');
      return undefined;
    }
    document.body.classList.add('popup-open');
    return () => document.body.classList.remove('popup-open');
  }, [modalState]);

  if (modalState === 'idle') return null;

  const tweetBody = postedTweet?.tweet_text || postResult?.tweetText || '';
  const isManualPost =
    postResult?.manualPost ||
    postedTweet?.post_mode === 'manual' ||
    String(postedTweet?.tweet_id || '').startsWith('manual-');

  const xComposeUrl = tweetBody
    ? `${X_COMPOSE_URL}?text=${encodeURIComponent(tweetBody)}`
    : X_COMPOSE_URL;

  return (
    <ModalPortal>
      {modalState === 'confirm' && (
        <div className="popup-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="popup-backdrop" onClick={onClose} aria-hidden="true" />
          <div className="popup-card">
            <button type="button" className="popup-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
            <div className="popup-icon popup-icon--accent">
              <Sparkles size={26} />
            </div>
            <h2 id="confirm-title" className="popup-title">Run agent now?</h2>
            <p className="popup-desc">
              The AI will find breaking news, write a tweet, and attempt to publish it to X.
            </p>
            <div className="popup-actions">
              <button type="button" className="btn btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={onConfirm}>
                Start agent
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState === 'processing' && (
        <div className="popup-overlay" role="dialog" aria-modal="true" aria-busy="true">
          <div className="popup-backdrop" aria-hidden="true" />
          <div className="popup-card">
            <div className="spinner popup-spinner" />
            <h2 className="popup-title">Agent is working</h2>
            <p className="popup-desc">
              Scraping news, selecting a story, writing your tweet, and generating hashtags…
              <br />
              <span className="popup-desc-muted">Usually takes 20–30 seconds</span>
            </p>
          </div>
        </div>
      )}

      {modalState === 'error' && (
        <div className="popup-overlay" role="dialog" aria-modal="true">
          <div className="popup-backdrop" onClick={onClose} aria-hidden="true" />
          <div className="popup-card popup-card--wide">
            <button type="button" className="popup-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
            <div className="popup-icon popup-icon--error">
              <AlertTriangle size={26} />
            </div>
            <h2 className="popup-title popup-title--error">Something went wrong</h2>
            <div className="popup-error-box">{connectionError || 'An unknown error occurred'}</div>
            <div className="popup-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Close
              </button>
              <button type="button" className="btn btn-cancel" onClick={onRetry}>
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState === 'success' && (
        <div
          className={`popup-overlay ${isManualPost ? 'popup-overlay--manual' : ''}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="popup-backdrop" onClick={onClose} aria-hidden="true" />
          <div className={`popup-card popup-card--wide ${isManualPost ? 'popup-card--manual' : ''}`}>
            <button type="button" className="popup-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>

            <div className={`popup-icon ${isManualPost ? 'popup-icon--warning' : 'popup-icon--success'}`}>
              {isManualPost ? <AlertTriangle size={26} /> : <CheckCircle size={26} />}
            </div>

            <h2 className="popup-title">
              {isManualPost ? 'Tweet ready — post on X manually' : 'Posted to X successfully'}
            </h2>

            <p className="popup-desc">
              {postResult?.message ||
                (isManualPost
                  ? 'Your tweet was generated and saved. Copy it below, then publish on X.'
                  : 'Your agent broadcast the update to X.')}
            </p>

            {isManualPost && postResult?.instructions && (
              <ol className="popup-steps">
                {postResult.instructions.split('\n').map((line) => (
                  <li key={line}>{line.replace(/^\d+\.\s*/, '')}</li>
                ))}
              </ol>
            )}

            {tweetBody && (
              <div className="popup-tweet-box">
                <div className="popup-tweet-header">
                  {postedTweet?.topic && (
                    <span className="tweet-topic">{postedTweet.topic}</span>
                  )}
                  {isManualPost && <span className="manual-badge">Awaiting manual post</span>}
                </div>
                <p className="popup-tweet-text">{tweetBody}</p>
              </div>
            )}

            <div className="popup-actions popup-actions--stack">
              {isManualPost ? (
                <>
                  <button type="button" className="btn btn-primary btn-lg" onClick={onCopyTweet}>
                    {copied ? <ClipboardCheck size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied to clipboard!' : 'Copy tweet'}
                  </button>
                  <a
                    href={xComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-lg manual-open-x"
                  >
                    <ExternalLink size={18} /> Open X to post
                  </a>
                </>
              ) : (
                postedTweet?.tweet_id && (
                  <a
                    href={`https://x.com/i/web/status/${postedTweet.tweet_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg manual-open-x"
                  >
                    <ExternalLink size={18} /> View live post on X
                  </a>
                )
              )}
              <button type="button" className="btn btn-cancel" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalPortal>
  );
};

export default AgentPostModal;
