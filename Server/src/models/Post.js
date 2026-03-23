import mongoose from 'mongoose';

// Defines a social update (photo, video, or text) to engage the donor feed
const postSchema = new mongoose.Schema({
    // The NGO that published this update
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
    
    // Media format (e.g., "video" for an impact story, "photo" for a receipt)
    type: { 
        type: String, 
        enum: ['photo', 'video', 'text'], 
        required: true 
    },
    
    // The actual image or video file stored on Cloudinary
    mediaUrl: { type: String }, 
    
    // The text description or storytelling behind the post
    caption: { type: String },
    
    // Searchable tags (e.g., ["urgent", "flood-relief"]) for discovery
    tags: [{ type: String }],
    
    // Optional link to a fundraiser so donors can click "Donate" directly from the post
    linkedCauseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cause' },
    
    // Quantity of likes from the donor community for social proof
    likes: { type: Number, default: 0 },
    
    // Thread of donor interactions and questions
    comments: [{ 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    
    // Tracking how many times this story was reshared outside the app
    shares: { type: Number, default: 0 },
    
    // Conversion metrics—how many people clicked to donate based on this post
    donateClicks: { type: Number, default: 0 },
    
    // Unique viewers reached by this post's algorithm placement
    reach: { type: Number, default: 0 }
    
}, { 
    // Critical for sorting the "Latest Updates" feed
    timestamps: true 
});

// Optimization: Indexes for high-speed feed sorting and tag discovery
postSchema.index({ createdAt: -1 }); // Loads newest posts instantly for infinite scroll
postSchema.index({ tags: 1 });      // Speeds up searching by #tags (e.g., #environment)

const Post = mongoose.model('Post', postSchema);
export default Post;
