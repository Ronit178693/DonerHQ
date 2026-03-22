import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js'; // Added .js extension as required by ES Modules

// Initialize app
const app = express();

// Connect to Database
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());

// Health Check Route
app.get('/', (req, res) => {
    res.json({ message: 'DonerHQ Server is running (ES Modules) 🚀' });
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
