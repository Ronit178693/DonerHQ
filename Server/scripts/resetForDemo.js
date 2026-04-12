import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NGO from '../src/models/NGO.js';
import Post from '../src/models/Post.js';

dotenv.config();

const resetForDemo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to Distributed Ledger...");

        // 1. Delete all NGO Posts
        const postResult = await Post.deleteMany({});
        console.log(`✅ Deleted ${postResult.deletedCount} posts from the environment.`);

        // 2. Reset NGO Verification status
        const ngoResult = await NGO.updateMany(
            {}, 
            { 
                status: 'pending', 
                verified: false 
            }
        );
        console.log(`✅ Reset ${ngoResult.modifiedCount} NGOs to 'pending' state for manual verification.`);

        console.log("\n🚀 THE SYSTEM IS READY FOR THE ADMIN PANEL DEMO.");
        console.log("You can now go to the Admin Dashboard -> Verification Queue to approve them.");
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Reset Error:", err);
        process.exit(1);
    }
};

resetForDemo();
