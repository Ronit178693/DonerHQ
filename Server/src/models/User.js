import mongoose from 'mongoose';

// Define the schema for all types of users (Donors, NGOs, and Admins)
const userSchema = new mongoose.Schema({
    // Full name of the user for profile display and communications
    name: { type: String, required: true },
    
    // Unique email for login and sending donation receipts
    email: { type: String, required: true, unique: true },
    
    // Hashed password for secure authentication
    password: { type: String, required: true },
    
    // Defines the user's capabilities (NGOs have different tools than Donors)
    role: { 
        type: String, 
        enum: ['donor', 'ngo', 'admin'], 
        default: 'donor' 
    },
    
    // Topics the user cares about (e.g., "Environment") to personalize their feed
    interestTags: [{ type: String }],
    
    // List of NGOs the user follows for real-time updates on their home feed
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NGO' }],
    
    // Users can "Bookmark" NGOs they want to support later
    savedNGOs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NGO' }],
    
    // Tracking for receipts and total impact calculation
    donationHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donation' }],
    
    // Gamification: Consecutive days of activity to keep user engagement high
    streak: { type: Number, default: 0 },
    
    // Accumulated points for the global and team-based Leaderboards
    leaderboardScore: { type: Number, default: 0 },
    
    // Link to the user's fund-raising team (optional)
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
    
}, { 
    // Automatically creates 'createdAt' and 'updatedAt' for record keeping
    timestamps: true 
});

const User = mongoose.model('User', userSchema);
export default User;
