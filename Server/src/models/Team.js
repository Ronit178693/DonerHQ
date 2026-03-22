import mongoose from 'mongoose';

// Defines a fundraising group where multiple donors pool their impact
const teamSchema = new mongoose.Schema({
    // Name of the group (e.g., "Delhi University Donors")
    name: { type: String, required: true },
    
    // The user who created the team and has administrative rights
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Array of all donors who have joined this team
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Aggregated financial impact from all members combined
    totalDonated: { type: Number, default: 0 },
    
    // Cumulative points used for the Team-vs-Team leaderboard
    leaderboardScore: { type: Number, default: 0 },
    
    // A unique slug or ID to generate a link for inviting new members
    inviteLink: { type: String, unique: true }
    
}, { 
    // Tracking when the team was founded
    timestamps: true 
});

const Team = mongoose.model('Team', teamSchema);
export default Team;
