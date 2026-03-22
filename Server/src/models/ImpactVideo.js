import mongoose from 'mongoose';

const impactVideoSchema = new mongoose.Schema({
    causeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cause', required: true },
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
    videoUrl: { type: String, required: true }, // Cloudinary URL
    uploadedAt: { type: Date, default: Date.now },
    adminStatus: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    adminNote: { type: String },
    reviewedAt: { type: Date }
}, { timestamps: true });

const ImpactVideo = mongoose.model('ImpactVideo', impactVideoSchema);
export default ImpactVideo;
