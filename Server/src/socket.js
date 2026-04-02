// Importing the Server class from the socket.io library
import { Server } from 'socket.io';

// Initializing a global variable to store the shared socket.io instance
let io;

/**
 * Initialize Socket.io Utility
 * Wraps around the standard NodeJS HTTP server to enable real-time features.
 */
export const initSocket = (server) => {
    // Creating the Websocket server instance with custom configuration
    io = new Server(server, {
        // Enforcing CORS policy to allow cross-site communication with our frontend
        cors: {
            // Function to validate the origin of incoming WebSocket handshakes
            origin: function (origin, callback) {
                // Permitting requests that don't have an origin header (like from our own backend)
                if (!origin) return callback(null, true);
                // Pre-defining the local developer environment origins
                const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
                // Injecting the production frontend URL from environment variables if present
                if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);
                
                // Checking if the incoming origin is in our whitelist or using a Vercel subdomain
                if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                    // Origin validated: Proceed with the connection
                    callback(null, true);
                } else {
                    // Security Breach: Rejecting the connection with a 403-style error
                    callback(new Error('Not allowed by CORS policy'));
                }
            },
            // Allowing the server to accept httpOnly authentication cookies over the websocket
            credentials: true
        }
    });

    /**
     * CONNECTION GATEWAY
     * This listener fires every time a new client (browser) handshakes with our server.
     */
    io.on('connection', (socket) => {
        // Logging the unique socket ID of the new visitor for session tracking 
        console.log(`📡 New real-time connection established: ${socket.id}`);

        /**
         * ROOM MANAGEMENT - MISSION UPDATES
         * Clients can 'subscribe' to specific fundraising causes to get live progress bars.
         */
        socket.on('join_cause', (causeId) => {
            // Adding the client to a dedicated room for this specific cause
            socket.join(causeId);
            // Logging the subscription for administrative traceability
            console.log(`User ${socket.id} is now tracking updates for cause: ${causeId}`);
        });

        // Event listener for when a client closes their browser or leaves the site
        socket.on('disconnect', () => {
            // Logging the cleanup of the stale socket connection
            console.log(`🔌 Client disconnected from live stream: ${socket.id}`);
        });
    });

    // Returning the initialized IO instance for the server entrypoint to consume
    return io;
};

/**
 * Global Instance Provider
 * Used by controllers (Donations, Leads, Feed) to broadcast events to all active users.
 */
export const getIO = () => {
    // Guard clause checking if the system attempted to use the socket before it was ready
    if (!io) {
        // Critical error: System cannot broadcast without an initialized engine
        throw new Error("Socket.io engine has not been initialized yet!");
    }
    // Returning the ready-to-use broadcaster instance
    return io;
};
