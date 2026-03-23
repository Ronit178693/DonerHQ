// Importing the jwt library for verifying authentication tokens
import jwt from 'jsonwebtoken';
// Importing our User model for database lookups during authentication
import User from '../models/User.js';

// Middleware to protect routes that require authentication
export const protect = async (req, res, next) => {
    // Destructuring the token from the client's cookies
    const { token } = req.cookies;
    try {
        // Checking if no token is provided in the request
        if (!token) {
            // Returning an error if the user is not authenticated
            return res.status(401).json({ success: false, message: 'Not authorized, no token' });
        }
        // Verifying the provided token using our stored secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Looking up the user in the database by ID and excluding the password
        req.user = await User.findById(decoded.id).select('-password');
        // Validating the existence of the user associated with the token
        if (!req.user) {
            // Returning an error if the user record could not be found
            return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
        }
        // Passing control to the next middleware or route handler
        next();
    } catch (error) {
        // Catching any token validation or server failures
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};
