import ImpactVideo from '../models/ImpactVideo.js';
import Cause from '../models/Cause.js';
import EscrowTransaction from '../models/EscrowTransaction.js';
import Donation from '../models/Donation.js';

/**
 * Impact Video Controller
 * Handles video content showing the tangible impact of donations.
 */

// Controller for an NGO to upload a new video demonstrating social impact
export const uploadImpactVideo = async (req, res) => {
    const { causeId, videoUrl } = req.body;
    try {
        if (!causeId || !videoUrl) {
            return res.status(400).json({ success: false, message: 'Cause ID and video URL are required' });
        }

        const cause = await Cause.findById(causeId);
        if (!cause) return res.status(404).json({ success: false, message: 'Cause not found' });

        // Verifying the NGO owns this cause
        // (Assuming req.user logic is handled in middleware)
        
        const newVideo = await ImpactVideo.create({
            causeId,
            ngoId: cause.ngoId,
            videoUrl
        });

        // Updating the Cause status
        await Cause.findByIdAndUpdate(causeId, { 
            impactVideoUrl: videoUrl,
            escrowStatus: 'video_uploaded' 
        });

        // Updating the Escrow record if it exists
        await EscrowTransaction.findOneAndUpdate({ causeId }, { status: 'video_uploaded' });

        return res.status(201).json({ success: true, message: 'Impact video uploaded successfully', impactVideo: newVideo });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error uploading impact video', error: error.message });
    }
};

// Controller to list videos for an NGO or a donor's personalised feed
export const getImpactVideos = async (req, res) => {
    try {
        let query = { adminStatus: 'approved' };
        
        // If checking for a specific NGO's uploads
        if (req.query.ngoId) {
            query.ngoId = req.query.ngoId;
        }

        // If donor wants their personal impact feed (videos from causes they donated to)
        if (req.user && req.user.role === 'donor' && req.query.feed === 'personal') {
            const userDonations = await Donation.find({ donorId: req.user._id, status: 'paid' }).distinct('causeId');
            query.causeId = { $in: userDonations };
        }

        const videos = await ImpactVideo.find(query)
            .populate('ngoId', 'name logo')
            .populate('causeId', 'title description coverImage goalAmount')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, count: videos.length, videos });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching impact videos', error: error.message });
    }
};

// Controller for Admin to approve/reject a video proof
export const approveImpactVideo = async (req, res) => {
    const { id } = req.params;
    const { status, adminNote } = req.body; // status: 'approved' or 'rejected'
    try {
        const video = await ImpactVideo.findById(id);
        if (!video) return res.status(404).json({ success: false, message: 'Impact video not found' });

        video.adminStatus = status;
        video.adminNote = adminNote || '';
        video.reviewedAt = new Date();
        await video.save();

        // If approved, trigger escrow release status
        if (status === 'approved') {
            await Cause.findByIdAndUpdate(video.causeId, { escrowStatus: 'admin_review' }); // Moving to review for final release
            await EscrowTransaction.findOneAndUpdate({ causeId: video.causeId }, { status: 'admin_review' });
        } else {
            // If rejected, NGO might need to re-upload
            await Cause.findByIdAndUpdate(video.causeId, { escrowStatus: 'holding' });
            await EscrowTransaction.findOneAndUpdate({ causeId: video.causeId }, { status: 'disputed' });
        }

        return res.status(200).json({ success: true, message: `Video ${status} successfully`, impactVideo: video });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error reviewing impact video', error: error.message });
    }
};
