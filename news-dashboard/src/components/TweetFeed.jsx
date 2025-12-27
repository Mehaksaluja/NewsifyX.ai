import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Activity, ExternalLink, Twitter } from 'lucide-react';

const TweetFeed = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsSmallMobile(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "tweets"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        setError(null);
        const tweetData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTweets(tweetData);
        setLoading(false);
      },
      (err) => {
        console.error("Firebase connection error in TweetFeed:", err);
        setError("Cannot connect to Firebase. Please check your connection.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="panel" style={{minHeight: isMobile ? '400px' : '500px'}}>
      <div className="panel-header">
        <Activity size={14} /> Live Activity Log
      </div>

      {error && (
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
          <strong>Connection Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div style={{
          padding: isSmallMobile ? '30px 20px' : '40px',
          textAlign: 'center',
          color: '#333'
        }}>
            Loading tweets...
        </div>
      ) : tweets.length === 0 ? (
        <div style={{
          padding: isSmallMobile ? '30px 20px' : '40px',
          textAlign: 'center',
          color: '#333'
        }}>
            No activity recorded yet.
        </div>
      ) : (
        tweets.map((tweet) => (
          <div key={tweet.id} className="tweet-item">
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
                      {tweet.created_at}
                    </span>
                </div>
                
                <div className="tweet-body" style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                    {tweet.tweet_text}
                </div>

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
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TweetFeed;