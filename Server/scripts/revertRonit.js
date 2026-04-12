import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import NGO from '../src/models/NGO.js';

dotenv.config();

const revert = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to database...");

        // 1. Find the user
        const user = await User.findOne({ email: /ronit/i });
        
        if (!user) {
            console.log("❌ User with 'ronit' in email not found.");
            process.exit(0);
        }

        console.log(`Found user: ${user.name} (${user.email})`);

        // 2. Clear NGO profile and revert role
        const oldNgoProfileId = user.ngoProfile;
        
        user.role = 'donor';
        user.ngoProfile = undefined;
        // Optionally clean up name if it got changed, but usually script didn't touch it.
        // user.name = "Ronit"; 
        
        await user.save();
        console.log("✅ User role reverted to 'donor'.");

        // 3. Delete the specific NGO profile created for them
        if (oldNgoProfileId) {
            await NGO.findByIdAndDelete(oldNgoProfileId);
            console.log("✅ Associated NGO profile deleted.");
        } else {
            // Also check for any NGO profile with their userId just in case
            const extraNgos = await NGO.find({ userId: user._id });
            for (const ngo of extraNgos) {
                await NGO.findByIdAndDelete(ngo._id);
                console.log(`✅ Deleted extra NGO profile: ${ngo.name}`);
            }
        }

        console.log("\n🚀 DONE: Your account has been restored to a Donor profile.");
        console.log("Please refresh your browser to see the User Dashboard.");
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Error reverting account:", err);
        process.exit(1);
    }
};

revert();
