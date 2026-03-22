import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    totalDonated: { type: Number, default: 0 },
    leaderboardScore: { type: Number, default: 0 },
    inviteLink: { type: String, unique: true }
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);
export default Team;
