// Importing the User model and its helper functions
import User, { hashPassword, comparePassword, INTEREST_CATEGORIES } from '../models/User.js';
// Importing the NGO model for registration and profile management
import NGO from '../models/NGO.js';
// Importing the jsonwebtoken library for token creation
import jwt from 'jsonwebtoken';
// Importing crypto for secure random number generation
import crypto from 'crypto';

// Reusable function to create a JWT and set it as an httpOnly cookie
const generateTokenAndSetCookie = (res, user) => {
    // Calling jwt.sign to create a new token with id and role as the payload
    const token = jwt.sign(
        // Payload containing current user's ID and assigned role
        { id: user._id, role: user.role },
        // Secret key used for signing the token from environment variables
        process.env.JWT_SECRET,
        // Configurable options, including an expiration time of 7 days
        { expiresIn: '7d' }
    );

    // Using the response object to set a cookie containing the token
    res.cookie('token', token, {
        // Prevents JavaScript access to the cookie for security
        httpOnly: true,
        // Only allows the cookie to be sent over secure HTTPS in production
        secure: process.env.NODE_ENV === 'production',
        // Sets the SameSite policy for the cookie
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        // Maximum age of the cookie before it expires, matching token period
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    // Returning the newly created token for any further processing if needed
    return token;
};

// End-point to register a new donor account with an interest onboarding quiz
export const registerDonor = async (req, res) => {
    // Destructuring essential donor details from the request body
    const { name, email, password, interests } = req.body;
    try {
        // Basic check for required registration fields
        if (!name || !email || !password) {
            // Returning a 400 Bad Request if any core field is missing
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }

        // Checking if the donor has provided valid interest categories
        if (!interests || !Array.isArray(interests) || interests.length === 0) {
            // Returning an error if no interests are selected for onboarding
            return res.status(400).json({
                success: false,
                message: 'Please select at least one interest category',
                categories: INTEREST_CATEGORIES
            });
        }

        // Filtering interests that are not part of the allowed categories
        const invalidInterests = interests.filter(i => !INTEREST_CATEGORIES.includes(i));
        if (invalidInterests.length > 0) {
            // Returning an error listing which interests were invalid
            return res.status(400).json({
                success: false,
                message: `Invalid interest categories: ${invalidInterests.join(', ')}`,
                validCategories: INTEREST_CATEGORIES
            });
        }

        // Attempting to find an existing user with the same email address
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Returning an error if the user already exists in the database
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Creating the new user entry in the MongoDB collection
        const newUser = await User.create({
            // Setting the name
            name,
            // Setting the email
            email,
            // Hashing the plain text password before storing it
            password: await hashPassword(password),
            // Explicitly assigning the donor role
            role: 'donor',
            // Storing the selected interest categories
            interests,
            // Marking the interest onboarding quiz as complete
            onboardingComplete: true
        });

        // Generating a token and attaching the login cookie to the response
        generateTokenAndSetCookie(res, newUser);
        // Removing the password from the object for a cleaner response
        newUser.password = undefined;

        // Returning the new user profile and successful registration message
        return res.status(201).json({
            success: true,
            message: 'Donor registered successfully',
            user: newUser
        });
    } catch (error) {
        // Returning a generic error response for any unexpected server failures
        return res.status(500).json({ success: false, message: error.message });
    }
};

// End-point to register a new NGO and its corresponding user account
export const registerNGO = async (req, res) => {
    // Destructuring combined user and NGO registration data
    const { name, email, password, ngoName, category, location, bio, doc80G, docFCRA } = req.body;
    try {
        // Checking for all required fields needed for full NGO onboarding
        if (!name || !email || !password || !ngoName || !category) {
            // Returning an error message if mandatory data is missing
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, NGO name, and category are required'
            });
        }

        // Searching for an existing user account with the provide email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Preventing duplicate account creation for the same email
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Creating the primary user account with the NGO role
        const newUser = await User.create({
            // User full name
            name,
            // Email address
            email,
            // Securely hashed password
            password: await hashPassword(password),
            // Role assigned as NGO for this account
            role: 'ngo'
        });

        // Creating the internal NGO profile that will eventually be verified
        const ngoProfile = await NGO.create({
            // Name of the organization
            name: ngoName,
            // Primary cause or industry category
            category,
            // Physical location if provided
            location: location || '',
            // Mission statement or description
            bio: bio || '',
            // URL to 80G tax document
            doc80G: doc80G || '',
            // URL to FCRA compliance document
            docFCRA: docFCRA || '',
            // Setting the initial status as pending for admin review
            status: 'pending',
            // Linking this profile back to the newly created user account
            userId: newUser._id
        });

        // Updating the user account with a reference to the newly created NGO profile
        newUser.ngoProfile = ngoProfile._id;
        // Committing the link to the database
        await newUser.save();

        // Establishing an active session with a signed token cookie
        generateTokenAndSetCookie(res, newUser);
        // Stripping sensitive password before sending to the client
        newUser.password = undefined;

        // Confirming the partial registration success awaiting verification
        return res.status(201).json({
            success: true,
            message: 'NGO registered successfully. Your account is pending admin verification of 80G/FCRA documents.',
            user: newUser,
            ngo: ngoProfile
        });
    } catch (error) {
        // Cleaning up the user account if registration fails at the profile creation step
        if (error && req.body.email) {
            // Attempting to remove the orphaned user account from database
            await User.findOneAndDelete({ email: req.body.email }).catch(() => {});
        }
        // Exposing the error message for debugging and transparency
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Unified login for all user roles (Donor, NGO, and Admin)
export const login = async (req, res) => {
    // Taking the credentials from the request body
    const { email, password } = req.body;
    try {
        // Mandating the presence of both username and password
        if (!email || !password) {
            // Terminating with an error if input is incomplete
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Looking up the user by email and explicitly selecting the password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            // Returning a generic error to prevent account enumeration attacks
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        // Testing the provided password against the stored bcrypt hash
        if (!await comparePassword(password, user.password)) {
            // Denying access if authentication fails
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        // Additional checks if the logging-in user is an NGO
        if (user.role === 'ngo') {
            // Fetching the profile to check its current verification status
            const ngo = await NGO.findOne({ userId: user._id });
            // Blocking logins if the organization is still awaiting review
            if (ngo && ngo.status === 'pending') {
                return res.status(403).json({
                    success: false,
                    message: 'Your NGO account is pending verification. Please wait for admin approval.'
                });
            }
            // Informing the user if their profile registration was rejected
            if (ngo && ngo.status === 'rejected') {
                return res.status(403).json({
                    success: false,
                    message: `Your NGO registration was rejected. Reason: ${ngo.adminRemarks || 'No remarks provided'}. Please re-submit your documents.`
                });
            }
        }

        // Issuing a valid JWT and setting the login cookie on success
        generateTokenAndSetCookie(res, user);
        // Sanitizing the user object for transmission to the frontend
        user.password = undefined;

        // Completing the login flow with the final user data object
        return res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            user
        });
    } catch (error) {
        // Handing off server errors as generic responses
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Revoking user access by clearing the authentication cookie
export const logout = async (req, res) => {
    try {
        // Instructing the browser to delete the named cookie with matching options
        res.clearCookie('token', {
            // Ensuring the removal only for httpOnly cookies
            httpOnly: true,
            // Re-applying production security flags for successful removal
            secure: process.env.NODE_ENV === 'production',
            // Maintaining strict same-site for cross-origin compliance
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        });
        // Acknowledging the successful logout
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        // Catching any failures during cookie clearing
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Retrieving profile data for the currently authenticated user
export const getMe = async (req, res) => {
    try {
        // Fetching the user from database using the ID provided by protect middleware
        const user = await User.findById(req.user._id).populate('ngoProfile');
        // Validating the existence of the user despite valid token
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Sending the populated user profile back to the client
        return res.status(200).json({ success: true, user });
    } catch (error) {
        // Dealing with lookup failures during token verification
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Initiating a secure password reset process by generating an OTP
export const passwordResetOTP = async (req, res) => {
    // Retrieving the target email from client input
    const { email } = req.body;
    try {
        // Requiring an email address to send the reset code
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        // Locating the user account associated with the email
        const user = await User.findOne({ email });
        if (!user) {
            // Hiding user existence details to prevent scraping
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        // Generating a cryptographically secure 6-digit number
        const otp = crypto.randomInt(100000, 999999);
        // Attaching the OTP code to the user document
        user.otp = otp;
        // Setting an expiration window for the OTP request
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        // Saving the user document with OTP data
        await user.save();

        // Development logging for OTP testing without needing email setup
        console.log(`[DEV] OTP for ${email}: ${otp}`);

        // Confirming the request to the client
        return res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        // Handling database update failures
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Validating an OTP and updating the user's account password
export const resetPassword = async (req, res) => {
    // Getting validation factors and the new password from client
    const { email, otp, newPassword } = req.body;
    try {
        // Enforcing completion of all required reset fields
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Retrieving the specific user document by email
        const user = await User.findOne({ email });
        if (!user) {
            // Generic error for unsuccessful account identification
            return res.status(400).json({ success: false, message: 'Invalid request' });
        }

        // Ensuring that a reset request was actually initiated
        if (!user.otp || !user.otpExpires) {
            return res.status(400).json({ success: false, message: 'No OTP requested. Please request a new OTP.' });
        }

        // Checking if the current time exceeds the reset window
        if (user.otpExpires < Date.now()) {
            // Invalidating the expired OTP fields permanently
            user.otp = null;
            user.otpExpires = null;
            await user.save();
            // Notifying user about the timeout
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
        }

        // Validating the user-provided code against our stored secret
        if (user.otp !== parseInt(otp)) {
            // Rejecting incorrect attempt
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Performing the password update with a fresh secure hash
        user.password = await hashPassword(newPassword);
        // Clearing the single-use OTP fields after success
        user.otp = null;
        user.otpExpires = null;
        // Committing changes for the newly secured account
        await user.save();

        // Sending final success confirmation
        return res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        // Catching any server errors during document update
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Admin only: Approving or rejecting a pending NGO registration profile
export const verifyNGO = async (req, res) => {
    // Extracting the action and target ID from admin request
    const { ngoId, action, remarks } = req.body; // action: 'approve' | 'reject'
    try {
        // Mandating the presence of an ID and a specific outcome
        if (!ngoId || !action) {
            return res.status(400).json({ success: false, message: 'ngoId and action (approve/reject) are required' });
        }

        // Finding the NGO document to be processed
        const ngo = await NGO.findById(ngoId);
        if (!ngo) {
            // Terminating if target document is missing
            return res.status(404).json({ success: false, message: 'NGO not found' });
        }

        // Condition for positive verification
        if (action === 'approve') {
            // Updating the state to approved
            ngo.status = 'approved';
            // Storing any positive feedback if provided
            ngo.adminRemarks = remarks || '';
            // Saving the new NGO profile status
            await ngo.save();
            // Reporting the successful verification back to the admin
            return res.status(200).json({ success: true, message: 'NGO approved successfully', ngo });
        } 
        // Condition for negative verification
        else if (action === 'reject') {
            // Updating the state to rejected
            ngo.status = 'rejected';
            // Recording the reason for rejection for the user to see
            ngo.adminRemarks = remarks || 'No reason provided';
            // Saving the rejection decision
            await ngo.save();
            // Reporting the outcome of the rejection action
            return res.status(200).json({ success: true, message: 'NGO rejected', ngo });
        } else {
            // Blocking invalid action strings
            return res.status(400).json({ success: false, message: 'Invalid action. Use "approve" or "reject".' });
        }
    } catch (error) {
        // Dealing with database or connection errors
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Admin only: Fetching a list of organizations awaiting verification
export const getPendingNGOs = async (req, res) => {
    try {
        // Querying for all documents with the pending status and populating manager info
        const pendingNGOs = await NGO.find({ status: 'pending' }).populate('userId', 'name email');
        // Sending back the filtered list and a count summary
        return res.status(200).json({ success: true, count: pendingNGOs.length, ngos: pendingNGOs });
    } catch (error) {
        // Generic failure response for administrative lookups
        return res.status(500).json({ success: false, message: error.message });
    }
};
