// Importing the Cause model to interact with the fundraisers collection in the database
import Cause from '../models/Cause.js';
// Importing the NGO model to manage organizational profiles and verification statuses
import NGO from '../models/NGO.js';
// Importing the Cloudinary upload utility to handle asset hosting
import { uploadOnCloudinary } from '../utils/cloudinary.js';

/**
 * Cause Controller
 * Handles creation, listing, and updates of charitable causes or fundraising missions.
 */

// ═══════════════════════════════════════════════════════════════
//  CREATE CAUSE — Starting a new fundraising mission
// ═══════════════════════════════════════════════════════════════

// Controller to create a new campaign or charitable cause
export const createCause = async (req, res) => {
    // Destructuring essential mission fields from the request body
    const { title, description, goalAmount, deadline } = req.body;
    // Starting the try block to manage database operations and potential failures
    try {
        // Finding the NGO profile associated with the currently logged-in user
        const ngo = await NGO.findOne({ userId: req.user._id });

        // Guard clause to check if the NGO profile exists in the system
        if (!ngo) {
            return res.status(404).json({ success: false, message: 'NGO profile not found' });
        }

        // Ensuring the NGO is verified by the platform admin before allowing them to fundraise
        if (!ngo.verified) {
            return res.status(403).json({ success: false, message: 'Your NGO must be verified before you can create a cause' });
        }

        // Basic validation checking for mandatory title, description, and goal amount fields
        if (!title || !description || !goalAmount) {
            return res.status(400).json({ success: false, message: 'Title, description, and goal amount are required' });
        }

        // Handling cover image upload if a file was provided in the request
        let coverImageUrl = '';
        if (req.file) {
            // Uploading the temporarily stored file to Cloudinary
            const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
            // Updating the URL if the upload was successful
            if (cloudinaryResponse) {
                coverImageUrl = cloudinaryResponse.secure_url;
            }
        }

        // Creating the new cause document in the MongoDB database
        const newCause = await Cause.create({
            // Linking the cause back to the verified NGO's profile ID
            ngoId: ngo._id,
            // Setting the public-facing title for the mission
            title,
            // Setting the storytelling description explaining the objective
            description,
            // Setting the financial target for the fundraiser
            goalAmount,
            // Assigning the optional deadline date if provided or null for open-ended missions
            deadline: deadline || null,
            // Storing the cover image URL hosted on Cloudinary or setting an empty string
            coverImage: coverImageUrl || ''
        });

        // Atomically updating the NGO's document to push the new cause's ID
        await NGO.findByIdAndUpdate(ngo._id, { $push: { causes: newCause._id } });

        // Returning the successfully created cause document
        return res.status(201).json({ success: true, message: 'Cause created successfully', cause: newCause });
    // Catching any database errors, validation failures, or server-side issues
    } catch (error) {
        // Returning a 500 status code with the specific error message for debugging
        return res.status(500).json({ success: false, message: 'Error creating cause', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  LIST CAUSES — Discovery and filtering of search results
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve a list of all current causes across the platform based on filters
export const getCauses = async (req, res) => {
    // Extracting optional filters and pagination controls from the URL query string
    const { ngoId, status, search, page = 1, limit = 10 } = req.query;
    // Starting the try block to perform the search and retrieval
    try {
        // Initializing an empty query object to build the search filter dynamically
        const query = {};
        // If an NGO ID is provided, narrow the results to causes from that specific organization
        if (ngoId) query.ngoId = ngoId;
        // If a status filter is provided (e.g., active, finished), apply it to the query
        if (status) query.status = status;
        // If a search keyword is provided, perform a case-insensitive regex search on the cause title
        if (search) query.title = { $regex: search, $options: 'i' };

        // Finding causes that match all provided query parameters
        const causes = await Cause.find(query)
            // Populating key NGO display data for the cause's card layout
            .populate('ngoId', 'name logo verified transparencyScore')
            // Sorting results such that the newest missions appear at the top
            .sort({ createdAt: -1 })
            // Skipping previously retrieved pages based on current pagination state
            .skip((page - 1) * limit)
            // Capping the total results per page for performance and clarity
            .limit(parseInt(limit));

        // Counting the total number of documents matching the query for accurate pagination metadata
        const total = await Cause.countDocuments(query);

        // Returning the paginated results along with metadata describing the total count and page availability
        return res.status(200).json({
            // Flagging successfully processed request
            success: true,
            // Current number of records in this response
            count: causes.length,
            // Total volume of records across all pages
            total,
            // The current page number
            page: parseInt(page),
            // The total number of available pages based on the limit
            pages: Math.ceil(total / limit),
            // The actual array of cause documents
            causes
        });
    // Catching any errors during query execution or populate logic
    } catch (error) {
        // Returning a 500 status with specific failure details
        return res.status(500).json({ success: false, message: 'Error fetching causes', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  CAUSE DETAILS — Detailed profile and transparency metrics 
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve complete details and metrics for a specific cause using its ID
export const getCauseDetails = async (req, res) => {
    // Extracting the unique cause ID from the request URL parameters
    const { id } = req.params;
    // Starting the try block for detail lookup
    try {
        // Finding the specific cause document and populating its authoring NGO's full profile
        const cause = await Cause.findById(id).populate('ngoId', 'name logo bio location verified transparencyScore');

        // Guard clause checking if the requested cause record actually exists
        if (!cause) {
            // Returning a 404 response if the ID does not match any document in the database
            return res.status(404).json({ success: false, message: 'Cause not found' });
        }

        // Returning the enriched cause profile to the client UI
        return res.status(200).json({ success: true, cause });
    // Catching any errors during ID parsing or database lookup
    } catch (error) {
        // Returning a 500 internal server error with the failure message
        return res.status(500).json({ success: false, message: 'Error fetching cause details', error: error.message });
    }
};
