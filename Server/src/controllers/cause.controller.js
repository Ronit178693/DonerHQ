import Cause from '../models/Cause.js';
import NGO from '../models/NGO.js';

/**
 * Cause Controller
 * Handles creation, listing, and updates of charitable causes.
 */

// Controller to create a new campaign or charitable cause
export const createCause = async (req, res) => {
    const { title, description, goalAmount, deadline, coverImage } = req.body;
    try {
        // Finding the NGO profile associated with the currently logged-in user
        const ngo = await NGO.findOne({ userId: req.user._id });

        if (!ngo) {
            return res.status(404).json({ success: false, message: 'NGO profile not found' });
        }

        // Ensuring the NGO is verified before allowing them to create a cause
        if (!ngo.verified) {
            return res.status(403).json({ success: false, message: 'Your NGO must be verified before you can create a cause' });
        }

        // Basic validation for required fields
        if (!title || !description || !goalAmount) {
            return res.status(400).json({ success: false, message: 'Title, description, and goal amount are required' });
        }

        // Creating the new cause document
        const newCause = await Cause.create({
            ngoId: ngo._id,
            title,
            description,
            goalAmount,
            deadline: deadline || null,
            coverImage: coverImage || ''
        });

        // Updating the NGO's list of causes
        await NGO.findByIdAndUpdate(ngo._id, { $push: { causes: newCause._id } });

        return res.status(201).json({ success: true, message: 'Cause created successfully', cause: newCause });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error creating cause', error: error.message });
    }
};

// Controller to retrieve a list of all current causes across the platform
export const getCauses = async (req, res) => {
    const { ngoId, status, search, page = 1, limit = 10 } = req.query;
    try {
        const query = {};
        if (ngoId) query.ngoId = ngoId;
        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: 'i' };

        const causes = await Cause.find(query)
            .populate('ngoId', 'name logo verified transparencyScore')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Cause.countDocuments(query);

        return res.status(200).json({
            success: true,
            count: causes.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            causes
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching causes', error: error.message });
    }
};

// Controller to retrieve complete details and metrics for a specific cause
export const getCauseDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const cause = await Cause.findById(id).populate('ngoId', 'name logo bio location verified transparencyScore');

        if (!cause) {
            return res.status(404).json({ success: false, message: 'Cause not found' });
        }

        return res.status(200).json({ success: true, cause });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching cause details', error: error.message });
    }
};
