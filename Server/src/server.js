// Importing dotenv to load environment variables from the .env file
import 'dotenv/config';
// Importing express to set up our application's backend server
import express from 'express';
// Importing cors to handle cross-origin requests for our frontend
import cors from 'cors';
// Importing express cookieParser for parsing httpOnly authentication cookies
import cookieParser from 'cookie-parser';
// Importing our custom database connection logic to connect MongoDB
import connectDB from './config/db.js';

// Importing our authentication routes for handling login and registration
import authRoutes from './routes/auth.routes.js';
// Importing our user routes for handling profile reading, updating and following NGOs
import userRoutes from './routes/user.routes.js';

// Initializing the express application instance
const app = express();

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

// Parsing all cookies from the request for authentication and session management
app.use(cookieParser());

// Mounting our authentication routes under the /api/auth path
app.use('/api/auth', authRoutes);

// Mounting our user module routes under the /api/users path
app.use('/api/users', userRoutes);

// Setting a simple default endpoint for server connectivity testing
app.get('/', (req, res) => {
    // Sending a status message as JSON response
    res.json({ message: 'DonerHQ Server is running (ES Modules) 🚀' });
});

// Defining a fallback middleware for any routes that were not handled above
app.use((req, res) => {
    // Returning a 404 Route Not Found error as JSON
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Implementing a global error handling middleware to catch all failures
app.use((err, req, res, next) => {
    // Logging the error stack trace to the console for easier debugging
    console.error(err.stack);
    // Returning a generic 500 error response to the client
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Defining the port for the server to listen on from environment variables
const PORT = process.env.PORT || 5000;

// Starting the server and listening for incoming network requests
app.listen(PORT, () => {
    // Printing a success message including the current port once initialized
    console.log(`✅ Server running on port ${PORT}`);
});
