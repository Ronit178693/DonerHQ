import EscrowTransaction from '../models/EscrowTransaction.js';
import Cause from '../models/Cause.js';
import NGO from '../models/NGO.js';

/**
 * Escrow Transaction Controller
 * Manages funds held in escrow for complex charitable workflows.
 */

// Controller to place funds in escrow (usually called after successful fundraising or per donation)
export const holdFunds = async (req, res) => {
    const { causeId, totalAmount } = req.body;
    try {
        const cause = await Cause.findById(causeId);
        if (!cause) return res.status(404).json({ success: false, message: 'Cause not found' });

        const ngo = await NGO.findById(cause.ngoId);
        if (!ngo) return res.status(404).json({ success: false, message: 'NGO not found' });

        // Check if an escrow already exists for this cause
        let escrow = await EscrowTransaction.findOne({ causeId });
        
        if (escrow) {
            // Update existing escrow
            escrow.totalHeld += totalAmount;
            await escrow.save();
        } else {
            // Create new escrow record
            escrow = await EscrowTransaction.create({
                causeId,
                ngoId: cause.ngoId,
                totalHeld: totalAmount,
                status: 'holding',
                videoDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
            });
        }

        return res.status(201).json({ success: true, message: 'Funds held in escrow successfully', escrow });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error holding funds', error: error.message });
    }
};

// Controller to release funds to the intended recipient (NGO)
export const releaseFunds = async (req, res) => {
    const { id } = req.params; // Escrow ID
    try {
        const escrow = await EscrowTransaction.findById(id);
        if (!escrow) return res.status(404).json({ success: false, message: 'Escrow transaction not found' });

        if (escrow.status !== 'video_uploaded' && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: 'Video proof must be uploaded or action by admin required' });
        }

        // Updating escrow status
        escrow.status = 'released';
        escrow.released = escrow.totalHeld;
        escrow.releaseDate = new Date();
        await escrow.save();

        // Updating the Cause's escrow status
        await Cause.findByIdAndUpdate(escrow.causeId, { escrowStatus: 'released' });

        return res.status(200).json({ success: true, message: 'Funds released successfully', escrow });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error releasing funds', error: error.message });
    }
};

// Controller to handle refunds or cancellations of pending transactions
export const cancelEscrow = async (req, res) => {
    const { id } = req.params;
    try {
        const escrow = await EscrowTransaction.findById(id);
        if (!escrow) return res.status(404).json({ success: false, message: 'Escrow transaction not found' });

        escrow.status = 'refunded';
        await escrow.save();

        // Updating the Cause's escrow status
        await Cause.findByIdAndUpdate(escrow.causeId, { escrowStatus: 'refunded' });

        return res.status(200).json({ success: true, message: 'Escrow cancelled and marked for refund', escrow });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error cancelling escrow', error: error.message });
    }
};

// Controller to get escrow status for a cause
export const getEscrowStatus = async (req, res) => {
    const { causeId } = req.params;
    try {
        const escrow = await EscrowTransaction.findOne({ causeId })
            .populate('causeId', 'title goalAmount raisedAmount')
            .populate('ngoId', 'name logo');

        if (!escrow) return res.status(404).json({ success: false, message: 'Escrow record not found for this cause' });

        return res.status(200).json({ success: true, escrow });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching escrow status', error: error.message });
    }
};
