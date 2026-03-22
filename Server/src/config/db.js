import mongoose from 'mongoose';

// High-level function to manage the connection life-cycle to the database
const connectDB = async () => {
    try {
        // Attempting to connect using the secret URI stored in the hidden .env file
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        // Logging success to the console so we know the backend is powered up
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Capturing and logging any connection failure (e.g., bad password, network down)
        console.error(`❌ Connection Error: ${error.message}`);
        
        // Smart error feedback for common misconfigurations
        if (error.name === 'MongoParseError') {
            console.error('⚠️ Check your MONGO_URI in the .env file — it looks like the format is wrong.');
        } else if (error.name === 'MongoNetworkError') {
            console.error('🌐 Network error: Could not reach the database. Is your internet connection active?');
        } else if (error.name === 'MongoAuthenticationError') {
            console.error('🔑 Authentication failed: Check your database username and password.');
        }

        // Shutting down the server if we can't reach the database (it's useless without it!)
        process.exit(1);
    }
};

export default connectDB;
