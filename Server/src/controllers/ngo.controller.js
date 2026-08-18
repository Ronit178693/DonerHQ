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
import { generateAiTags } from '../services/aiTagging.service.js';

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

// Controller to list all approved NGOs with AI smart search across categories, tags, name, bio & location
export const discoverNGOs = async (req, res) => {
    // Extracting optional query parameters for filtering from the URL
    const { location, search, page = 1, limit = 12 } = req.query;
    // Beginning the try block
    try {
        // Building a dynamic filter object that starts with only approved NGOs
        const filter = { status: 'approved' };

        // Adding a location filter using a case-insensitive regex match
        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }

        // Smart AI Search across name, bio, location, categories, and tags
        if (search && search.trim() !== '') {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = new RegExp(escaped, 'i');

            // Extract high-level categories and low-level tags from search phrase via Gemini AI
            const { categories: searchCategories, tags: searchTags } = await generateAiTags(search);

            const searchConditions = [
                { name: searchRegex },
                { bio: searchRegex },
                { location: searchRegex }
            ];

            // Match categories array index
            if (searchCategories && searchCategories.length > 0) {
                searchConditions.push({ categories: { $in: searchCategories } });
            }

            // Match tags array index
            if (searchTags && searchTags.length > 0) {
                searchConditions.push({ tags: { $in: searchTags } });
            }

            filter.$or = searchConditions;
        }

        // Counting total matching documents
        const total = await NGO.countDocuments(filter);

        // Querying the database with the filter (using multi-key indexes)
        const ngos = await NGO.find(filter)
            .select('name logo category categories tags location bio transparencyScore followerCount totalRaised verified')
            .sort({ transparencyScore: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Returning the paginated list
        return res.status(200).json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            ngos
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  SOCIAL MEDIA POSTING — NGOs create photo/video/text posts
// ═══════════════════════════════════════════════════════════════

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
        }

        // Find NGO
        const ngo = await NGO.findOne({ userId: req.user._id });
        // Authorization check
        if (!ngo || post.ngoId.toString() !== ngo._id.toString()) {
            // Return 403
            return res.status(403).json({ success: false, message: 'Unauthorized to delete this post' });
        }

        // Atomic pull from NGO
        await NGO.findByIdAndUpdate(ngo._id, { $pull: { posts: postId } });
        // Delete post
        await Post.findByIdAndDelete(postId);

        // Return success
        return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error deleting post', error: error.message });
    }
};

// Controller to get all posts for a specific NGO
export const getNGOPosts = async (req, res) => {
    const { id } = req.params;
    try {
        const posts = await Post.find({ ngoId: id })
            .sort({ createdAt: -1 })
            .populate('linkedCauseId', 'title goalAmount raisedAmount status');

        return res.status(200).json({ success: true, count: posts.length, posts });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  SOCIAL — Follow / Unfollow an NGO (Supports URL params :id or body.ngoId)
// ═══════════════════════════════════════════════════════════════

// Controller to follow an NGO
export const followNGO = async (req, res) => {
    const targetId = req.params.id || req.body.ngoId;
    if (!targetId) {
        return res.status(400).json({ success: false, message: 'NGO ID is required' });
    }
    try {
        const ngoExists = await NGO.exists({ _id: targetId });
        if (!ngoExists) {
            return res.status(404).json({ success: false, message: 'NGO not found' });
        }

        const user = await User.findById(req.user._id);
        if (user.following.map(f => f.toString()).includes(targetId)) {
            return res.status(400).json({ success: false, message: 'Already following this NGO' });
        }

        await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { following: targetId } }
        );

        await NGO.findByIdAndUpdate(targetId, { $inc: { followerCount: 1 } });

        return res.status(200).json({ success: true, message: 'Successfully followed NGO' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error following NGO', error: error.message });
    }
};

// Controller to unfollow an NGO
export const unfollowNGO = async (req, res) => {
    const targetId = req.params.id || req.body.ngoId;
    if (!targetId) {
        return res.status(400).json({ success: false, message: 'NGO ID is required' });
    }
    try {
        const user = await User.findById(req.user._id);
        if (!user.following.map(f => f.toString()).includes(targetId)) {
            return res.status(400).json({ success: false, message: 'Not following this NGO' });
        }

        await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { following: targetId } }
        );

        await NGO.findByIdAndUpdate(targetId, { $inc: { followerCount: -1 } });

        return res.status(200).json({ success: true, message: 'Successfully unfollowed NGO' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error unfollowing NGO', error: error.message });
    }
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
