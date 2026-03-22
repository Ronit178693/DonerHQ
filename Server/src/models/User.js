import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['donor', 'ngo', 'admin'], 
        default: 'donor' 
    },
    interestTags: [{ type: String }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NGO' }],
    savedNGOs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NGO' }],
    donationHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donation' }],
    streak: { type: Number, default: 0 },
    leaderboardScore: { type: Number, default: 0 },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
