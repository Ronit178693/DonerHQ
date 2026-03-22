import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
    type: { 
        type: String, 
        enum: ['photo', 'video', 'text'], 
        required: true 
    },
    mediaUrl: { type: String }, // Cloudinary URL
    caption: { type: String },
    tags: [{ type: String }],
    linkedCauseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cause' },
    likes: { type: Number, default: 0 },
    comments: [{ 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    shares: { type: Number, default: 0 },
    donateClicks: { type: Number, default: 0 },
    reach: { type: Number, default: 0 }
}, { timestamps: true });

// Index for sorting by newest
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;
