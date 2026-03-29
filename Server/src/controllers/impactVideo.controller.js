// Importing the ImpactVideo model to handle proof-of-work content in the database
import ImpactVideo from '../models/ImpactVideo.js';
// Importing the Cause model to update mission states and link video evidence
import Cause from '../models/Cause.js';
// Importing the EscrowTransaction model to trigger fund releases after video verification
import EscrowTransaction from '../models/EscrowTransaction.js';
// Importing the Donation model to filter videos based on user contribution history
import Donation from '../models/Donation.js';

/**
 * Impact Video Controller
 * Handles video content showing the tangible impact of donations to donors.
 */

// ═══════════════════════════════════════════════════════════════
//  UPLOAD VIDEO — NGOs providing visual proof of impact
// ═══════════════════════════════════════════════════════════════

// Controller for an NGO to upload a new video demonstrating social impact for a finished cause
export const uploadImpactVideo = async (req, res) => {
    // Extracting the target mission ID and the Cloudinary video URL from the request
    const { causeId, videoUrl } = req.body;
    // Starting the try block to process the upload and update related states
    try {
        // Guard clause ensuring all mandatory information is present
        if (!causeId || !videoUrl) {
            // Returning 400 if the mission ID or the video link is missing
            return res.status(400).json({ success: false, message: 'Cause ID and video URL are required' });
        }

        // Verifying that the target mission actually exists in our records
        const cause = await Cause.findById(causeId);
        // Guard clause if no mission matches the provided ID
        if (!cause) return res.status(404).json({ success: false, message: 'Cause not found' });

        // Creating the new ImpactVideo record in the database
        const newVideo = await ImpactVideo.create({
            // Linking to the mission
            causeId,
            // Linking to the authoring NGO
            ngoId: cause.ngoId,
            // Storing the unique video file path
            videoUrl
        });

        // Updating the Cause document to include the video proof and update transparency lifecycle
        await Cause.findByIdAndUpdate(causeId, { 
            // Storing the video URL directly on the cause for easy access 
            impactVideoUrl: videoUrl,
            // Advancing the escrow state to signify that proof has been submitted
            escrowStatus: 'video_uploaded' 
        });

        // Updating the linked Escrow record to notify admins that proof is ready for review
        await EscrowTransaction.findOneAndUpdate({ causeId }, { status: 'video_uploaded' });

        // Returning the successfully created video document and a positive status code
        return res.status(201).json({ success: true, message: 'Impact video uploaded successfully', impactVideo: newVideo });
    // Catching any database errors or update failures during the process
    } catch (error) {
        // Returning a 500 status code with the failure details
        return res.status(500).json({ success: false, message: 'Error uploading impact video', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  GET VIDEOS — Discovery of proof and impact storytelling
// ═══════════════════════════════════════════════════════════════

// Controller to list videos for an NGO or a donor's personalized "Impact Feed"
export const getImpactVideos = async (req, res) => {
    // Starting the try block to query the impact library
    try {
        // Defaulting the query to only show videos that have passed administrative review
        let query = { adminStatus: 'approved' };
        
        // If the requester specifies an NGO ID, filter for that organization's uploads
        if (req.query.ngoId) {
            query.ngoId = req.query.ngoId;
        }

        // Personalized Feed Logic: if a donor wants to see proof for missions they specifically funded
        if (req.user && req.user.role === 'donor' && req.query.feed === 'personal') {
            // Finding all unique mission IDs where the user has a successful 'paid' donation
            const userDonations = await Donation.find({ donorId: req.user._id, status: 'paid' }).distinct('causeId');
            // Adding those mission IDs to the query filter
            query.causeId = { $in: userDonations };
        }

        // Executing the query to find matching impact stories
        const videos = await ImpactVideo.find(query)
            // Populating authoring NGO branding for display
            .populate('ngoId', 'name logo')
            // Populating mission details for context cards
            .populate('causeId', 'title description coverImage goalAmount')
            // Sorting to show the most recently approved proofs at the top
            .sort({ createdAt: -1 });

        // Returning the list of impact stories and the total count to the client
        return res.status(200).json({ success: true, count: videos.length, videos });
    // Catching any database retrieval or population errors
    } catch (error) {
        // Returning 500 status message with failure details
        return res.status(500).json({ success: false, message: 'Error fetching impact videos', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  APPROVE VIDEO — Admin verification of impact authenticity
// ═══════════════════════════════════════════════════════════════

// Controller for Admin to approve or reject a video proof submission
export const approveImpactVideo = async (req, res) => {
    // Extracting the video record ID from the URL parameters
    const { id } = req.params;
    // Extracting the admin's decision and optional feedback from the request body
    const { status, adminNote } = req.body; 
    // Starting the try block for the review process
    try {
        // Finding the specific impact video document pending review
        const video = await ImpactVideo.findById(id);
        // Guard clause ensuring the record exists before processing the decision
        if (!video) return res.status(404).json({ success: false, message: 'Impact video not found' });

        // Setting the new status (approved/rejected) as per admin input
        video.adminStatus = status;
        // Storing the admin's reasoning or next steps for the NGO
        video.adminNote = adminNote || '';
        // Capturing the timestamp of the review decision
        video.reviewedAt = new Date();
        // Committing the decision and audit data to the database
        await video.save();

        // Updating the financial lifecycle based on the review outcome
        if (status === 'approved') {
            // If approved, move the mission state to 'admin_review' for final fund disbursement
            await Cause.findByIdAndUpdate(video.causeId, { escrowStatus: 'admin_review' }); 
            // Updating the escrow contract state to prepare for release
            await EscrowTransaction.findOneAndUpdate({ causeId: video.causeId }, { status: 'admin_review' });
        } else {
            // If rejected, reset the mission state to 'holding' as more proof is needed
            await Cause.findByIdAndUpdate(video.causeId, { escrowStatus: 'holding' });
            // Updating the escrow contract to mark it as 'disputed' / needing attention
            await EscrowTransaction.findOneAndUpdate({ causeId: video.causeId }, { status: 'disputed' });
        }

        // Returning a success message confirming the resolution to the admin
        return res.status(200).json({ success: true, message: `Video ${status} successfully`, impactVideo: video });
    // Catching any errors during the review update or state transitions
    } catch (error) {
        // Returning a 500 status message for server-side processing errors
        return res.status(500).json({ success: false, message: 'Error reviewing impact video', error: error.message });
    }
};
