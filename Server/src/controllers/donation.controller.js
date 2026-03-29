import Donation from '../models/Donation.js';
import User from '../models/User.js';
import NGO from '../models/NGO.js';
import Cause from '../models/Cause.js';

/**
 * Donation Controller
 * Handles processing of donations and retrieving donation history.
 */

// Controller to initiate and process a new donation transaction
export const processDonation = async (req, res) => {
    const { causeId, ngoId, amount, razorpayOrderId, isRecurring, frequency } = req.body;
    try {
        // Basic validation
        if (!causeId || !ngoId || !amount || !razorpayOrderId) {
            return res.status(400).json({ success: false, message: 'Missing required donation fields' });
        }

        // Verify cause and NGO exist
        const cause = await Cause.findById(causeId);
        const ngo = await NGO.findById(ngoId);

        if (!cause || !ngo) {
            return res.status(404).json({ success: false, message: 'Cause or NGO not found' });
        }

        // Creating the new donation record
        const newDonation = await Donation.create({
            donorId: req.user._id,
            ngoId,
            causeId,
            amount,
            razorpayOrderId,
            status: 'paid', // Simulating successful payment for now
            isRecurring: isRecurring || false,
            frequency: frequency || 'once'
        });

        // Updating the User's donation history and potentially their streak/score
        await User.findByIdAndUpdate(req.user._id, { 
            $push: { donationHistory: newDonation._id },
            $inc: { leaderboardScore: 10 } // Awarding points for donating
        });

        // Updating the Cause's financial progress and donor count
        await Cause.findByIdAndUpdate(causeId, { 
            $inc: { raisedAmount: amount, donorCount: 1 } 
        });

        // Updating the NGO's total raised amount
        await NGO.findByIdAndUpdate(ngoId, { 
            $inc: { totalRaised: amount } 
        });

        return res.status(201).json({ success: true, message: 'Donation processed successfully', donation: newDonation });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error processing donation', error: error.message });
    }
};

// Controller to retrieve the full history of donations for a user or NGO
export const getDonationHistory = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'donor') {
            query = { donorId: req.user._id };
        } else if (req.user.role === 'ngo') {
            const ngo = await NGO.findOne({ userId: req.user._id });
            if (!ngo) return res.status(404).json({ success: false, message: 'NGO profile not found' });
            query = { ngoId: ngo._id };
        } else {
            // Admin can see all
            query = {};
        }

        const donations = await Donation.find(query)
            .populate('donorId', 'name email')
            .populate('ngoId', 'name logo')
            .populate('causeId', 'title')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, count: donations.length, donations });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching donation history', error: error.message });
    }
};

// Controller to retrieve the specific details and status of a single transaction
export const getDonationDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const donation = await Donation.findById(id)
            .populate('donorId', 'name email')
            .populate('ngoId', 'name logo location bio')
            .populate('causeId', 'title description coverImage goalAmount raisedAmount');

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation record not found' });
        }

        return res.status(200).json({ success: true, donation });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching donation details', error: error.message });
    }
};
