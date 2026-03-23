// Importing the NGO model to interact with NGO profiles in the database
import NGO from '../models/NGO.js';
// Importing the User model to manage user-NGO interactions like saving and following
import User from '../models/User.js';
// Importing the Post model so NGOs can create and manage social feed content
import Post from '../models/Post.js';
// Importing the Cause model to retrieve causes linked to an NGO
import Cause from '../models/Cause.js';
// Importing the Donation model for the NGO creator dashboard analytics
import Donation from '../models/Donation.js';

// ═══════════════════════════════════════════════════════════════
//  NGO PROFILE — Public facing page (like an Instagram profile)
// ═══════════════════════════════════════════════════════════════

// Controller to get a specific NGO's full public profile page
export const getNGOProfile = async (req, res) => {
    // Extract ID from request parameters
    const { id } = req.params;
    // Try block for error handling
    try {
        // Find NGO by ID and populate related fields
        const ngo = await NGO.findById(id)
            // Populate causes
            .populate('causes')
            // Populate posts with sorting
            .populate({
                // Path for posts
                path: 'posts',
                // Sort newest first
                options: { sort: { createdAt: -1 } }
            })
            // Populate user ID and name
            .populate('userId', 'name');

        // Check if NGO exists
        if (!ngo) {
            // Return 404 if not found
            return res.status(404).json({ success: false, message: 'NGO not found' });
        }

        // Return success response with NGO data
        return res.status(200).json({ success: true, ngo });
    } catch (error) {
        // Return 500 error if something fails
        return res.status(500).json({ success: false, message: 'Error fetching NGO profile', error: error.message });
    }
};

