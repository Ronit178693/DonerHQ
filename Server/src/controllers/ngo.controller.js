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
// Importing the Cloudinary upload utility to handle logo and media hosting
import { uploadOnCloudinary } from '../utils/cloudinary.js';

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
            // Closing the populate options
            })
            // Populate user ID and name
            .populate('userId', 'name');

        // Check if NGO exists
        if (!ngo) {
            // Return 404 if not found
            return res.status(404).json({ success: false, message: 'NGO not found' });
        // Closing the guard clause
        }

        // Return success response with NGO data
        return res.status(200).json({ success: true, ngo });
    // Catching errors
    } catch (error) {
        // Return 500 error if something fails
        return res.status(500).json({ success: false, message: 'Error fetching NGO profile', error: error.message });
    // Closing the try-catch block
    }
// Closing the getNGOProfile controller
};

// Controller to update NGO profile details (only the owning user can do this)
export const updateNGOProfile = async (req, res) => {
    // Extract ID from request parameters
    const { id } = req.params;
    // Extract fields from request body (logo is now handled via Multer if file is present)
    const { name, bio, location, category } = req.body;
    // Try block for error handling
    try {
        // Find NGO by ID
        const ngo = await NGO.findById(id);

        // Check if NGO exists
        if (!ngo) {
            // Return 404 if not found
            return res.status(404).json({ success: false, message: 'NGO not found' });
        // Closing the guard clause
        }

        // Authorization check to ensure user owns the profile
        if (ngo.userId.toString() !== req.user?._id?.toString()) {
            // Return 403 if unauthorized
            return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
        // Closing the auth check
        }

        // Initialize object for selective updates
        const updates = {};
        // Check if a new name is being provided
        if (name) updates.name = name;
        // Check if updated bio content is present
        if (bio) updates.bio = bio;
        // Check if geographic location updates are needed
        if (location) updates.location = location;
        // Check if the organizational category is changing
        if (category) updates.category = category;

        // Handling logo upload if a new file was provided in the update request
        if (req.file) {
            // Uploading the new logo to Cloudinary
            const logoRes = await uploadOnCloudinary(req.file.path);
            // If successful, update the logo URL in our staging object
            if (logoRes) updates.logo = logoRes.secure_url;
        }

        // Perform atomic update and return updated document
        const updatedNGO = await NGO.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        // Return success response with updated NGO data
        return res.status(200).json({ success: true, message: 'NGO profile updated successfully', ngo: updatedNGO });
    // Catching errors
    } catch (error) {
        // Return 500 error if update fails
        return res.status(500).json({ success: false, message: 'Error updating NGO profile', error: error.message });
    // Closing the try-catch block
    }
// Closing the updateNGOProfile controller
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
        // Closing the category check
        }

        // Adding a location filter using a case-insensitive regex match
        if (location) {
            // Allowing partial location matches
            filter.location = { $regex: location, $options: 'i' };
        // Closing the location check
        }

        // Adding a text search filter for NGO name or bio (escape regex chars to prevent ReDoS)
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Using an OR condition
            filter.$or = [
                // Match name
                { name: { $regex: escaped, $options: 'i' } },
                // Match bio
                { bio: { $regex: escaped, $options: 'i' } }
            ];
        // Closing the search check
        }

        // Counting total matching documents
        const total = await NGO.countDocuments(filter);

        // Querying the database with the filter
        const ngos = await NGO.find(filter)
            // Selecting fields
            .select('name logo category location bio transparencyScore followerCount totalRaised verified')
            // Sorting
            .sort({ transparencyScore: -1 })
            // Paginating
            .skip((page - 1) * limit)
            // Limiting
            .limit(parseInt(limit));

        // Returning the paginated list
        return res.status(200).json({
            // Success flag
            success: true,
            // Total volume
            total,
            // Page number
            page: parseInt(page),
            // Total pages
            pages: Math.ceil(total / limit),
            // List of NGOs
            ngos
        // Closing the response JSON
        });
    // Catching errors
    } catch (error) {
        // Return 500
        return res.status(500).json({ success: false, message: error.message });
    // Closing the try-catch block
    }
