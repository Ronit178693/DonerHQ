// Importing the FeedScore model to store and retrieve personalized content rankings
import FeedScore from '../models/FeedScore.js';
// Importing the Post model to evaluate and score social feed updates
import Post from '../models/Post.js';
// Importing the User model to access individual preferences and following lists
import User from '../models/User.js';
// Importing the NGO model to check organizational verification and metrics
import NGO from '../models/NGO.js';

/**
 * Feed Score Controller
 * Handles the algorithmic logic to compute, rank, and store relevance scores for a personalized user feed.
 */

// ═══════════════════════════════════════════════════════════════
//  UPDATE SCORES — Triggering the ranking algorithm manually
// ═══════════════════════════════════════════════════════════════

// Controller to manually refresh or update content rankings for the current user
export const updateFeedScores = async (req, res) => {
    // Starting the try block to manage the intensive scoring computation
    try {
        // Fetching the current user's full document from the database
        const user = await User.findById(req.user._id);
        // Guard clause ensuring the user account is active and valid
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Calling the internal helper function to perform the actual scoring math
        await computeScores(user);

        // Returning a success message once the background computation is finished
        return res.status(200).json({ success: true, message: 'Feed scores updated successfully' });
        // Catching any computational or database errors during the scoring process
    } catch (error) {
        // Returning a 500 status code with the failure details
        return res.status(500).json({ success: false, message: 'Error updating feed scores', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  GET RANKED FEED — Retrieving the best content first
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve the highest-scoring posts for a personalized donor feed
export const getTopRankedContent = async (req, res) => {
    // Extracting pagination parameters from the URL query string
    const { page = 1, limit = 10, shuffle = false, filter = '' } = req.query;
    // Starting the try block to fetch and format the ranked results
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // ─── FOLLOWING FILTER: Only posts from NGOs the user follows ───
        if (filter === 'following') {
            const followingIds = user.following || [];
            if (followingIds.length === 0) {
                return res.status(200).json({
                    success: true, count: 0, posts: [],
                    message: 'Follow some NGOs to see their updates here!'
                });
            }
            const followedPosts = await Post.find({ ngoId: { $in: followingIds } })
                .sort({ createdAt: -1 })
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .populate('ngoId', 'name logo verified transparencyScore category')
                .populate('linkedCauseId', 'title goalAmount raisedAmount status');
            return res.status(200).json({
                success: true, page: parseInt(page), count: followedPosts.length,
                posts: followedPosts
            });
        }

        // ─── TRENDING FILTER: Posts ranked by engagement ───
        if (filter === 'trending') {
            const trendingPosts = await Post.find({})
                .sort({ likes: -1, donateClicks: -1, createdAt: -1 })
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .populate('ngoId', 'name logo verified transparencyScore category')
                .populate('linkedCauseId', 'title goalAmount raisedAmount status');
            return res.status(200).json({
                success: true, page: parseInt(page), count: trendingPosts.length,
                posts: trendingPosts
            });
        }

        // ─── DEFAULT "FOR YOU": Algorithmic ranking ───
        // Force a recalculation if it's the first page to ensure freshness
        if (parseInt(page) === 1) {
            await computeScores(user);
        }

        // Searching for pre-calculated scores in the FeedScore collection
        let feedScores = await FeedScore.find({ userId: user._id })
            .sort({ score: -1 }) // Primary sort by algorithmic relevance
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .populate({
                path: 'postId',
                populate: [
                    { path: 'ngoId', select: 'name logo verified transparencyScore category' },
                    { path: 'linkedCauseId', select: 'title goalAmount raisedAmount status' }
                ]
            });

        // FALLBACK LOGIC: If the algorithmic feed is empty or becomes sparse
        if (feedScores.length === 0) {
            const fallbackPosts = await Post.find({})
                .sort({ createdAt: -1 }) // Fallback to newest for stability in cold-start
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .populate('ngoId', 'name logo verified transparencyScore category')
                .populate('linkedCauseId', 'title goalAmount raisedAmount status');

            return res.status(200).json({
                success: true,
                count: fallbackPosts.length,
                posts: fallbackPosts,
                message: 'Displaying global feed'
            });
        }

        // Return ranked feed as 'posts' to match frontend expects
        return res.status(200).json({
            success: true,
            page: parseInt(page),
            count: feedScores.length,
            posts: feedScores.map(fs => fs.postId).filter(p => p !== null)
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching feed', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  SCORING ALGORITHM — The core "Brain" of DonerHQ Feed
// ═══════════════════════════════════════════════════════════════

// Internal Helper function to compute and save scores for all candidate posts
const computeScores = async (user) => {
    // UPDATED: In early stages, we consider ALL posts for scoring, not just last 72h
    const candidatePosts = await Post.find({}); 
    if (candidatePosts.length === 0) return;

    // Initializing a temporary array to store the computed results
    const scores = [];

    // Iterating through every recent post to calculate its personalized relevance
    for (const post of candidatePosts) {
        // Initializing scoring factors
        let interestMatch = 0;
        let relationshipScore = 0;
        let trendingScore = 0;
        let recencyScore = 0;

        // --- FACTOR 1: Interest Match (35%) ---
        // Getting user interests and post tags for comparison
        const userInterests = user.interests || [];
        const postTags = post.tags || [];
        // Checking for common keywords between the user profile and the post
        const matches = postTags.filter(tag => userInterests.includes(tag));
        // Assigning full match score if any overlapping interests are found
        interestMatch = matches.length > 0 ? 1.0 : 0.0;

        // --- FACTOR 2: Relationship Score (30%) ---
        // Checking if the user proactively follows this organization
        if (user.following.includes(post.ngoId)) {
            // Assigning max relationship score for followed NGOs
            relationshipScore = 1.0;
        } else if (user.donationHistory.length > 0) {
            // Assigning partial score if the user has a history of giving to this NGO
            relationshipScore = 0.5;
        }

        // --- FACTOR 3: Trending Score (20%) ---
        // Calculating age of post in hours to detect "Viral" potential
        const hoursOld = Math.max(1, (Date.now() - post.createdAt) / (1000 * 60 * 60));
        // High-engagement calculation: (likes + weighted donate clicks) divided by age
        trendingScore = Math.min(1.0, (post.likes + (post.donateClicks * 3)) / hoursOld / 10);

        // --- FACTOR 4: Recency Score (10%) ---
        // Newer posts get higher scores (linear decay over 72 hours)
        recencyScore = 1.0 - (hoursOld / 72);

        // --- FACTOR 5: Discovery Randomness (5%) ---
        // Adding a small random jitter to make refresh feel alive
        const randomJitter = Math.random() * 0.05;

        // Final weighted sum based on the DonerHQ core ranking formula
        const finalScore = (interestMatch * 0.35) + (relationshipScore * 0.30) + (trendingScore * 0.20) + (Math.max(0, recencyScore) * 0.10) + randomJitter;

        // Storing the individual score result with expiration data
        scores.push({
            userId: user._id,
            postId: post._id,
            score: finalScore,
            reasons: interestMatch > 0 ? ['interest_match'] : [],
            expiresAt: new Date(Date.now() + 30 * 60 * 1000)
        });
    }

    // Atomically clearing all previously stored scores for this specific user
    await FeedScore.deleteMany({ userId: user._id });
    // Bulk-inserting the fresh batch of ranked scores for faster retrieval
    if (scores.length > 0) {
        await FeedScore.insertMany(scores);
    }
};
