// Importing the Post model to interact with social feed content in the database
import Post from '../models/Post.js';
// Importing the NGO model to verify ownership and link posts to organizations
import NGO from '../models/NGO.js';
// Importing the User model to access the authenticated user's following data
import User from '../models/User.js';

/**
 * Post Controller
 * Handles the creation, fetching and interaction of posts (social media feed).
 */

// ═══════════════════════════════════════════════════════════════
//  POST CREATION — NGOs publish photo/video/text updates
// ═══════════════════════════════════════════════════════════════

// Controller for an NGO to create a new social media post
export const createPost = async (req, res) => {
    // Destructuring all essential content from the body: type, media, caption, tags, and linked fundraiser
    const { type, mediaUrl, caption, tags, linkedCauseId } = req.body;
    // Starting the mission to store the post safely with error catching
    try {
        // Finding the NGO profile that corresponds to the currently logged-in user ID
        const ngo = await NGO.findOne({ userId: req.user._id });

        // Guard clause ensuring we found a valid NGO profile associated with this account
        if (!ngo) {
            // Returning a 404 response if the user has not set up an NGO profile yet
            return res.status(404).json({ success: false, message: 'NGO profile not found' });
        }

        // Enforcing organizational verification before allowing any public social activity
        if (ngo.status !== 'approved') {
            // Returning a 403 Forbidden error if the NGO is still in the verification queue
            return res.status(403).json({ success: false, message: 'Your NGO must be verified before you can post' });
        }

        // Basic validation: ensuring the post has a defined type (photo/video/text)
        if (!type) {
            // Returning 400 Bad Request if the 'type' field is missing from the payload
            return res.status(400).json({ success: false, message: 'Post type is required' });
        }

        // Validating media presence for visual post types which require a URL
        if ((type === 'photo' || type === 'video') && !mediaUrl) {
            // Returning 400 if the post claims to have media but provides no link
            return res.status(400).json({ success: false, message: 'Media URL is required for photo/video posts' });
        }

        // Creating and saving the fresh post document into the MongoDB collection
        const newPost = await Post.create({
            // Linking back to the verified NGO ID
            ngoId: ngo._id,
            // Saving the format type
            type,
            // Setting the media asset URL or default to empty string
            mediaUrl: mediaUrl || '',
            // Saving the caption/description text
            caption: caption || '',
            // Storing the searchable interest tags
            tags: tags || [],
            // Linking the fundraising mission if the post is a CTA for a cause
            linkedCauseId: linkedCauseId || null
        });

        // Updating the parent NGO document to keep a reference to this new post in their history
        await NGO.findByIdAndUpdate(ngo._id, { $push: { posts: newPost._id } });

        // Sending the successful creation response along with the new post object
        return res.status(201).json({ success: true, message: 'Post created successfully', post: newPost });
    // Catching any database connection issues or schema validation errors
    } catch (error) {
        // Returning a 500 error with the specific failure reason for debugging
        return res.status(500).json({ success: false, message: 'Error creating post', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  FEED — Personalized and discovery feed for donors
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve the personalized algorithmic feed for the current user
export const getFeedPosts = async (req, res) => {
    // Extracting user pagination preferences from the query string parameters
    const { page = 1, limit = 20 } = req.query;
    // Starting the data retrieval process with an error safety net
    try {
        // Fetching the user profile to look up their 'following' list and interest keywords
        const user = await User.findById(req.user._id);

        // Performing a complex find operation across the Posts collection
        const feedPosts = await Post.find({
            // Blending two discovery paths using an OR logical operator
            $or: [
                // Path 1: Content from organizations the user explicitly follows
                { ngoId: { $in: user.following } },
                // Path 2: Content matching the user's selected interest keywords
                { tags: { $in: user.interestTags || [] } }
            ]
        })
        // Ordering results by creation date so the freshest content appears first
        .sort({ createdAt: -1 })
        // Implementing page-based offset logic for efficient loading
        .skip((page - 1) * limit)
        // Limiting the batch size for mobile optimization and performance
        .limit(parseInt(limit))
        // Enrolling organization data into the post results
        .populate('ngoId', 'name logo verified transparencyScore')
        // Enrolling fundraiser details for immediate impact action tracking
        .populate('linkedCauseId', 'title goalAmount raisedAmount status');

        // Calculating the total volume of matching posts for UI pagination controls
        const totalPosts = await Post.countDocuments({
            // Re-matching the same follow/interest filter criteria
            $or: [
                { ngoId: { $in: user.following } },
                { tags: { $in: user.interestTags || [] } }
            ]
        });

        // Returning the paginated results and metadata back to the frontend
        return res.status(200).json({
            // Successfully processed request
            success: true,
            // Records in this response
            count: feedPosts.length,
            // Current page marker
            page: parseInt(page),
            // Total volume of pages available
            pages: Math.ceil(totalPosts / limit),
            // The actual array of post objects
            feed: feedPosts
        });
    // Catching any runtime query errors or population failures
    } catch (error) {
        // Returning a 500 status with specific failure details
        return res.status(500).json({ success: false, message: 'Error fetching feed', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  INTERACTIONS — Likes, Comments, Shares, Donate Clicks
// ═══════════════════════════════════════════════════════════════

// Controller to handle a user's social interaction with a specific post
export const interactWithPost = async (req, res) => {
    // Extracting target post and the type of interaction from the request payload
    const { postId, action, text } = req.body;
    // Starting the interaction handler with comprehensive error shielding
    try {
        // Ensuring the essential data (what post and what action) is present
        if (!postId || !action) {
            // Returning 400 Bad Request if the interaction intent is unclear
            return res.status(400).json({ success: false, message: 'postId and action are required' });
        }

        // Checking if the target post exists before attempting to modify it
        const post = await Post.findById(postId);
        // Guard clause for deleted or non-existent content
        if (!post) {
            // Returning 404 if the post ID does not exist in the collection
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Initializing the variable to hold the final updated state
        let updatedPost;

        // Logical branching based on the interaction type requested by the user
        if (action === 'like') {
            // Checking if the current user already appears in the like list
            const isLiked = post.likedBy.includes(req.user._id);
            
            // Branching between liking and unliking (toggle logic)
            if (isLiked) {
                // Performing an atomic UNLIKE operation
                updatedPost = await Post.findByIdAndUpdate(
                    postId,
                    { 
                        // Decrementing the global like counter
                        $inc: { likes: -1 },
                        // Pulling the user's ID out of the array
                        $pull: { likedBy: req.user._id }
                    },
                    { new: true }
                );
            } else {
                // Performing an atomic LIKE operation
                updatedPost = await Post.findByIdAndUpdate(
                    postId,
                    { 
                        // Incrementing the global like counter
                        $inc: { likes: 1 },
                        // Pushing the user ID into the set (ensures unique entries)
                        $addToSet: { likedBy: req.user._id }
                    },
                    { new: true }
                );
            }
        // Handling the addition of a new user comment
        } else if (action === 'comment') {
            // Validating that the comment has actual text content
            if (!text) {
                // Returning 400 if the user tried to post an empty comment
                return res.status(400).json({ success: false, message: 'Comment text is required' });
            }
            // Performing an atomic COMMENT operation
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { 
                    // Pushing the comment object into the post's embedded array
                    $push: { comments: { userId: req.user._id, text } },
                    // Incrementing the cached comment counter for fast feed reads
                    $inc: { commentCount: 1 }
                },
                { new: true }
            );
        // Handling the share action (tracking viral reach)
        } else if (action === 'share') {
            // Incrementing the share counter atomically
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $inc: { shares: 1 } },
                { new: true }
            );
        // Handling deep-link clicks to the donation module
        } else if (action === 'donateClick') {
            // Incrementing the conversion/donate indicator counter
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $inc: { donateClicks: 1 } },
                { new: true }
            );
        // Defensive case for unrecognized actions
        } else {
            // Returning 400 for unsupported interaction types
            return res.status(400).json({ success: false, message: 'Invalid action. Use: like, comment, share, or donateClick' });
        }

        // Transmitting the updated post data back to the client for live UI updates
        return res.status(200).json({ success: true, post: updatedPost });
    // Catching any database connection issues or update failures
    } catch (error) {
        // Returning a 500 status with details on why the interaction failed
        return res.status(500).json({ success: false, message: 'Error processing interaction', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  SINGLE POST — Fetch individual post details
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve the full context and story behind a single post
export const getPostById = async (req, res) => {
    // Extracting the unique post ID from the URL parameters
    const { id } = req.params;
    // Starting the detail lookup process with error handling
    try {
        // Finding the post and populating its authoring NGO, linked Cause, and community comments
        const post = await Post.findById(id)
            // Enrolling the NGO details
            .populate('ngoId', 'name logo verified transparencyScore')
            // Enrolling the mission details
            .populate('linkedCauseId', 'title goalAmount raisedAmount status')
            // Enrolling the identities of commenters
            .populate('comments.userId', 'name');

        // Guard clause ensuring the requested post actually exists
        if (!post) {
            // Returning a 404 response if the ID is invalid or deleted
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Incrementing the reach (impression) counter atomically during every view
        await Post.findByIdAndUpdate(id, { $inc: { reach: 1 } });

        // Returning the fully enriched post document to the requester
        return res.status(200).json({ success: true, post });
    // Catching any errors during ID parsing or database lookup
    } catch (error) {
        // Returning a 500 status code with the failure message
        return res.status(500).json({ success: false, message: 'Error fetching post', error: error.message });
    }
};