// Closing the discoverNGOs controller
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
            // Return 404
            return res.status(404).json({ success: false, message: 'NGO profile not found' });
        // Closing the guard clause
        }

        // Ensure NGO is approved
        if (ngo.status !== 'approved') {
            // Return 403
            return res.status(403).json({ success: false, message: 'Your NGO must be verified before you can post' });
        // Closing the approval check
        }

        // Validate type
        if (!type) {
            // Return 400
            return res.status(400).json({ success: false, message: 'Post type is required' });
        // Closing the type check
        }

        // Validate media URL
        if ((type === 'photo' || type === 'video') && !mediaUrl) {
            // Return 400
            return res.status(400).json({ success: false, message: 'Media URL is required for photo/video posts' });
        // Closing the media URL check
        }

        // Create post
        const newPost = await Post.create({
            // NGO ID
            ngoId: ngo._id,
            // Type
            type,
            // Media
            mediaUrl: mediaUrl || '',
            // Caption
            caption: caption || '',
            // Tags
            tags: tags || [],
            // Linked Cause
            linkedCauseId: linkedCauseId || null
        });

        // Atomic push to NGO
        await NGO.findByIdAndUpdate(ngo._id, { $push: { posts: newPost._id } });

        // Return success
        return res.status(201).json({ success: true, message: 'Post created successfully', post: newPost });
    // Catching errors
    } catch (error) {
        // Return 500
        return res.status(500).json({ success: false, message: 'Error creating post', error: error.message });
    // Closing the try-catch block
    }
// Closing the createPost controller
};

// Controller to delete a post
export const deletePost = async (req, res) => {
    // Extract post ID
    const { postId } = req.params;
    // Try block
    try {
        // Find post
        const post = await Post.findById(postId);
        // Check existence
        if (!post) {
            // Return 404
            return res.status(404).json({ success: false, message: 'Post not found' });
        // Closing the guard clause
        }

        // Find NGO
        const ngo = await NGO.findOne({ userId: req.user._id });
        // Authorization check
        if (!ngo || post.ngoId.toString() !== ngo._id.toString()) {
            // Return 403
            return res.status(403).json({ success: false, message: 'Unauthorized to delete this post' });
        // Closing the auth check
        }

        // Atomic pull from NGO
        await NGO.findByIdAndUpdate(ngo._id, { $pull: { posts: postId } });
        // Delete post
        await Post.findByIdAndDelete(postId);

        // Return success
        return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    // Catching errors
    } catch (error) {
        // Return 500
        return res.status(500).json({ success: false, message: 'Error deleting post', error: error.message });
    // Closing the try-catch block
    }
// Closing the deletePost controller
};

// Controller to get all posts for a specific NGO
export const getNGOPosts = async (req, res) => {
    // Extract ID
    const { id } = req.params;
    // Try block
    try {
        // Find posts
        const posts = await Post.find({ ngoId: id })
            // Sort
            .sort({ createdAt: -1 })
            // Populate cause
            .populate('linkedCauseId', 'title goalAmount raisedAmount status');

        // Return success
        return res.status(200).json({ success: true, count: posts.length, posts });
    // Catching errors
    } catch (error) {
        // Return 500
        return res.status(500).json({ success: false, message: error.message });
    // Closing the try-catch block
    }
// Closing the getNGOPosts controller
};

// ═══════════════════════════════════════════════════════════════
//  SOCIAL — Follow / Unfollow an NGO (like Instagram)
// ═══════════════════════════════════════════════════════════════

// Controller to follow an NGO
export const followNGO = async (req, res) => {
    // Extract ID
    const { id } = req.params;
    // Try block
    try {
        // Check NGO existence
        const ngoExists = await NGO.exists({ _id: id });
        // Guard clause
        if (!ngoExists) {
            // Return 404
            return res.status(404).json({ success: false, message: 'NGO not found' });
        }

        // Check if already following
        const user = await User.findById(req.user._id);
        if (user.following.map(f => f.toString()).includes(id)) {
            return res.status(400).json({ success: false, message: 'Already following this NGO' });
        }

        // Atomic update user following
        await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { following: id } }
        );

        // Atomic increment NGO followers
        await NGO.findByIdAndUpdate(id, { $inc: { followerCount: 1 } });

        // Return success
        return res.status(200).json({ success: true, message: 'Successfully followed NGO' });
    // Catching errors
    } catch (error) {
        // Return 500
        return res.status(500).json({ success: false, message: 'Error following NGO', error: error.message });
    }
};

