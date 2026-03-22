import mongoose from 'mongoose';

// Defines the profile and impact stats of an NGO listed on DonerHQ
const ngoSchema = new mongoose.Schema({
    // Official name of the registered Non-Governmental Organization
    name: { type: String, required: true },
    
    // Mission statement or backstory to inspire donors
    bio: { type: String },
    
    // Hosted via Cloudinary to show the official foundation logo
    logo: { type: String }, 
    
    // Focus area (e.g., "Animal Welfare", "Cancer Research") for category filtering
    category: { type: String, required: true },
    
    // Headquarters or area of operation (e.g., "Mumbai, India")
    location: { type: String },
    
    // Administrative approval status for authenticity within the app
    verified: { type: Boolean, default: false },
    
    // A live score representing their reliability and reporting consistency
    transparencyScore: { type: Number, default: 0 },
    
    // Total size of the donor community supporting this NGO via follows
    followerCount: { type: Number, default: 0 },
    
    // Total historical amount raised through the DonerHQ platform
    totalRaised: { type: Number, default: 0 },
    
    // Array links to the different fundraising goals (causes) they've launched
    causes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cause' }],
    
    // Feed updates/posts published by the NGO to engage their followers
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
    
}, { 
    // Capturing exactly when the NGO joined the platform
    timestamps: true 
});

const NGO = mongoose.model('NGO', ngoSchema);
export default NGO;
