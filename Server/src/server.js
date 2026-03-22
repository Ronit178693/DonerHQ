require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize app
const app = express();

// Connect to Database
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());

// Health Check Route
app.get('/', (req, res) => {
    res.json({ message: 'DonerHQ Server is running 🚀' });
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