// Controller to unfollow an NGO
export const unfollowNGO = async (req, res) => {
    // Extract ID
    const { id } = req.params;
    // Try block
    try {
        // Atomic pull from user
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { following: id } }
        );

        // Check previous status
        if (user.following.includes(id)) {
            // Atomic decrement NGO followers
            await NGO.findByIdAndUpdate(id, { $inc: { followerCount: -1 } });
            // Return success
            return res.status(200).json({ success: true, message: 'Successfully unfollowed NGO' });
        // Closing the success check
        }

        // Return 400
        return res.status(400).json({ success: false, message: 'Not following this NGO' });
    // Catching errors
    } catch (error) {
        // Return 500
        return res.status(500).json({ success: false, message: 'Error unfollowing NGO', error: error.message });
    // Closing the try-catch block
    }
// Closing the unfollowNGO controller
};

// ═══════════════════════════════════════════════════════════════
//  NGO CREATOR DASHBOARD — Analytics (post reach, donor conversions)
// ═══════════════════════════════════════════════════════════════

// Controller to get the NGO's analytics dashboard data
export const getNGODashboard = async (req, res) => {
    // Try block
    try {
        // Find local NGO
        const ngo = await NGO.findOne({ userId: req.user._id });

        // Guard clause
        if (!ngo) {
            // Return 404
            return res.status(404).json({ success: false, message: 'NGO profile not found' });
        // Closing the guard clause
        }

        // Social aggregation
        const postStats = await Post.aggregate([
            // Filter match
            { $match: { ngoId: ngo._id } },
            // Group sum
            {
                $group: {
                    // ID
                    _id: null,
                    // Sums
                    totalReach: { $sum: '$reach' },
                    totalLikes: { $sum: '$likes' },
                    totalShares: { $sum: '$shares' },
                    totalDonateClicks: { $sum: '$donateClicks' },
                    totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Fallback stats
        const stats = postStats[0] || {
            totalReach: 0,
            totalLikes: 0,
            totalShares: 0,
            totalDonateClicks: 0,
            totalComments: 0,
            count: 0
        };

        // Fetch causes
        const causes = await Cause.find({ ngoId: ngo._id });
        // Active count
        const activeCauses = causes.filter(c => c.status === 'active').length;
        // Completed count
        const completedCauses = causes.filter(c => c.status === 'completed').length;

        // Transaction count
        const totalDonations = await Donation.countDocuments({ ngoId: ngo._id, status: 'paid' });

        // Response compilation
        return res.status(200).json({
            // Success flag
            success: true,
            // Snapshot
            profile: {
                name: ngo.name,
                followers: ngo.followerCount,
                transparencyScore: ngo.transparencyScore,
                totalRaised: ngo.totalRaised,
                status: ngo.status
            },
            // Social numbers
            postAnalytics: {
                totalPosts: stats.count,
                totalReach: stats.totalReach,
                totalLikes: stats.totalLikes,
                totalShares: stats.totalShares,
                totalComments: stats.totalComments,
                totalDonateClicks: stats.totalDonateClicks
            },
            // Mission numbers
            causeAnalytics: {
                totalCauses: causes.length,
                activeCauses,
                completedCauses,
                totalDonations
            }
        // Closing the response JSON
        });
    // Catching errors
    } catch (error) {
        // Return 500
        return res.status(500).json({ success: false, message: 'Error fetching dashboard data', error: error.message });
    // Closing the try-catch block
    }
// Closing the getNGODashboard controller
};

// ═══════════════════════════════════════════════════════════════
//  NGO CAUSES — List causes for an NGO's profile page
// ═══════════════════════════════════════════════════════════════

// Controller to get all causes belonging to a specific NGO
export const getNGOCauses = async (req, res) => {
    // Extract ID
    const { id } = req.params;
    // Try block
    try {
        // Query database
        const causes = await Cause.find({ ngoId: id })
            // Sort
            .sort({ status: 1, createdAt: -1 });

        // Return array
        return res.status(200).json({ success: true, count: causes.length, causes });
    // Catching errors
    } catch (error) {
        // Return 500
        return res.status(500).json({ success: false, message: error.message });
    // Closing the try-catch block
    }
// Closing the getNGOCauses controller
};
