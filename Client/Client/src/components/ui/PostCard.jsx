import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Send, Calendar, ExternalLink } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import API from '../../api/axios';
import './PostCard.css';

/**
 * PostCard Component
 * A reusable component for displaying a social media post with interaction capabilities.
 * @param {Object} post - The post object from the database.
 * @param {Function} onUpdate - Optional callback to notify parent of state changes.
 */
export default function PostCard({ post: initialPost, onUpdate }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const isLiked = post?.likedBy?.includes(user?._id);

  const handleInteract = async (action, text = null) => {
    try {
      const res = await API.post('/posts/interact', { postId: post._id, action, text });
      if (res.data.success) {
        setPost(res.data.post);
        if (onUpdate) onUpdate(res.data.post);
      }
    } catch (err) {
      console.error(`Interaction ${action} failed:`, err);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    await handleInteract('comment', commentText);
    setCommentText('');
    setIsCommenting(false);
  };

  const handleDonate = () => {
    const causeId = post.linkedCauseId?._id || post.linkedCauseId;
    if (causeId) {
      navigate(`/causes/${causeId}`);
    } else {
      navigate('/causes');
    }
  };

  if (!post) return null;

  return (
    <article className="post-card-premium glass-panel">
      {/* Post Header */}
      <header className="post-card-header">
        <div className="owner-info" onClick={() => navigate(`/ngos/${post.ngoId?._id || post.ngoId}`)}>
          <div className="owner-avatar">
            <img 
              src={post.ngoId?.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${post.ngoId?._id || post.ngoId}`} 
              alt={post.ngoId?.name} 
              onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${post.ngoId?._id || post.ngoId}` }}
            />
          </div>
          <div className="owner-meta">
            <h4 className="owner-name body-md font-bold">{post.ngoId?.name || 'Verified NGO'}</h4>
            <span className="owner-category label-xs text-primary">{post.ngoId?.category || 'IMPACT NODE'}</span>
          </div>
        </div>
        <div className="post-date body-xs">
          <Calendar size={12} />
          {new Date(post.createdAt).toLocaleDateString()}
        </div>
      </header>

      {/* Post Content */}
      <div className="post-card-content">
        {post.caption && (
          <p className="post-caption body-md">
            {post.caption.split(' ').map((word, idx) => 
               word.startsWith('#') ? <span key={idx} className="hashtag">{word} </span> : word + ' '
            )}
          </p>
        )}

        {post.mediaUrl && (
          <div className="post-media-wrapper">
            {post.type === 'video' ? (
              <video src={post.mediaUrl} controls className="post-media-asset" />
            ) : (
              <img 
                src={post.mediaUrl} 
                className="post-media-asset" 
                alt="Impact Proof" 
                onError={(e) => { e.target.style.display = 'none' }} 
              />
            )}
          </div>
        )}
      </div>

      {/* Interaction Bar */}
      <div className="post-card-interact">
        <div className="interact-left">
          <button 
            className={`interact-btn ${isLiked ? 'liked' : ''}`}
            onClick={() => handleInteract('like')}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="count">{post.likes || 0}</span>
          </button>
          
          <button 
            className={`interact-btn ${showComments ? 'active' : ''}`}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={20} />
            <span className="count">{post.commentCount || 0}</span>
          </button>

          <button className="interact-btn" onClick={() => handleInteract('share')}>
            <Share2 size={20} />
          </button>
        </div>

        <button className="post-donate-btn" onClick={handleDonate}>
          DONATE NOW
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            className="post-comments-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="comments-list">
              {post.comments?.length > 0 ? (
                post.comments.map((comment, idx) => (
                  <div key={idx} className="comment-item">
                    <span className="comment-user">{comment.userId?.name || 'Supporter'}</span>
                    <p className="comment-text body-sm">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="no-comments label-sm">Be the first to leave a word of support.</p>
              )}
            </div>

            <form className="comment-input-area" onSubmit={submitComment}>
              <input 
                type="text" 
                placeholder="Write a comment..." 
                className="comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="comment-submit" disabled={!commentText.trim() || isCommenting}>
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
