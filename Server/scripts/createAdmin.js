import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { hashPassword } from '../src/models/User.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/donerhq');
        console.log("Connected to MongoDB...");

        const adminEmail = 'admin@donerhq.com';
        const adminPassword = 'adminpassword123';

        // Check if admin user already exists
        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log(`\n⚠️  Admin user already exists!`);
            console.log(`Email: ${adminEmail}`);
            console.log(`Role: ${admin.role}`);
            console.log(`If you forgot the password, you can delete this user in Mongo or modify it.`);
        } else {
            admin = await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: await hashPassword(adminPassword),
                role: 'admin',
                onboardingComplete: true
            });
            console.log(`\n🚀 ADMIN USER CREATED SUCCESSFULLY!`);
            console.log(`Email: ${adminEmail}`);
            console.log(`Password: ${adminPassword}`);
            console.log(`Role: admin`);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to create Admin:", error);
        process.exit(1);
    }
};

createAdmin();
