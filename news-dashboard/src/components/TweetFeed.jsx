import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Activity, ExternalLink, Twitter } from 'lucide-react';

const TweetFeed = () => {
  const [tweets, setTweets] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "tweets"),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tweetData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTweets(tweetData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="panel" style={{minHeight: '500px'}}>
      <div className="panel-header">
        <Activity size={14} /> Live Activity Log
      </div>

      {tweets.length === 0 ? (
        <div style={{padding:'40px', textAlign:'center', color:'#333'}}>
            No activity recorded yet.
        </div>
      ) : (
        tweets.map((tweet) => (
          <div key={tweet.id} className="tweet-item">
            <div className="tweet-avatar">
                <Twitter size={20} />
            </div>
            <div className="tweet-content">
                <div className="tweet-meta">
                    <span className="tweet-topic-badge">{tweet.topic ? tweet.topic.substring(0, 50) + "..." : "Update"}</span>
                    <span style={{fontSize:'0.8rem', color:'#52525b'}}>{tweet.created_at}</span>
                </div>
                
                <div className="tweet-body">
                    {tweet.tweet_text}
                </div>

                <div className="tweet-actions">
                    <a 
                      href={`https://x.com/i/web/status/${tweet.tweet_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="action-link"
                    >
                      View Live Post <ExternalLink size={12}/>
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