// Controller to update NGO profile details (only the owning user can do this)
export const updateNGOProfile = async (req, res) => {
    // Extract ID from request parameters
    const { id } = req.params;
    // Extract fields from request body
    const { name, bio, logo, location, category } = req.body;
    // Try block for error handling
    try {
        // Find NGO by ID
        const ngo = await NGO.findById(id);

        // Check if NGO exists
        if (!ngo) {
            // Return 404 if not found
            return res.status(404).json({ success: false, message: 'NGO not found' });
        }

        // Authorization check to ensure user owns the profile
        if (ngo.userId.toString() !== req.user?._id?.toString()) {
            // Return 403 if unauthorized
            return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
        }

        // Initialize object for selective updates
        const updates = {};
        // Check if a new name is being provided
        if (name) updates.name = name;
        // Check if updated bio content is present
        if (bio) updates.bio = bio;
        // Check if a new logo URL is specified
        if (logo) updates.logo = logo;
        // Check if geographic location updates are needed
        if (location) updates.location = location;
        // Check if the organizational category is changing
        if (category) updates.category = category;

        // Perform atomic update and return updated document
        const updatedNGO = await NGO.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        // Return success response with updated NGO data
        return res.status(200).json({ success: true, message: 'NGO profile updated successfully', ngo: updatedNGO });
    } catch (error) {
        // Return 500 error if update fails
        return res.status(500).json({ success: false, message: 'Error updating NGO profile', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  NGO DISCOVERY & SEARCH — Browse and filter NGOs
// ═══════════════════════════════════════════════════════════════

// Controller to list all approved NGOs with optional filtering by category and location
export const discoverNGOs = async (req, res) => {
    // Extracting optional query parameters for filtering from the URL
    const { category, location, search, page = 1, limit = 12 } = req.query;
    // Beginning the try block
    try {
        // Building a dynamic filter object that starts with only approved NGOs
        const filter = { status: 'approved' };

        // Adding a category filter if the client specified one
        if (category) {
            // Setting the category field in the query filter
            filter.category = category;
        }

        // Adding a location filter using a case-insensitive regex match
        if (location) {
            // Allowing partial location matches (e.g., "Mumbai" matches "Mumbai, India")
            filter.location = { $regex: location, $options: 'i' };
        }

        // Adding a text search filter for NGO name or bio
        if (search) {
            // Using an OR condition to match search term against name or bio
            filter.$or = [
                // Case-insensitive partial match on the NGO name
                { name: { $regex: search, $options: 'i' } },
                // Case-insensitive partial match on the NGO bio/description
                { bio: { $regex: search, $options: 'i' } }
            ];
        }

        // Counting total matching documents for pagination metadata
        const total = await NGO.countDocuments(filter);

        // Querying the database with the constructed filter object
        const ngos = await NGO.find(filter)
            // Selecting only the fields needed for the discovery/browse cards
            .select('name logo category location bio transparencyScore followerCount totalRaised verified')
            // Sorting by transparency score so the most trustworthy NGOs appear first
            .sort({ transparencyScore: -1 })
            // Implementing pagination by skipping already-viewed results
            .skip((page - 1) * limit)
            // Limiting the number of results per page
            .limit(parseInt(limit));

        // Returning the paginated list of NGOs along with metadata
        return res.status(200).json({
            // Indicating the request was successful
            success: true,
            // The total number of matching NGOs across all pages
            total,
            // The current page number
            page: parseInt(page),
            // The total number of pages
            pages: Math.ceil(total / limit),
            // The array of NGO documents for this page
            ngos
        });
    // Catching any database or server errors
    } catch (error) {
        // Returning a 500 error response
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  SOCIAL MEDIA POSTING — NGOs create photo/video/text posts
// ═══════════════════════════════════════════════════════════════

// Controller for an NGO to create a new social media post
export const createPost = async (req, res) => {
    // Extract post details from request body
    const { type, mediaUrl, caption, tags, linkedCauseId } = req.body;
    // Try block for post creation
    try {
        // Find NGO associated with current user
        const ngo = await NGO.findOne({ userId: req.user._id });

        // Check if NGO profile exists
        if (!ngo) {
            // Return 404 if no profile found
            return res.status(404).json({ success: false, message: 'NGO profile not found' });
        }

        // Ensure NGO is approved before posting
        if (ngo.status !== 'approved') {
            // Return 403 if not approved
            return res.status(403).json({ success: false, message: 'Your NGO must be verified before you can post' });
        }

        // Validate post type
        if (!type) {
            // Return 400 if type is missing
            return res.status(400).json({ success: false, message: 'Post type is required' });
        }

        // Validate media URL for photo/video posts
        if ((type === 'photo' || type === 'video') && !mediaUrl) {
            // Return 400 if media URL is missing
            return res.status(400).json({ success: false, message: 'Media URL is required for photo/video posts' });
        }

        // Create new post document
        const newPost = await Post.create({
            // Author NGO ID
            ngoId: ngo._id,
            // Format of post
            type,
            // Media link
            mediaUrl: mediaUrl || '',
            // Post caption
            caption: caption || '',
            // Discovery tags
            tags: tags || [],
            // Optional fundraiser link
            linkedCauseId: linkedCauseId || null
        });

        // Atomic push to NGO's posts array
        await NGO.findByIdAndUpdate(ngo._id, { $push: { posts: newPost._id } });

        // Return success response with created post
        return res.status(201).json({ success: true, message: 'Post created successfully', post: newPost });
    } catch (error) {
        // Return 500 error if creation fails
        return res.status(500).json({ success: false, message: 'Error creating post', error: error.message });
    }
};

// Controller to delete a post
export const deletePost = async (req, res) => {
    // Extract post ID from URL parameters
    const { postId } = req.params;
    // Try block for post deletion
    try {
        // Find post by ID
        const post = await Post.findById(postId);
        // Check if post exists
        if (!post) {
            // Return 404 if not found
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Find NGO associated with current user
        const ngo = await NGO.findOne({ userId: req.user._id });
        // Authorization check for post ownership
        if (!ngo || post.ngoId.toString() !== ngo._id.toString()) {
            // Return 403 if unauthorized
            return res.status(403).json({ success: false, message: 'Unauthorized to delete this post' });
        }

        // Atomic pull from NGO's posts array
        await NGO.findByIdAndUpdate(ngo._id, { $pull: { posts: postId } });
        // Delete post document
        await Post.findByIdAndDelete(postId);

        // Return success response
        return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        // Return 500 error if deletion fails
        return res.status(500).json({ success: false, message: 'Error deleting post', error: error.message });
    }
};

// Controller to get all posts for a specific NGO (their profile feed)
export const getNGOPosts = async (req, res) => {
    // Extracting the NGO ID from the URL parameters
    const { id } = req.params;
    // Starting the try block
    try {
        // Querying the database for all posts by this NGO, sorted newest first
        const posts = await Post.find({ ngoId: id })
            // Sorting in reverse chronological order for the timeline
            .sort({ createdAt: -1 })
            // Populating the linked cause details if the post has a donate button
            .populate('linkedCauseId', 'title goalAmount raisedAmount status');

        // Returning the array of posts
        return res.status(200).json({ success: true, count: posts.length, posts });
    // Catching any data retrieval errors
    } catch (error) {
        // Returning a 500 error
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  SOCIAL — Follow / Unfollow an NGO (like Instagram)
// ═══════════════════════════════════════════════════════════════

// Controller to follow an NGO
export const followNGO = async (req, res) => {
    // Extract target ID from URL parameters
    const { id } = req.params;
    // Try block for follow action
    try {
        // Check if target NGO exists
        const ngoExists = await NGO.exists({ _id: id });
        // Guard clause for non-existent NGO
        if (!ngoExists) {
            // Return 404 if not found
            return res.status(404).json({ success: false, message: 'NGO not found' });
        }

        // Atomic update for User's following list
        const updatedUser = await User.findByIdAndUpdate(
            // Current user ID
            req.user._id,
            // Add NGO to following array without duplicates
            { $addToSet: { following: id } },
            // Return modified document
            { new: true }
        );

        // Re-fetch user to confirm if follow was successful
        const user = await User.findById(req.user._id);
        // Condition to increment follower count
        if (user.following.includes(id)) {
             // Atomic increment for NGO's follower metric
             await NGO.findByIdAndUpdate(id, { $inc: { followerCount: 1 } });
             // Return success response
             return res.status(200).json({ success: true, message: 'Successfully followed NGO' });
        }

        // Return error if already following
        return res.status(400).json({ success: false, message: 'Already following this NGO' });
    } catch (error) {
        // Return 500 if error occurs
        return res.status(500).json({ success: false, message: 'Error following NGO', error: error.message });
    }
};

// Controller to unfollow an NGO
export const unfollowNGO = async (req, res) => {
    // Extract target ID from URL parameters
    const { id } = req.params;
    // Try block for unfollow action
    try {
        // Atomic pull from User's following list
        const user = await User.findByIdAndUpdate(
            // Current user ID
            req.user._id,
            // Remove NGO from following array
            { $pull: { following: id } }
        );

        // Check if user was previously following
        if (user.following.includes(id)) {
            // Atomic decrement for NGO's follower metric
            await NGO.findByIdAndUpdate(id, { $inc: { followerCount: -1 } });
            // Return success response
            return res.status(200).json({ success: true, message: 'Successfully unfollowed NGO' });
        }

        // Return error if not currently following
        return res.status(400).json({ success: false, message: 'Not following this NGO' });
    } catch (error) {
        // Return 500 if error occurs
        return res.status(500).json({ success: false, message: 'Error unfollowing NGO', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  NGO CREATOR DASHBOARD — Analytics (post reach, donor conversions)
// ═══════════════════════════════════════════════════════════════

// Controller to get the NGO's analytics dashboard data using aggregation
export const getNGODashboard = async (req, res) => {
    // Try block for analytics computation
    try {
        // Find NGO associated with current user
        const ngo = await NGO.findOne({ userId: req.user._id });

        // Guard clause for missing profile
        if (!ngo) {
            // Return 404 if no profile found
            return res.status(404).json({ success: false, message: 'NGO profile not found' });
        }

        // Aggregate post statistics in a single query
        const postStats = await Post.aggregate([
            // Filter posts by this NGO
            { $match: { ngoId: ngo._id } },
            // Group and sum metrics
            {
                $group: {
                    // Singular output group
                    _id: null,
                    // Sum total reach
                    totalReach: { $sum: '$reach' },
                    // Sum total likes
                    totalLikes: { $sum: '$likes' },
                    // Sum total shares
                    totalShares: { $sum: '$shares' },
                    // Sum total donate clicks
                    totalDonateClicks: { $sum: '$donateClicks' },
                    // Sum total comments from array size
                    totalComments: { $sum: { $size: '$comments' } },
                    // Count total posts
                    count: { $sum: 1 }
                }
            }
        ]);

        // Fallback to zero stats if no posts found
        const stats = postStats[0] || {
            totalReach: 0,
            totalLikes: 0,
            totalShares: 0,
            totalDonateClicks: 0,
            totalComments: 0,
            count: 0
        };

        // Fetch all causes for this NGO
        const causes = await Cause.find({ ngoId: ngo._id });
        // Count active causes
        const activeCauses = causes.filter(c => c.status === 'active').length;
        // Count completed causes
        const completedCauses = causes.filter(c => c.status === 'completed').length;

        // Aggregate successful donations count
        const totalDonations = await Donation.countDocuments({ ngoId: ngo._id, status: 'paid' });

        // Compile and return unified dashboard analytics
        return res.status(200).json({
            // Flag success
            success: true,
            // Core profile snapshot
            profile: {
                // NGO Name
                name: ngo.name,
                // Follower count
                followers: ngo.followerCount,
                // Trust score
                transparencyScore: ngo.transparencyScore,
                // Total fundraising total
                totalRaised: ngo.totalRaised,
                // Validation status
                status: ngo.status
            },
            // Social engagement metrics
            postAnalytics: {
                // Post volume
                totalPosts: stats.count,
                // Impression reach
                totalReach: stats.totalReach,
                // Social proof likes
                totalLikes: stats.totalLikes,
                // Reshare volume
                totalShares: stats.totalShares,
                // Interaction comments
                totalComments: stats.totalComments,
                // Conversion clicks
                totalDonateClicks: stats.totalDonateClicks
            },
            // Fundraising performance metrics
            causeAnalytics: {
                // Campaign volume
                totalCauses: causes.length,
                // Ongoing campaigns
                activeCauses,
                // Success stories
                completedCauses,
                // Transaction count
                totalDonations
            }
        });
    } catch (error) {
        // Return 500 if computation fails
        return res.status(500).json({ success: false, message: 'Error fetching dashboard data', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  NGO CAUSES — List causes for an NGO's profile page
// ═══════════════════════════════════════════════════════════════

// Controller to get all causes belonging to a specific NGO
export const getNGOCauses = async (req, res) => {
    // Extracting the NGO ID from the URL parameters
    const { id } = req.params;
    // Starting the try block
    try {
        // Querying all causes linked to this NGO, showing active ones first
        const causes = await Cause.find({ ngoId: id })
            // Sorting active causes first, then by creation date
            .sort({ status: 1, createdAt: -1 });

        // Returning the list of causes
        return res.status(200).json({ success: true, count: causes.length, causes });
    // Catching any errors
    } catch (error) {
        // Returning a 500 error
        return res.status(500).json({ success: false, message: error.message });
    }
};
