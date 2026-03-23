// Middleware to authorize specific user roles for individual routes
export const authorize = (...roles) => {
    // Returning an arrow function to handle the request with a set of roles
    return (req, res, next) => {
        // Comparing the current user's role against the provided list
        if (!roles.includes(req.user.role)) {
            // Returning a forbidden error if the user lacks the necessary permissions
            return res.status(403).json({ success: false, message: "You don't have permission" });
        }
        // Proceeding down the middleware chain since permissions are valid
        next();
    };
};
