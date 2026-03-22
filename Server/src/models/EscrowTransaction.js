import mongoose from 'mongoose';

// Handles the multi-step verification and secure release of donor funds
const escrowTransactionSchema = new mongoose.Schema({
    // Which fundraising mission this money belongs to
    causeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cause', required: true },
    
    // Which NGO is waiting for the fund release
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
    
    // The total amount locked in safety pending verification
    totalHeld: { type: Number, required: true },
    
    // The portion of funds that have been manually approved for release
    released: { type: Number, default: 0 },
    
    // Tracking the safety journey of the donors' money
    status: { 
        type: String, 
        enum: [
            'holding',        // Initial state after fundraising ends
            'video_uploaded', // NGO has provided proof of impact
            'admin_review',   // Admin is checking the documentation
            'released',       // Funds have been sent to NGO
            'disputed',       // Issues found with the proof/project
            'refunded'        // Money returned to donors due to failure
        ], 
        default: 'holding' 
    },
    
    // Deadline for the NGO to provide proof of how they spent the money
    videoDeadline: { type: Date },
    
    // The exact date the funds are moved from Escrow to the NGO's account
    releaseDate: { type: Date }
    
}, { 
    // Tracking when the escrow contract was created
    timestamps: true 
});

const EscrowTransaction = mongoose.model('EscrowTransaction', escrowTransactionSchema);
export default EscrowTransaction;
