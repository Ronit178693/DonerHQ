import mongoose from 'mongoose';

// Represents an active fundraising mission with a clear financial goal
const causeSchema = new mongoose.Schema({
    // Which NGO is responsible for this specific fundraiser
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
    
    // Compelling title for the cause (e.g., "Oxygen Tanks for Hospital")
    title: { type: String, required: true },
    
    // Detailed breakdown of how the funds will be used
    description: { type: String, required: true },
    
    // Target amount in the local currency (e.g., 5,00,000 INR)
    goalAmount: { type: Number, required: true },
    
    // Tracker for real-time progress bar display on the UI
    raisedAmount: { type: Number, default: 0 },
    
    // The "Time is Running Out" date for urgency in fundraising
    deadline: { type: Date },
    
    // Defines visibility on the platform (e.g., "completed" causes are moved to archives)
    status: { 
        type: String, 
        enum: ['active', 'completed', 'cancelled'], 
        default: 'active' 
    },
    
    // Status of money held for safety (e.g., "holding" until NGO uploads verification video)
    escrowStatus: { type: String, default: 'holding' },
    
    // The final evidence of impact—a video from the field once funds are used
    impactVideoUrl: { type: String }, 
    
    // NGO's deadline to upload proof of impact before funds are withheld or reviewed
    videoDeadline: { type: Date },
    
    // Unique donor count supporting this specific mission
    donorCount: { type: Number, default: 0 },
    
    // Categorization for filtering and AI recommendations (matches NGO/User interest categories)

    categories: [{ type: String }],
    
    // Searchable AI tags/keywords (e.g., ["monsoon-floods", "water-filtration", "assam"])
    tags: [{ type: String }],
    
    // Main thumbnail for the home feed and search results (hosted on Cloudinary)
    coverImage: { type: String } 
    
}, { 
    // Used for showing "Newly Added" causes on the dashboard
    timestamps: true 
});

// Optimization: Index to instantly load all causes belonging to a specific NGO profile
causeSchema.index({ ngoId: 1 });
causeSchema.index({ tags: 1, categories: 1 });

const Cause = mongoose.model('Cause', causeSchema);
export default Cause;
