// DonerHQ Live Server - Last Restart Triggered: 2026-04-12
// Importing dotenv to load environment variables from the .env file
import 'dotenv/config';
// Importing express to set up our application's backend server
import express from 'express';
// Importing cors to handle cross-origin requests for our frontend
import cors from 'cors';
// Importing express cookieParser for parsing httpOnly authentication cookies
import cookieParser from 'cookie-parser';
// Importing the native http module for creating a server with socket.io support
import http from 'http';
// Importing our custom database connection logic to connect MongoDB
import connectDB from './config/db.js';
// Importing our custom Socket.io initialization logic for real-time features
import { initSocket } from './socket.js';

import compression from 'compression';

import helmet from 'helmet';



// Importing our authentication routes for handling login and registration
import authRoutes from './routes/auth.routes.js';
// Importing our user routes for handling profile reading, updating and following NGOs
import userRoutes from './routes/user.routes.js';
// Importing our NGO routes for profile, discovery, posting, and analytics
import ngoRoutes from './routes/ngo.routes.js';
// Importing our post routes for social feed, interactions and content creation
import postRoutes from './routes/post.routes.js';
// Importing our team routes for collective fundraising and group management
import teamRoutes from './routes/team.routes.js';
// Importing our cause routes for fundraising mission discovery and creation
import causeRoutes from './routes/cause.routes.js';
// Importing our donation routes for transaction processing and history auditing
import donationRoutes from './routes/donation.routes.js';
// Importing our escrow routes for managed fund safety and release workflows
import escrowRoutes from './routes/escrow.routes.js';
// Importing our impact video routes for proof-of-work discovery and review
import impactVideoRoutes from './routes/impactVideo.routes.js';
// Importing our algorithmic feed routes for high-relevance content ranking
import feedRoutes from './routes/feed.routes.js';
import adminRoutes from './routes/admin.routes.js';
import contactRoutes from './routes/contact.route.js';


// Initializing the express application instance
const app = express();

app.use(helmet())
app.use(compression());
// Enabling trust proxy for secure cookies behind reverse proxies (like Vercel)
app.set('trust proxy', 1);

// Calling our database connection logic once the app starts up
connectDB();

// Configuring CORS middleware with origin-validation and credentials support
app.use(cors({
    // Using a whitelist of origins in addition to dynamic patterns
    origin: function (origin, callback) {
        // Allowing server-to-server or Postman requests that don't have an origin
        if (!origin) return callback(null, true);
        // Predefined development origins for the React/Next frontend
        const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
        // Adding any production client URL defined in the environment variables
        if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

        // Validating the incoming origin against our list or the Vercel domain
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            // Success: the origin is allowed to make requests
            callback(null, true);
        } else {
            // Failure: rejecting the origin for security purposes
            callback(new Error('Not allowed by CORS'));
        }
    },
    // Required to allow the browser to include httpOnly cookies in the request
    credentials: true
}));

// Parsing incoming JSON payloads before they reach our route handlers
app.use(express.json());

// Parsing URL-encoded form data (needed for multipart/form-data fallback)
app.use(express.urlencoded({ extended: true }));

// Serving uploaded media files statically (local fallback when Cloudinary is unavailable)
app.use('/uploads', express.static('public/uploads'));

// Parsing all cookies from the request for authentication and session management
app.use(cookieParser());

// Mounting our authentication routes under the /api/auth path
app.use('/api/auth', authRoutes);

// Mounting our user module routes under the /api/users path
app.use('/api/users', userRoutes);

// Mounting our NGO module routes under the /api/ngos path
app.use('/api/ngos', ngoRoutes);

// Mounting our post module routes under the /api/posts path
app.use('/api/posts', postRoutes);

// Mounting our team module routes under the /api/teams path
app.use('/api/teams', teamRoutes);

// Mounting our cause module routes under the /api/causes path
app.use('/api/causes', causeRoutes);

// Mounting our donation transaction routes under the /api/donations path
app.use('/api/donations', donationRoutes);

// Mounting our escrow management routes under the /api/escrow path
app.use('/api/escrow', escrowRoutes);

// Mounting our impact proof video routes under the /api/impact-videos path
app.use('/api/impact-videos', impactVideoRoutes);

// Mounting our algorithmic feed ranking routes under the /api/feed path
app.use('/api/feed', feedRoutes);

// Mounting our administrative control routes under the /api/admin path
app.use('/api/admin', adminRoutes);

app.use('/api/contact', contactRoutes);

// Setting a simple default endpoint for server connectivity testing
app.get('/', (req, res) => {
    // Sending a status message as JSON response
    res.json({ message: 'DonerHQ Server is running (ES Modules) 🚀' });
});

// Implementing a global error handling middleware to catch all failures
// This MUST have 4 parameters to be recognized as error middleware by Express
app.use((err, req, res, next) => {
    // Logging the error stack trace to the console for easier debugging
    console.error(err.stack);
    // Returning a generic 500 error response to the client
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Defining a fallback middleware for any routes that were not handled above
app.use((req, res) => {
    // Returning a 404 Route Not Found error as JSON
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Defining the port for the server to listen on from environment variables
const PORT = process.env.PORT || 5000;

// Creating a base NodeJS Server instance from our Express Application
const server = http.createServer(app);

// Initializing the Socket.io instance with our created server to enable WebSockets
initSocket(server);

// Starting the server and listening for incoming network requests on the defined port
server.listen(PORT, () => {
    // Printing a success message to the console once the server is live and ready
    console.log(`✅ Server running on port ${PORT} with Real-time Engine 🚀`);
});
