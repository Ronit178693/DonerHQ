import User from '../models/User.js';
import NGO from '../models/NGO.js';
import Cause from '../models/Cause.js';
import Donation from '../models/Donation.js';
import EscrowTransaction from '../models/EscrowTransaction.js';
import ImpactVideo from '../models/ImpactVideo.js';
import sendEmail from '../utils/sendEmail.js';


/**
 * Platform Statistics — High-level overview of ecosystem health
 */
export const getPlatformStats = async (req, res) => {
    try {
        const [userCount, ngoCount, causeCount, totalDonated] = await Promise.all([
            User.countDocuments({ role: 'donor' }),
            NGO.countDocuments(),
            Cause.countDocuments({ status: 'active' }),
            Donation.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
        ]);

        const stats = {
            totalUsers: userCount,
            totalNgos: ngoCount,
            activeCauses: causeCount,
            totalRaised: totalDonated[0]?.total || 0,
            pendingApprovals: await NGO.countDocuments({ status: 'pending' }),
            // Only counting funds that are CURRENTLY being held (holding or uploaded)
            // Released or Refunded funds are removed from the active volume stats
            escrowVolume: await EscrowTransaction.aggregate([
                { $match: { status: { $in: ['holding', 'video_uploaded', 'under_review'] } } },
                { $group: { _id: null, total: { $sum: "$totalHeld" } } }
            ]).then(res => res[0]?.total || 0)
        };

        res.status(200).json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch platform stats', error: error.message });
    }
};

/**
 * NGO Verification — Approve or Reject organizational entry
 */
export const getPendingNGOs = async (req, res) => {
    try {
        const pending = await NGO.find({ status: 'pending' }).populate('userId', 'name email');
        res.status(200).json({ success: true, pending });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch pending NGOs', error: error.message });
    }
};

export const updateNGOStatus = async (req, res) => {
    const { id } = req.params;
    const { status, remarks } = req.body; // status: 'approved' or 'rejected'
    try {
        const ngo = await NGO.findById(id).populate('userId', 'email name');
        if (!ngo) return res.status(404).json({ success: false, message: 'NGO not found' });

        ngo.status = status;
        ngo.verified = status === 'approved';
        await ngo.save();

        // 📧 STATUS NOTIFICATION: Informing the NGO of the admin's decision
        const statusHtml = `
            <div style="font-family: sans-serif; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 16px;">
                <h1 style="color: ${status === 'approved' ? '#b9ffe8' : '#ff716c'}; font-size: 24px;">
                    Organization Node: ${status.toUpperCase()}
                </h1>
                <p>Hello ${ngo.name},</p>
                <p>Your organizational verification request has been reviewed. Your status is now: <b>${status}</b>.</p>
                ${status === 'approved' ? '<p>You can now launch new fundraising missions and engage with the donor community.</p>' : '<p>Please review your documentation and re-apply if necessary.</p>'}
                <a href="${process.env.CLIENT_URL}ngo/dashboard" style="display: inline-block; background: ${status === 'approved' ? '#b9ffe8' : '#333'}; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">ACCESS DASHBOARD</a>
            </div>
        `;
        sendEmail(ngo.userId.email, `DonerHQ Verification Status: ${status.toUpperCase()}`, statusHtml);

        res.status(200).json({ success: true, message: `NGO ${status} successfully`, ngo });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating NGO status', error: error.message });
    }
};

/**
 * Escrow Management — Master control over platform liquidity
 */
export const getAllEscrows = async (req, res) => {
    try {
        // Only fetching transactions that are NOT yet released or refunded
        // We want to focus the admin's attention on active capital that needs governance
        const escrows = await EscrowTransaction.find({ status: { $nin: ['released', 'refunded'] } })
            .populate('causeId', 'title goalAmount raisedAmount status impactVideoUrl')
            .populate('ngoId', 'name logo verified')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, escrows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching escrows', error: error.message });
    }
};

export const manageEscrow = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // action: 'release', 'freeze', 'revert'
    try {
        const escrow = await EscrowTransaction.findById(id);
        if (!escrow) return res.status(404).json({ success: false, message: 'Escrow record not found' });

        switch(action) {
            case 'release':
                escrow.status = 'released';
                escrow.released = escrow.totalHeld;
                escrow.releaseDate = new Date();
                
                // 1. Mark the Cause as officially FINISHED
                await Cause.findByIdAndUpdate(escrow.causeId, { 
                    escrowStatus: 'released',
                    status: 'completed' 
                });

                // 2. Mark the uploaded video proof as officially APPROVED in the evidence ledger
                await ImpactVideo.findOneAndUpdate(
                    { causeId: escrow.causeId }, 
                    { adminStatus: 'approved' }
                );
                break;
                
            case 'freeze':
                escrow.status = 'disputed'; // Disputed effectively freezes it
                await Cause.findByIdAndUpdate(escrow.causeId, { escrowStatus: 'disputed' });
                break;
                
            case 'revert':
                escrow.status = 'refunded';
                await Cause.findByIdAndUpdate(escrow.causeId, { escrowStatus: 'refunded' });
                // Note: Logic for moving the actual money in the gateway 
                // would be triggered here in a real production environment.
                break;

            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        await escrow.save();
        res.status(200).json({ success: true, message: `Escrow ${action}ed successfully`, escrow });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Escrow management error', error: error.message });
    }
};

/**
 * User Directory — Visibility into all nodes
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
    }
};
