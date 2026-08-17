import mongoose from 'mongoose';

// A high-impact video proving that funds were used for the specified mission
const impactVideoSchema = new mongoose.Schema({
    // Link to the fundraiser that this video completes
    causeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cause', required: true },
    
    // The NGO that filmed and uploaded this proof
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
    
    // The video file URL hosted on Cloudinary
    videoUrl: { type: String, required: true }, 
    
    // Tracking the submission date for transparency reports
    uploadedAt: { type: Date, default: Date.now },
    
    // Administrative logic to approve or reject the quality/authenticity of the video
    adminStatus: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    
    // Notes for the NGO if the video is rejected and needs re-filming
    adminNote: { type: String },
    
    // Date of the final approval decision
    reviewedAt: { type: Date }
    
}, { 
    // Capturing timestamps for overall audit tracking
    timestamps: true 
});

// Indexes for fast impact proof lookups by cause and NGO
impactVideoSchema.index({ causeId: 1 });
impactVideoSchema.index({ ngoId: 1 });

const ImpactVideo = mongoose.model('ImpactVideo', impactVideoSchema);
export default ImpactVideo;
