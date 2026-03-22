import mongoose from 'mongoose';

const ngoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    bio: { type: String },
    logo: { type: String }, // Cloudinary URL
    category: { type: String, required: true },
    location: { type: String },
    verified: { type: Boolean, default: false },
    transparencyScore: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    totalRaised: { type: Number, default: 0 },
    causes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cause' }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
}, { timestamps: true });

const NGO = mongoose.model('NGO', ngoSchema);
export default NGO;
