import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NGO from '../src/models/NGO.js';
import User from '../src/models/User.js';

dotenv.config();

const check = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Check for Ronit
    const user = await User.findOne({ name: /Ronit/i });
    console.log("USER:", user ? { name: user.name, role: user.role, id: user._id } : "User NOT found");
    
    if (user) {
        const ngo = await NGO.findOne({ userId: user._id });
        console.log("NGO_FOR_USER:", ngo ? { name: ngo.name, status: ngo.status, id: ngo._id } : "NGO NOT found for this user");
    }

    const ngos = await NGO.find({});
    console.log("ALL_NGOS_COUNT:", ngos.length);
    process.exit();
};

check();
