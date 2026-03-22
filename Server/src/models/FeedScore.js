import mongoose from 'mongoose';

const feedScoreSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    score: { type: Number, required: true },
    reasons: [{ type: String }],
    computedAt: { type: Date, default: Date.now },
    served: { type: Boolean, default: false }
}, { timestamps: true });

// TTL Index: Automatically delete scores after 30 minutes
feedScoreSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

const FeedScore = mongoose.model('FeedScore', feedScoreSchema);
export default FeedScore;
