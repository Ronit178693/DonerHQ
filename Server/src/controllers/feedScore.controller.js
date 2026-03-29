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
    const { page = 1, limit = 20 } = req.query;
    // Starting the try block to fetch and format the ranked results
    try {
        // Fetching the currently authenticated user
        const user = await User.findById(req.user._id);
        
        // Searching for pre-calculated scores in the FeedScore collection
        let feedScores = await FeedScore.find({ userId: user._id })
            // Sorting by score in descending order (best content at the top)
            .sort({ score: -1 })
            // Paginating through the results based on page number
            .skip((page - 1) * limit)
            // Limit per page for mobile-friendly loading
            .limit(parseInt(limit))
            // Populating the actual Post data from the linked references
            .populate({
                path: 'postId',
                // Deeply populating author and mission details for the UI cards
                populate: [
                    { path: 'ngoId', select: 'name logo verified transparencyScore' },
                    { path: 'linkedCauseId', select: 'title goalAmount raisedAmount status' }
                ]
            });

        // "Cold Start" Logic: if no scores exist and it's the first page, compute them immediately
        if (feedScores.length === 0 && page == 1) {
            // Triggering the scoring algorithm synchronously for the first-time user
            await computeScores(user);
            // Re-fetching the now-populated ranked scores
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

        // Returning the high-relevance feed objects back to the client
        return res.status(200).json({ 
            // Successful request flag
            success: true, 
            // Count of items in this response
            count: feedScores.length, 
            // Mapping the score documents back to a clean array of post objects
            feed: feedScores.map(fs => fs.postId) 
        });
    // Catching any formatting or data retrieval errors
    } catch (error) {
        // Returning 500 for internal server failures during feed generation
        return res.status(500).json({ success: false, message: 'Error fetching ranked feed', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  SCORING ALGORITHM — The core "Brain" of DonerHQ Feed
// ═══════════════════════════════════════════════════════════════

// Internal Helper function to compute and save scores for all candidate posts
const computeScores = async (user) => {
    // Setting the recency window to the last 72 hours for "Fresh" content
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    // Finding all posts created within that chronological window
    const candidatePosts = await Post.find({ createdAt: { $gt: threeDaysAgo } });

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

        // --- FACTOR 4: Recency Score (15%) ---
        // Newer posts get higher scores (linear decay over 72 hours)
        recencyScore = 1.0 - (hoursOld / 72);

        // Final weighted sum based on the DonerHQ core ranking formula
        const finalScore = (interestMatch * 0.35) + (relationshipScore * 0.30) + (trendingScore * 0.20) + (recencyScore * 0.15);

        // Storing the individual score result with expiration data
        scores.push({
            // Target user
            userId: user._id,
            // Source post
            postId: post._id,
            // Computed weight
            score: finalScore,
            // Transparency: documenting why this post was ranked high
            reasons: interestMatch > 0 ? ['interest_match'] : [],
            // TTL: Setting an expiration of 30 minutes for this cached score 
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
