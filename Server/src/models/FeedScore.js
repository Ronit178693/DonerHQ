import mongoose from 'mongoose';

// Temporary scores to optimize the personalized home feed for each user
const feedScoreSchema = new mongoose.Schema({
    // The specific user this recommendation is for
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // The post or update being scored by the algorithm
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    
    // Recommendation weight (e.g., high Score if they follow the NGO)
    score: { type: Number, required: true },
    
    // Logic dump for debugging (e.g., ["followed_ngo", "interest_match"])
    reasons: [{ type: String }],
    
    // When this algorithmic calculation happened
    computedAt: { type: Date, default: Date.now },
    
    // Has this post already been shown in their current scroll session?
    served: { type: Boolean, default: false }
    
}, { 
    // Tracking creation for sorting and deletion
    timestamps: true 
});

// TTL Index: This is a performance booster. It automatically deletes 
// recommendation scores after 1800 seconds (30 minutes) to keep the DB small.
feedScoreSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

const FeedScore = mongoose.model('FeedScore', feedScoreSchema);
export default FeedScore;
