// Importing the EscrowTransaction model to manage the lifecycle of locked donor funds
import EscrowTransaction from '../models/EscrowTransaction.js';
// Importing the Cause model to update the fund release status of specific missions
import Cause from '../models/Cause.js';
// Importing the NGO model to identify the organization awaiting the fund release
import NGO from '../models/NGO.js';

/**
 * Escrow Transaction Controller
 * Manages funds held in escrow to ensure high-accountability charitable workflows.
 */

// ═══════════════════════════════════════════════════════════════
//  HOLD FUNDS — Initial locking of funds pending impact proof
// ═══════════════════════════════════════════════════════════════

// Controller to place funds in escrow (usually called after successful fundraising or per donation)
export const holdFunds = async (req, res) => {
    // Extracting the target mission ID and the total amount to be locked from the request
    const { causeId, totalAmount } = req.body;
    // Starting the try block to handle escrow creation or updates
    try {
        // Finding the target fundraiser document in the database
        const cause = await Cause.findById(causeId);
        // Guard clause ensuring the cause exists before creating an escrow contract
        if (!cause) return res.status(404).json({ success: false, message: 'Cause not found' });

        // Finding the organization that owns this cause to link the escrow record
        const ngo = await NGO.findById(cause.ngoId);
        // Guard clause ensuring the beneficiary organization exists
        if (!ngo) return res.status(404).json({ success: false, message: 'NGO not found' });

        // Searching for an existing active escrow contract for this specific mission
        let escrow = await EscrowTransaction.findOne({ causeId });
        
        // Branching logic: either update existing pool or create a new one
        if (escrow) {
            // Adding the newly donated amount to the current total held in safety
            escrow.totalHeld += totalAmount;
            // Committing the updated balance to the database
            await escrow.save();
        } else {
            // Creating a fresh escrow record if this is the first donation for the mission
            escrow = await EscrowTransaction.create({
                // Linking the mission
                causeId,
                // Linking the organziation
                ngoId: cause.ngoId,
                // Setting the initial locked balance
                totalHeld: totalAmount,
                // Initializing the state as basic 'holding'
                status: 'holding',
                // Setting a 60-day deadline for the NGO to provide proof of impact
                videoDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) 
            });
        }

        // Returning the updated escrow state and a success confirmation back to the client
        return res.status(201).json({ success: true, message: 'Funds held in escrow successfully', escrow });
    // Catching any database errors or contract creation failures
    } catch (error) {
        // Returning a 500 status code with the specific internal failure details
        return res.status(500).json({ success: false, message: 'Error holding funds', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  RELEASE FUNDS — Moving money from safety to the NGO account
// ═══════════════════════════════════════════════════════════════

// Controller to release funds to the intended recipient (NGO) after verification
export const releaseFunds = async (req, res) => {
    // Extracting the unique Escrow record ID from the URL parameters
    const { id } = req.params;
    // Starting the try block for the fund release process
    try {
        // Fetching the escrow contract from the collection
        const escrow = await EscrowTransaction.findById(id);
        // Guard clause to ensure the transaction record is present
        if (!escrow) return res.status(404).json({ success: false, message: 'Escrow transaction not found' });

        // Security check: funds can only be released if a video is uploaded or by an admin
        if (escrow.status !== 'video_uploaded' && req.user.role !== 'admin') {
            // Blocking the release if proof of impact is missing
            return res.status(400).json({ success: false, message: 'Video proof must be uploaded or action by admin required' });
        }

        // Updating the internal state of the escrow to 'released'
        escrow.status = 'released';
        // Marking the entire held amount as formally released
        escrow.released = escrow.totalHeld;
        // Capturing the exact moment the funds were moved
        escrow.releaseDate = new Date();
        // Committing the release status to the database
        await escrow.save();

        // Synchronizing the Cause's state to reflect that the money is now out of escrow
        await Cause.findByIdAndUpdate(escrow.causeId, { escrowStatus: 'released' });

        // Returning the finalized escrow transaction data back to the client
        return res.status(200).json({ success: true, message: 'Funds released successfully', escrow });
    // Catching any update failures or authorization errors
    } catch (error) {
        // Returning a 500 status code for server-side processing errors
        return res.status(500).json({ success: false, message: 'Error releasing funds', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  CANCEL/REFUND — Returning funds if missions fail or lack proof
// ═══════════════════════════════════════════════════════════════

// Controller to handle refunds or cancellations of pending escrow transactions
export const cancelEscrow = async (req, res) => {
    // Extracting the escrow ID from the URL parameters
    const { id } = req.params;
    // Starting the try block for the cancellation protocol
    try {
        // Finding the target escrow document
        const escrow = await EscrowTransaction.findById(id);
        // Guard clause checking for record existence
        if (!escrow) return res.status(404).json({ success: false, message: 'Escrow transaction not found' });

        // Updating the status to 'refunded' (flags system to initiate donor returns)
        escrow.status = 'refunded';
        // Committing the cancellation to the database
        await escrow.save();

        // Updating the primary mission record to show funds are being refunded
        await Cause.findByIdAndUpdate(escrow.causeId, { escrowStatus: 'refunded' });

        // Returning the updated escrow record confirming the refund status
        return res.status(200).json({ success: true, message: 'Escrow cancelled and marked for refund', escrow });
    // Catching any database errors during the refund process
    } catch (error) {
        // Returning a 500 status message to the client
        return res.status(500).json({ success: false, message: 'Error cancelling escrow', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  ESCROW AUDIT — Public/Internal status tracking for a cause
// ═══════════════════════════════════════════════════════════════

// Controller to get transparency/escrow status for a specific fundraising cause
export const getEscrowStatus = async (req, res) => {
    // Extracting the cause ID from the URL parameters
    const { causeId } = req.params;
    // Starting the try block for status retrieval
    try {
        // Finding the escrow contract and populating related mission and organization data
        const escrow = await EscrowTransaction.findOne({ causeId })
            // Enlisting the fundraiser title and financial targets
            .populate('causeId', 'title goalAmount raisedAmount')
            // Enlisting the NGO branding for the status dashboard
            .populate('ngoId', 'name logo');

        // Guard clause if no escrow record has been initialized for this mission yet
        if (!escrow) return res.status(404).json({ success: false, message: 'Escrow record not found for this cause' });

        // Returning the enriched escrow status dashboard data back to the client
        return res.status(200).json({ success: true, escrow });
    // Catching any parsing or database lookup errors
    } catch (error) {
        // Returning a 500 status with the failure details
        return res.status(500).json({ success: false, message: 'Error fetching escrow status', error: error.message });
    }
};
