import mongoose from 'mongoose';

const escrowTransactionSchema = new mongoose.Schema({
    causeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cause', required: true },
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
    totalHeld: { type: Number, required: true },
    released: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: [
            'holding', 
            'video_uploaded', 
            'admin_review', 
            'released', 
            'disputed', 
            'refunded'
        ], 
        default: 'holding' 
    },
    videoDeadline: { type: Date },
    releaseDate: { type: Date }
}, { timestamps: true });

const EscrowTransaction = mongoose.model('EscrowTransaction', escrowTransactionSchema);
export default EscrowTransaction;
