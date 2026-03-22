// Loads environment variables from your .env file
import 'dotenv/config';
// The main framework for building APIs in Node.js
import express from 'express';
// Allows your frontend to securely communicate with this backend from a different URL
import cors from 'cors';
// Importing our custom database connection logic
import connectDB from './config/db.js';

// Initializing the application instance
const app = express();

// Establishing connection to MongoDB Atlas
connectDB();

// Built-in body-parser to read JSON data from incoming requests
app.use(express.json());

// Activating Cross-Origin Resource Sharing for secure API access
app.use(cors());

// A simple endpoint to verify the server is active and responding
app.get('/', (req, res) => {
    res.json({ message: 'DonerHQ Server is running (ES Modules) 🚀' });
});

// Setting the communication port (defaults to 5000 if not specified in .env)
const PORT = process.env.PORT || 5000;

// Starting the server listening process
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
