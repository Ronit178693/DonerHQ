import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import NGO from '../src/models/NGO.js';

dotenv.config();

const upgrade = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Upgrade User Role
    const user = await User.findOneAndUpdate(
        { email: /ronit/i },
        { 
            role: 'ngo',
            ngoProfile: null // Reset to let the dashboard handle it, or we create one below
        },
        { new: true }
    );
    
    if (!user) {
        console.log("❌ User not found");
        process.exit(1);
    }
    
    console.log(`✅ User ${user.name} upgraded to NGO role.`);

    // 2. Create/Sync NGO Profile
    let ngo = await NGO.findOne({ userId: user._id });
    if (!ngo) {
        ngo = await NGO.create({
            name: "Ronit's Impact Node",
            bio: "Driving change through technology and transparency.",
            category: "Education",
            location: "Mumbai, India",
            userId: user._id,
            status: 'approved',
            verified: true,
            transparencyScore: 95
        });
        console.log(`✅ Created NGO profile: ${ngo.name}`);
    } else {
        ngo.status = 'approved';
        ngo.verified = true;
        await ngo.save();
        console.log(`✅ Existing NGO profile ${ngo.name} marked as approved.`);
    }

    process.exit();
};

upgrade();
