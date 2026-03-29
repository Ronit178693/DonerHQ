import FeedScore from '../models/FeedScore.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import NGO from '../models/NGO.js';

/**
 * Feed Score Controller
 * Handles algorithm logic to compute and store relevance scores for the user feed.
 */

// Controller to update ranking for specific users or content types
export const updateFeedScores = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        await computeScores(user);

        return res.status(200).json({ success: true, message: 'Feed scores updated successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating feed scores', error: error.message });
    }
};

// Controller to retrieve highest-scoring posts for a personalized feed
export const getTopRankedContent = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    try {
        const user = await User.findById(req.user._id);
        
        // Checking if cached scores exist
        let feedScores = await FeedScore.find({ userId: user._id })
            .sort({ score: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate({
                path: 'postId',
                populate: [
                    { path: 'ngoId', select: 'name logo verified transparencyScore' },
                    { path: 'linkedCauseId', select: 'title goalAmount raisedAmount status' }
                ]
            });

        // If no cached scores (cold start), we compute them for the first page
        if (feedScores.length === 0 && page == 1) {
            await computeScores(user);
            feedScores = await FeedScore.find({ userId: user._id })
                .sort({ score: -1 })
                .limit(parseInt(limit))
                .populate({
                    path: 'postId',
                    populate: [
                        { path: 'ngoId', select: 'name logo verified transparencyScore' },
                        { path: 'linkedCauseId', select: 'title goalAmount raisedAmount status' }
                    ]
                });
        }

        return res.status(200).json({ 
            success: true, 
            count: feedScores.length, 
            feed: feedScores.map(fs => fs.postId) 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching ranked feed', error: error.message });
    }
};

// Helper function to compute scores for a user
const computeScores = async (user) => {
    // Fetch recent posts (last 72 hours)
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const candidatePosts = await Post.find({ createdAt: { $gt: threeDaysAgo } });

    const scores = [];

    for (const post of candidatePosts) {
        let interestMatch = 0;
        let relationshipScore = 0;
        let trendingScore = 0;
        let recencyScore = 0;

        // Interest Match (35%)
        const userInterests = user.interests || [];
        const postTags = post.tags || [];
        const matches = postTags.filter(tag => userInterests.includes(tag));
        interestMatch = matches.length > 0 ? 1.0 : 0.0;

        // Relationship Score (30%)
        if (user.following.includes(post.ngoId)) {
            relationshipScore = 1.0;
        } else if (user.donationHistory.length > 0) {
            relationshipScore = 0.5; 
        }

        // Trending Score (20%)
        const hoursOld = Math.max(1, (Date.now() - post.createdAt) / (1000 * 60 * 60));
        trendingScore = Math.min(1.0, (post.likes + (post.donateClicks * 3)) / hoursOld / 10);

        // Recency Score (15%)
        recencyScore = 1.0 - (hoursOld / 72);

        // Final weighted score
        const finalScore = (interestMatch * 0.35) + (relationshipScore * 0.30) + (trendingScore * 0.20) + (recencyScore * 0.15);

        scores.push({
            userId: user._id,
            postId: post._id,
            score: finalScore,
            reasons: interestMatch > 0 ? ['interest_match'] : [],
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 mins TTL
        });
    }

    // Replace old scores
    await FeedScore.deleteMany({ userId: user._id });
    if (scores.length > 0) {
        await FeedScore.insertMany(scores);
    }
};
