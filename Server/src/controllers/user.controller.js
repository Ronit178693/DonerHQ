// Importing the User model to interact with user data in the database
import User from '../models/User.js';
// Importing the NGO model to manage NGO-related interactions (following, wishlist)
import NGO from '../models/NGO.js';
// Importing Cause model to handle AI cause recommendations
import Cause from '../models/Cause.js';
// Importing Post model to handle the personalized social media feed
import Post from '../models/Post.js';

// ═══════════════════════════════════════════════════════════════
//  USER PROFILE & SETTINGS
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve the public profile of any user or their own complete dashboard
export const getUserProfile = async (req, res) => {
    // Extracting the user ID from the request parameters sent in the URL
    const { id } = req.params;
    // Starting a try block to catch any database or server execution errors
    try {
        // Querying the database to find the user document by its unique ID
        const user = await User.findById(id)
            // Excluding sensitive fields (impact tokens were stripped out of the project)
            .select('-password -email -otp -otpExpires')
            // Populating the NGO profile if the user is an NGO creator
            .populate('ngoProfile')
            // Populating the social media following list with key metrics
            .populate('following', 'name logo category location followerCount')
            // Populating the team details for the team fundraising feature
            .populate('teamId', 'name members');
            
        // Validating if a user was actually found in the database
        if (!user) {
            // Returning a 404 Not Found response if the user does not exist
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Returning the successfully populated dashboard/profile data to the client
        return res.status(200).json({ success: true, user });
    // Catching any runtime errors during the process
    } catch (error) {
        // Returning a 500 status code with the error message
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update user preferences (interests for the personalized feed algorithm)
export const updateUserProfile = async (req, res) => {
    // These interests feed directly into the personalised feed algorithm
    const { name, interestTags, interests } = req.body;
    // Starting a try block for the update operation
    try {
        // Fetching the currently authenticated user based on the JWT payload
        const user = await User.findById(req.user._id);

        // Updating the user's name if a new name was provided
        if (name) user.name = name;
        // Updating the free-form interest tags if new tags were provided
        if (interestTags) user.interestTags = interestTags;
        // Updating the core onboarding interest categories if provided
        if (interests) user.interests = interests;

        // Saving the modified user document back to the database
        await user.save();

        // Querying the newly updated document to exclude the password before responding
        const updatedUser = await User.findById(user._id).select('-password');

        // Returning a success message along with the updated profile
        return res.status(200).json({ 
            // Marking the operation as successful
            success: true, 
            // Setting a clear message indicating preferences were successfully saved
            message: 'Profile and feed preferences updated successfully', 
            // Attaching the updated user object to the response
            user: updatedUser 
        });
    // Catch block for any internal errors during the update
    } catch (error) {
        // Responding with a 500 error code for server failures
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  SOCIAL MEDIA FEATURES (Follow NGOs like social accounts)
// ═══════════════════════════════════════════════════════════════

// Follow an NGO to see their photo/short video/text posts in the personalized feed
export const followNGO = async (req, res) => {
    // Extracting the target NGO ID from the request body
    const { ngoId } = req.body;
    // Starting a try-catch block for the follow operation
    try {
        // Validating that the target NGO ID was actually provided
        if (!ngoId) {
            // Returning a 400 Bad Request error if the ID is missing
            return res.status(400).json({ success: false, message: 'NGO ID is required' });
        }

        // Searching the database for the target NGO profile
        const ngo = await NGO.findById(ngoId);
        // Checking if the NGO actually exists
        if (!ngo) {
            // Returning a 404 error if the NGO profile could not be found
            return res.status(404).json({ success: false, message: 'NGO not found' });
        }

        // Fetching the currently logged-in user's profile
        const user = await User.findById(req.user._id);

        // Checking if the user's following list already contains this NGO ID
        if (user.following.includes(ngoId)) {
            // Blocking the request to prevent duplicate follow records
            return res.status(400).json({ success: false, message: 'You are already following this NGO' });
        }

        // Pushing the NGO ID into the user's following list (influences feed algorithm)
        user.following.push(ngoId);
        // Saving the user document with the new follow
        await user.save();

        // Incrementing the NGO's follower count metric for their creator dashboard
        ngo.followerCount += 1;
        // Saving the NGO document to persist the new reach metrics
        await ngo.save();

        // Returning a 200 OK response confirming the action
        return res.status(200).json({ success: true, message: `Successfully followed ${ngo.name}` });
    // Catch block for unexpected execution errors
    } catch (error) {
        // Returning a 500 Internal Server Error response
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Unfollow an NGO to stop seeing their posts in the feed
export const unfollowNGO = async (req, res) => {
    // Extracting the target NGO ID from the request body
    const { ngoId } = req.body;
    // Initiating the try block for error handling
    try {
        // Throwing a bad request error if the NGO ID is missing from the payload
        if (!ngoId) {
            // Sending the 400 error response
            return res.status(400).json({ success: false, message: 'NGO ID is required' });
        }

        // Looking up the current authenticated user in the database
        const user = await User.findById(req.user._id);

        // Validating if the user is actually following the target NGO
        if (!user.following.includes(ngoId)) {
            // Rejecting the request if there is no follow relationship to remove
            return res.status(400).json({ success: false, message: 'You are not following this NGO' });
        }

        // Filtering out the target NGO ID from the following array
        user.following = user.following.filter(id => id.toString() !== ngoId.toString());
        // Committing the updated array to the database
        await user.save();

        // Looking up the target NGO to adjust their metrics
        const ngo = await NGO.findById(ngoId);
        // Ensuring we don't accidentally drop the follower count below zero
        if (ngo && ngo.followerCount > 0) {
            // Decrementing the follower count by one
            ngo.followerCount -= 1;
            // Saving the updated metrics to the NGO profile
            await ngo.save();
        }

        // Sending a positive confirmation that the unfollow was successful
        return res.status(200).json({ success: true, message: 'Successfully unfollowed NGO' });
    // Catching any database connection issues or logical errors
    } catch (error) {
        // Responding with a 500 error code
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  PERSONALISED ALGORITHM FEED (New: Social Feed)
// ═══════════════════════════════════════════════════════════════

// Fetch the personalized social media feed based on interests and following
export const getUserFeed = async (req, res) => {
    // Starting a try-catch block for the feed generation logic
    try {
        // Fetching the current user's document to access their interests and following lists
        const user = await User.findById(req.user._id);
        
        // Simulating the personalized feed algorithm by matching NGO content with user preferences
        const feedPosts = await Post.find({
            // Building an OR query block to match multiple feed criteria
            $or: [
                // Condition 1: Include posts authored by NGOs the user explicitly follows
                { authorNGO: { $in: user.following } },
                // Condition 2: Include posts categorised under the user's preferred interests
                { category: { $in: user.interests } }
            ]
        })
        // Sorting the feed to show the newest posts first (reverse chronological timeline)
        .sort({ createdAt: -1 })
        // Limiting the initial feed output to 20 posts to prevent overwhelming the client
        .limit(20)
        // Populating the NGO author details to display their name, logo, and verification on the post
        .populate('authorNGO', 'name logo verified transparencyScore');
        
        // Returning the generated personalized feed back to the user's client
        return res.status(200).json({ success: true, count: feedPosts.length, feed: feedPosts });
    // Catch block to capture any failures in the feed generation
    } catch (error) {
        // Emitting a server error status if fetching fails
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  WISHLIST (Kept: save NGOs for later)
// ═══════════════════════════════════════════════════════════════

// Save an NGO to the wishlist
export const saveNGO = async (req, res) => {
    // Extracting the NGO ID that the user wants to save
    const { ngoId } = req.body;
    // Commencing the function logic inside a try block
    try {
        // Verifying that the client actually submitted an NGO ID
        if (!ngoId) {
            // Firing a 400 error if missing
            return res.status(400).json({ success: false, message: 'NGO ID is required' });
        }

        // Retrieving the current user's model from DB
        const user = await User.findById(req.user._id);

        // Verifying that the target NGO isn't already inside the wishlist
        if (user.savedNGOs.includes(ngoId)) {
            // Dismissing the duplicate save request
            return res.status(400).json({ success: false, message: 'NGO is already in your wishlist' });
        }

        // Adding the target NGO reference to the saved array
        user.savedNGOs.push(ngoId);
        // Finalizing the save operation
        await user.save();

        // Returning positive feedback to the user
        return res.status(200).json({ success: true, message: 'NGO added to wishlist successfully' });
    // Identifying any unknown errors
    } catch (error) {
        // Yielding an error block to the frontend
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Remove an NGO from the wishlist
export const unsaveNGO = async (req, res) => {
    // Identifying the target NGO to remove
    const { ngoId } = req.body;
    // Triggering the block for database instructions
    try {
        // Confirming ID exists in request
        if (!ngoId) {
            // Discarding empty queries
            return res.status(400).json({ success: false, message: 'NGO ID is required' });
        }

        // Fetching user scope
        const user = await User.findById(req.user._id);

        // Filtering out the targeted ID to effect the removal
        user.savedNGOs = user.savedNGOs.filter(id => id.toString() !== ngoId.toString());
        // Saving the purged list back to MongoDB
        await user.save();

        // Providing success notification
        return res.status(200).json({ success: true, message: 'NGO removed from wishlist' });
    // Preparing catch area
    } catch (error) {
        // Standardized failure exit
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Retrieves the user's populated wishlist
export const getWishlist = async (req, res) => {
    // Error shielding
    try {
        // Querying User object while specifically populating their requested saved organizations
        const user = await User.findById(req.user._id).populate('savedNGOs', 'name logo category location transparencyScore following');
        // Transmitting the populated list back
        return res.status(200).json({ success: true, wishlist: user.savedNGOs });
    // Catch condition execution
    } catch (error) {
        // Serving backend error to frontend
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  GAMIFICATION & LEADERBOARD (Kept: streak + consistency based)
// ═══════════════════════════════════════════════════════════════

// Retrieve the top users based on streak and consistency score
export const getLeaderboard = async (req, res) => {
    // Protective enclosure
    try {
        // Querying for accounts labelled strictly as donors
        const topUsers = await User.find({ role: 'donor' })
            // Leaderboard focuses on consistency (streak) over pure donation amounts
            .sort({ leaderboardScore: -1, streak: -1 })
            // Trimming data specifically for the leaderboard views
            .select('name leaderboardScore streak')
            // Capping results at top 100 players
            .limit(100);

        // Funneling the finalized leaderboard array back out
        return res.status(200).json({ success: true, topUsers });
    // Safety net
    } catch (error) {
        // Server side failure dispatch
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  RECOMMENDATIONS (Kept: BERT-powered personalised recommendations)
// ═══════════════════════════════════════════════════════════════

// Get AI recommendations (This route communicates with an ML microservice or simulates it)
export const getRecommendedCauses = async (req, res) => {
    // Isolating execution scope
    try {
        // Securing target user details to extract specific preference arrays
        const user = await User.findById(req.user._id);
        
        // In a deployed application, an axios call would be made to a Flask/FastAPI BERT ML service here
        // Example: const response = await axios.post('http://ml-server/recommend', { interests: user.interests });
        
        // For demonstration, simulating fetched causes by matching local DB with user's selected interest categories
        const recommendedCauses = await Cause.find({ category: { $in: user.interests } }).limit(10);
        
        // Outputting the modeled recommendations back downwards to client
        return res.status(200).json({ success: true, recommendedCauses });
    // Catch-all
    } catch (error) {
        // Sending 500 error flag
        return res.status(500).json({ success: false, message: error.message });
    }
};
