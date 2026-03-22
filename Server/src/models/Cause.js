import mongoose from 'mongoose';

const causeSchema = new mongoose.Schema({
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    goalAmount: { type: Number, required: true },
    raisedAmount: { type: Number, default: 0 },
    deadline: { type: Date },
    status: { 
        type: String, 
        enum: ['active', 'completed', 'cancelled'], 
        default: 'active' 
    },
    escrowStatus: { type: String, default: 'holding' },
    impactVideoUrl: { type: String }, // Cloudinary URL
    videoDeadline: { type: Date },
    donorCount: { type: Number, default: 0 },
    coverImage: { type: String } // Cloudinary URL
}, { timestamps: true });

const Cause = mongoose.model('Cause', causeSchema);
export default Cause;
