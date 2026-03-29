// Importing the Donation model to interact with the transaction records in the database
import Donation from '../models/Donation.js';
// Importing the User model to manage donor profiles and update their contributions
import User from '../models/User.js';
// Importing the NGO model to track total funds raised by organizations
import NGO from '../models/NGO.js';
// Importing the Cause model to update fundraising progress for specific missions
import Cause from '../models/Cause.js';

/**
 * Donation Controller
 * Handles processing of incoming donations, auditing history, and detailed record retrieval.
 */

// ═══════════════════════════════════════════════════════════════
//  PROCESS DONATION — Capturing and distributing new funds
// ═══════════════════════════════════════════════════════════════

// Controller to initiate and process a new donation transaction
export const processDonation = async (req, res) => {
    // Destructuring all essential transaction data from the request body
    const { causeId, ngoId, amount, razorpayOrderId, isRecurring, frequency } = req.body;
    // Starting the try block to manage atomic updates and potential failures
    try {
        // Basic validation checking for mandatory mission, organization, and currency fields
        if (!causeId || !ngoId || !amount || !razorpayOrderId) {
            // Returning a 400 response if any transaction metadata is missing
            return res.status(400).json({ success: false, message: 'Missing required donation fields' });
        }

        // Verifying that the target cause actually exists in the database
        const cause = await Cause.findById(causeId);
        // Verifying that the recipient NGO actually exists in the database
        const ngo = await NGO.findById(ngoId);

        // Guard clause to ensure both the mission and organization are valid
        if (!cause || !ngo) {
            // Returning a 404 response if either record is missing
            return res.status(404).json({ success: false, message: 'Cause or NGO not found' });
        }

        // Creating the new internal donation record with a default paid status
        const newDonation = await Donation.create({
            // Linking the transaction to the currently authenticated donor
            donorId: req.user._id,
            // Associating the funds with the recipient organization
            ngoId,
            // Linking the money to a specific fundraising mission
            causeId,
            // Storing the exact amount donated
            amount,
            // Associating the record with the external Razorpay order ID for auditing
            razorpayOrderId,
            // Manually setting status to 'paid' (simulating successful gateway response)
            status: 'paid',
            // Flagging if this is a repeat/subscription donation
            isRecurring: isRecurring || false,
            // Storing the interval for recurring gifts (weekly, monthly, once)
            frequency: frequency || 'once'
        });

        // Updating the User's profile to record their active participation
        await User.findByIdAndUpdate(req.user._id, { 
            // Pushing the new donation ID into their personal contribution history array
            $push: { donationHistory: newDonation._id },
            // Rewarding the donor with leaderboard points for their social impact contribution
            $inc: { leaderboardScore: 10 }
        });

        // Updating the Cause's financial state to reflect the new donation
        await Cause.findByIdAndUpdate(causeId, { 
            // Incrementing the total amount raised and the unique donor counter
            $inc: { raisedAmount: amount, donorCount: 1 } 
        });

        // Updating the NGO's high-level performance metrics
        await NGO.findByIdAndUpdate(ngoId, { 
            // Incrementing the organization's total lifetime fundraising amount
            $inc: { totalRaised: amount } 
        });

        // Returning the finalized donation record and a success message to the client
        return res.status(201).json({ success: true, message: 'Donation processed successfully', donation: newDonation });
    // Catching any database connection issues or update failures
    } catch (error) {
        // Returning a 500 status code with the specific internal failure details
        return res.status(500).json({ success: false, message: 'Error processing donation', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  DONATION HISTORY — Role-based audit logs for transparency
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve the full history of donations filtered by user role
export const getDonationHistory = async (req, res) => {
    // Starting the try block for collection traversal
    try {
        // Initializing the query filter object
        let query = {};
        
        // Logical branching to filter results based on the requester's permissions
        if (req.user.role === 'donor') {
            // Donors can only view their own personal contribution records
            query = { donorId: req.user._id };
        } else if (req.user.role === 'ngo') {
            // Fetching the NGO document to find their organization's unique ID
            const ngo = await NGO.findOne({ userId: req.user._id });
            // Blocking access if no NGO profile is found for this user account
            if (!ngo) return res.status(404).json({ success: false, message: 'NGO profile not found' });
            // NGOs can view all incoming donations directed to their organization
            query = { ngoId: ngo._id };
        } else {
            // Admins bypass all filters and can view the entire global transaction ledger
            query = {};
        }

        // Finding donation records matching the authorized query filter
        const donations = await Donation.find(query)
            // Populating basic donor identity fields for display
            .populate('donorId', 'name email')
            // Populating organization identity for clarity
            .populate('ngoId', 'name logo')
            // Populating the mission title to show where the money went
            .populate('causeId', 'title')
            // Sorting chronologically to show the most recent gifts at the top
            .sort({ createdAt: -1 });

        // Returning the array of transaction logs and the total count to the client
        return res.status(200).json({ success: true, count: donations.length, donations });
    // Catching any authentication or database retrieval errors
    } catch (error) {
        // Returning a 500 status message with the failure details
        return res.status(500).json({ success: false, message: 'Error fetching donation history', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  DONATION DETAILS — In-depth receipt and status lookup
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve the specific details and status of a single transaction by ID
export const getDonationDetails = async (req, res) => {
    // Extracting the transaction ID from the URL parameters
    const { id } = req.params;
    // Starting the try block for detailed lookup
    try {
        // Finding the specific donation and populating all nested metadata for a full receipt view
        const donation = await Donation.findById(id)
            // Enlisting donor contact details
            .populate('donorId', 'name email')
            // Enlisting organizational mission and branding
            .populate('ngoId', 'name logo location bio')
            // Enlisting the fundraising mission's progress and goals
            .populate('causeId', 'title description coverImage goalAmount raisedAmount');

        // Guard clause ensuring the requested record exists in the system
        if (!donation) {
            // Returning 404 if no record matches the provided transaction ID
            return res.status(404).json({ success: false, message: 'Donation record not found' });
        }

        // Returning the complete populated donation receipt to the client UI
        return res.status(200).json({ success: true, donation });
    // Catching any parsing or lookup errors during retrieval 
    } catch (error) {
        // Returning a 500 status code with the caught error details 
        return res.status(500).json({ success: false, message: 'Error fetching donation details', error: error.message });
    }
};
