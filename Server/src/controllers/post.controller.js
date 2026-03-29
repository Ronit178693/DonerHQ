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
    // Extracting the post content fields from the request body
    const { type, mediaUrl, caption, tags, linkedCauseId } = req.body;
    // Starting the try block for error handling
    try {
        // Finding the NGO profile associated with the currently logged-in user
        const ngo = await NGO.findOne({ userId: req.user._id });

        // Checking if the NGO profile actually exists for this user
        if (!ngo) {
            // Returning a 404 if no NGO record was found for this user
            return res.status(404).json({ success: false, message: 'NGO profile not found' });
        }

        // Ensuring the NGO has been approved before allowing them to post
        if (ngo.status !== 'approved') {
            // Returning a 403 if the NGO is still pending verification
            return res.status(403).json({ success: false, message: 'Your NGO must be verified before you can post' });
        }

        // Validating that a post type was included in the request
        if (!type) {
            // Returning a 400 if the type field is missing
            return res.status(400).json({ success: false, message: 'Post type is required' });
        }

        // Checking if media URL is required for the given post type
        if ((type === 'photo' || type === 'video') && !mediaUrl) {
            // Returning a 400 if a media post was submitted without a URL
            return res.status(400).json({ success: false, message: 'Media URL is required for photo/video posts' });
        }

        // Creating the new post document in the database
        const newPost = await Post.create({
            // Linking the post to the author NGO's unique identifier
            ngoId: ngo._id,
            // Specifying the format of the post content
            type,
            // Storing the Cloudinary media URL or empty string for text posts
            mediaUrl: mediaUrl || '',
            // Storing the caption or storytelling text
            caption: caption || '',
            // Storing the array of searchable hashtags for discovery
            tags: tags || [],
            // Optionally linking a fundraising cause for the donate button
            linkedCauseId: linkedCauseId || null
        });

        // Atomically pushing the new post's ID into the NGO's posts array
        await NGO.findByIdAndUpdate(ngo._id, { $push: { posts: newPost._id } });

        // Returning the successfully created post document to the client
        return res.status(201).json({ success: true, message: 'Post created successfully', post: newPost });
    // Catching any validation or database errors during the process
    } catch (error) {
        // Returning a 500 server error response with the error message
        return res.status(500).json({ success: false, message: 'Error creating post', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  FEED — Personalized and discovery feed for donors
// ═══════════════════════════════════════════════════════════════

// Controller to fetch the personalized social media feed for a logged-in user
export const getFeedPosts = async (req, res) => {
    // Extracting optional pagination parameters from the URL query string
    const { page = 1, limit = 20 } = req.query;
    // Starting the try block for data retrieval
    try {
        // Fetching the currently authenticated user's document to access their interests
        const user = await User.findById(req.user._id);

        // Building the feed query using followed NGOs and interest-based discovery
        const feedPosts = await Post.find({
            // Using an OR condition to blend followed content with interest-based content
            $or: [
                // Condition 1: Posts from NGOs the user is actively following
                { ngoId: { $in: user.following } },
                // Condition 2: Posts tagged with categories matching user interests
                { tags: { $in: user.interestTags || [] } }
            ]
        })
        // Sorting the results so the newest updates appear at the top
        .sort({ createdAt: -1 })
        // Skipping previously viewed pages of results
        .skip((page - 1) * limit)
        // Capping the number of results per page for performance
        .limit(parseInt(limit))
        // Populating the author NGO's key display fields for the feed cards
        .populate('ngoId', 'name logo verified transparencyScore')
        // Populating the linked cause details for the donate button overlay
        .populate('linkedCauseId', 'title goalAmount raisedAmount status');

        // Counting the total number of matching posts for pagination metadata
        const totalPosts = await Post.countDocuments({
            // Reusing the same filter logic for accurate page count
            $or: [
                // Matching followed NGO posts
                { ngoId: { $in: user.following } },
                // Matching interest-tagged posts
                { tags: { $in: user.interestTags || [] } }
            ]
        });

        // Returning the paginated feed results along with metadata to the client
        return res.status(200).json({
            // Indicating the request completed successfully
            success: true,
            // The number of posts returned in this response
            count: feedPosts.length,
            // The current page number
            page: parseInt(page),
            // The total number of available pages
            pages: Math.ceil(totalPosts / limit),
            // The array of populated post documents
            feed: feedPosts
        });
    // Catching any errors during the feed generation process
    } catch (error) {
        // Returning a 500 error with the specific failure message
        return res.status(500).json({ success: false, message: 'Error fetching feed', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  INTERACTIONS — Likes, Comments, Shares, Donate Clicks
// ═══════════════════════════════════════════════════════════════

// Unified controller to handle all social interactions on a post
export const interactWithPost = async (req, res) => {
    // Extracting the target post ID, action type, and optional comment text
    const { postId, action, text } = req.body;
    // Starting the try block for interaction processing
    try {
        // Validating that a post ID and action type were provided
        if (!postId || !action) {
            // Returning 400 if the required fields are missing
            return res.status(400).json({ success: false, message: 'postId and action are required' });
        }

        // Searching for the post to find its current state
        const post = await Post.findById(postId);
        // Guard clause for non-existent post
        if (!post) {
            // Returning 404 if the post was not found in the database
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Declaring a variable to hold the final updated post record
        let updatedPost;

        // Routing the request based on the specified social action type
        if (action === 'like') {
            // Checking if the user has already liked this specific post
            const isLiked = post.likedBy.includes(req.user._id);
            
            if (isLiked) {
                // If already liked, perform an UNLIKE action
                updatedPost = await Post.findByIdAndUpdate(
                    postId,
                    { 
                        // Decrement total like counter
                        $inc: { likes: -1 },
                        // Remove user ID from the likedBy array
                        $pull: { likedBy: req.user._id }
                    },
                    { new: true }
                );
            } else {
                // If not liked yet, perform a LIKE action
                updatedPost = await Post.findByIdAndUpdate(
                    postId,
                    { 
                        // Increment total like counter
                        $inc: { likes: 1 },
                        // Add user ID to likedBy set (ensures uniqueness)
                        $addToSet: { likedBy: req.user._id }
                    },
                    { new: true }
                );
            }
        // Handling the comment interaction type
        } else if (action === 'comment') {
            // Validating that comment text was actually provided
            if (!text) {
                // Returning 400 if the comment body is empty
                return res.status(400).json({ success: false, message: 'Comment text is required' });
            }
            // Atomically pushing a new comment and incrementing the total comment counter
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { 
                    // Pushing the new comment object into the array
                    $push: { comments: { userId: req.user._id, text } },
                    // Incrementing the cached comment count field
                    $inc: { commentCount: 1 }
                },
                { new: true }
            );
        // Handling the share interaction type
        } else if (action === 'share') {
            // Atomically incrementing the share counter for viral tracking
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $inc: { shares: 1 } },
                { new: true }
            );
        // Handling the donate click conversion tracking
        } else if (action === 'donateClick') {
            // Atomically incrementing the conversion metric counter
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $inc: { donateClicks: 1 } },
                { new: true }
            );
        // Handling any unrecognized action types
        } else {
            // Returning 400 for invalid action values
            return res.status(400).json({ success: false, message: 'Invalid action. Use: like, comment, share, or donateClick' });
        }

        // Returning the latest post state back to the client for live UI updates
        return res.status(200).json({ success: true, post: updatedPost });
    // Catching any database errors during the social interaction
    } catch (error) {
        // Returning a 500 error with details if the interaction fails to save
        return res.status(500).json({ success: false, message: 'Error processing interaction', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  SINGLE POST — Fetch individual post details
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve the full details of a single post by its ID
export const getPostById = async (req, res) => {
    // Extracting the post ID from the URL parameters
    const { id } = req.params;
    // Starting the try block for data retrieval
    try {
        // Finding the post document and populating all referenced fields
        const post = await Post.findById(id)
            // Populating the NGO author's display details
            .populate('ngoId', 'name logo verified transparencyScore')
            // Populating the linked cause details for the donate button
            .populate('linkedCauseId', 'title goalAmount raisedAmount status')
            // Populating the user references inside the comments array
            .populate('comments.userId', 'name');

        // Checking if the post was actually found in the database
        if (!post) {
            // Returning a 404 if no post matches the provided ID
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Atomically incrementing the reach counter for impression tracking
        await Post.findByIdAndUpdate(id, { $inc: { reach: 1 } });

        // Returning the fully populated post document to the client
        return res.status(200).json({ success: true, post });
    // Catching any errors during the single post retrieval
    } catch (error) {
        // Returning a 500 error with the specific failure details
        return res.status(500).json({ success: false, message: 'Error fetching post', error: error.message });
    }
};
