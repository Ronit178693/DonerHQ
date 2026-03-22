import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Connection Error: ${error.message}`);
        
        // Provide more detailed feedback based on the error
        if (error.name === 'MongoParseError') {
            console.error('⚠️  Check your MONGO_URI in the .env file — it looks like the format is wrong.');
        } else if (error.name === 'MongoNetworkError') {
            console.error('🌐 Network error: Could not reach the database. Is your internet connection active?');
        } else if (error.name === 'MongoAuthenticationError') {
            console.error('🔑 Authentication failed: Check your database username and password.');
        }

        // Exit process with failure
        process.exit(1);
    }
};

export default connectDB;
