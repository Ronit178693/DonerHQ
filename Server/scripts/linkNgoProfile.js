import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import NGO from '../src/models/NGO.js';

dotenv.config();

const fix = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find the user
    const user = await User.findOne({ name: /Ronit/i });
    if (!user) { console.log("User not found"); process.exit(1); }
    console.log("User:", user.name, "| role:", user.role, "| id:", user._id);
    
    // Find the NGO by userId
    let ngo = await NGO.findOne({ userId: user._id });
    console.log("NGO by userId:", ngo ? ngo.name : "NOT FOUND");
    
    // If no NGO, create one
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
        console.log("✅ Created NGO:", ngo.name, "| id:", ngo._id);
    }
    
    // Link ngoProfile on user
    user.ngoProfile = ngo._id;
    user.role = 'ngo';
    await user.save();
    
    console.log(`✅ User "${user.name}" linked to NGO "${ngo.name}"`);
    console.log(`   role: ${user.role} | ngoProfile: ${user.ngoProfile}`);
    process.exit();
};

fix();
