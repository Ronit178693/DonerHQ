// Importing the User model and its helper functions for authentication and interest handling
import User, { hashPassword, comparePassword, INTEREST_CATEGORIES } from '../models/User.js';
// Importing the NGO model for registration and profile management workflows
import NGO from '../models/NGO.js';
// Importing the jsonwebtoken library for secure token creation and signing
import jwt from 'jsonwebtoken';
// Importing crypto for secure random number generation during password resets
import crypto from 'crypto';
// Importing the Cloudinary upload utility for NGO registration file handling
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import sendEmail from '../utils/sendEmail.js';


// Reusable function to create a JWT and set it as an httpOnly session cookie
const generateTokenAndSetCookie = (res, user) => {
    // Calling jwt.sign to create a new token with the user's unique identity and current role
    const token = jwt.sign(
        // Payload containing current user's unique database ID and assigned role
        { id: user._id, role: user.role },
        // Secret key used for cryptographic signing from environment variables
        process.env.JWT_SECRET,
        // Configurable options, including a 7-day expiration for long-lived sessions
        { expiresIn: '7d' }
    );

    // Using the express response object to set an encrypted cookie for the browser
    res.cookie('token', token, {
        // Prevents client-side scripts from reading the cookie (mitigates XSS)
        httpOnly: true,
        // Enforcing secure HTTPS transport for the cookie specifically in production environments
        secure: process.env.NODE_ENV === 'production',
        // Configuring the SameSite policy for protection against CSRF attacks
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        // Setting the maximum age of the cookie to 7 days to match the token period
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    // Returning the newly created token for any further server-side processing
    return token;
// Closing the helper function
};

// Unified registration entry point that dispatches to specific role handlers
export const register = async (req, res) => {
    const { role } = req.body;
    
    // Defaulting to donor if no role is explicitly provided
    if (!role || role === 'donor') {
        // Enforcing default interests if the frontend didn't provide any yet
        if (!req.body.interests) {
            req.body.interests = [INTEREST_CATEGORIES[0]]; // Default to first category
        }
        return registerDonor(req, res);
    }
    
    if (role === 'ngo') {
        // Providing fallback defaults for mandatory NGO fields to prevent initial setup failure
        if (!req.body.bio || req.body.bio === '') req.body.bio = 'New organization on DonerHQ.';
        if (!req.body.location || req.body.location === '') req.body.location = 'India';
        if (!req.body.category || req.body.category === '') req.body.category = 'Sustainability';
        return registerNGO(req, res);
    }

    return res.status(400).json({ success: false, message: 'Invalid role provided' });
};

// End-point to register a new donor account with an interest-based onboarding quiz
export const registerDonor = async (req, res) => {
    // Destructuring all essential donor registration fields from the request body
    const { name, email, password, interests } = req.body;
    // Starting the registration process with comprehensive error catching
    try {
        // Defensive check: ensuring name, email, and password are all present
        if (!name || !email || !password) {
            // Returning a 400 Bad Request if any mandatory field is missing
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        // Closing the guard clause
        }

        // Ensuring interests is an array (even if a single string is provided by multipart/form-data)
        let normalizedInterests = interests;
        if (interests && typeof interests === 'string') {
            try {
                normalizedInterests = JSON.parse(interests);
            } catch (e) {
                normalizedInterests = [interests];
            }
        }

        // Ensuring the donor has participated in the interest selection component
        if (!normalizedInterests || !Array.isArray(normalizedInterests) || normalizedInterests.length === 0) {
            // Returning an error prompting the user to select at least one interest category
            return res.status(400).json({
                success: false,
                message: 'Please select at least one interest category',
                categories: INTEREST_CATEGORIES
            });
        }

        // Filtering user inputs to ensure only valid interest categories are saved
        const invalidInterests = normalizedInterests.filter(i => !INTEREST_CATEGORIES.includes(i));
        // Branching logic to handle disallowed category inputs
        if (invalidInterests.length > 0) {
            // Returning an error listing which specific categories failed validation
            return res.status(400).json({
                // Flagging failure
                success: false,
                // Reporting specific error details
                message: `Invalid interest categories: ${invalidInterests.join(', ')}`,
                // Reminding the client of the correct options
                validCategories: INTEREST_CATEGORIES
            // Closing the JSON object
            });
        // Closing the invalid interests block
        }

        // Checking the database for an existing user with the same email to prevent duplicates
        const existingUser = await User.findOne({ email });
        // Handling the case where the email is already registered
        if (existingUser) {
            // Returning a 400 error to indicate the account already exists
            return res.status(400).json({ success: false, message: 'User already exists' });
        // Closing the duplicate check block
        }

        // Creating and saving the new user document into the MongoDB collection
        const newUser = await User.create({
            // Setting the full name of the donor
            name,
            // Setting the unique account email
            email,
            // Hashing the plain text password for secure database storage
            password: await hashPassword(password),
            // Assigning the default donor role for social accounts
            role: 'donor',
            // Storing the filtered interest categories for the feed algorithm
            interests: normalizedInterests,
            // Marking the onboarding journey as successfully completed
            onboardingComplete: true
        });
        
        // 📧 WELCOME EMAIL: Notifying the user of their successful entry into the ledger
        const welcomeHtml = `
            <div style="font-family: sans-serif; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 16px;">
                <h1 style="color: #b9ffe8; font-size: 24px;">Welcome to the Impact Ledger, ${name}!</h1>
                <p>Your donor node has been successfully initialized on <b>DonerHQ</b>.</p>
                <p>We've calibrated your feed based on your interests: <b>${normalizedInterests.join(', ')}</b>.</p>
                <div style="margin-top: 30px; border-top: 1px solid #333; padding-top: 20px;">
                    <p style="font-size: 12px; color: #666;">This is an automated protocol message. Verify your transactions on-chain.</p>
                </div>
            </div>
        `;
        sendEmail(email, 'Identity Committed to Ledger — Welcome to DonerHQ', welcomeHtml);

        // Generating a secure JWT and attaching it to the current response session
        generateTokenAndSetCookie(res, newUser);
        
        // Scrubbing the password field from the user object before returning it to the client
        newUser.password = undefined;

        // Sending the final success response including the new user's profile
        return res.status(201).json({
            // Marking success
            success: true,
            // Sending a warm welcome message
            message: 'Donor registered and onboarded successfully',
            // Attaching the profile object
            user: newUser
        // Closing the success JSON
        });
    // Catching any database connection issues or schema validation errors
    } catch (error) {
        // Returning a 500 status with the specific internal failure details
        return res.status(500).json({ success: false, message: error.message });
    // Closing the try-catch block
    }
// Closing the registerDonor controller
};

// End-point to register a new NGO account with a pending verification status
export const registerNGO = async (req, res) => {
    // Destructuring essential NGO and creator fields from the request body
    const { name, email, password, bio, location, category } = req.body;
    // Starting the NGO registration mission with an error safety net
    try {
        // Validating the presence of all required fields for a complete NGO profile
        if (!name || !email || !password || !bio || !location || !category) {
            // Returning 400 Bad Request if the profile data is incomplete
            return res.status(400).json({ success: false, message: 'Incomplete NGO registration details provided' });
        // Closing the completeness check
        }

        // Checking if an account already exists with this specific organizational email
        const existingUser = await User.findOne({ email });
        // Blocking the creation of duplicate accounts
        if (existingUser) {
            // Returning a 400 error if the organization's email is already in use
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        // Closing the duplicate email block
        }

        // Handling multiple file uploads using the Cloudinary helper
        let logoUrl = '';
        let doc80GUrl = '';
        let docFCRAUrl = '';

        // Checking if the request contains complex file field data (from Multer upload.fields)
        if (req.files) {
            // Processing the organizational logo if provided
            if (req.files.logo) {
                const logoRes = await uploadOnCloudinary(req.files.logo[0].path);
                if (logoRes) logoUrl = logoRes.secure_url;
            }
            // Processing the mandatory 80G tax-exemption document
            if (req.files.doc80G) {
                const gRes = await uploadOnCloudinary(req.files.doc80G[0].path);
                if (gRes) doc80GUrl = gRes.secure_url;
            }
            // Processing the voluntary FCRA international funding certificate
            if (req.files.docFCRA) {
                const fRes = await uploadOnCloudinary(req.files.docFCRA[0].path);
                if (fRes) docFCRAUrl = fRes.secure_url;
            }
        }

        // Creating the core User account for the NGO creator/manager
        const newUser = await User.create({
            // Setting the creator's full name
            name,
            // Setting the account email
            email,
            // Hashing the secret password for secure storage
            password: await hashPassword(password),
            // Assigning the specialized NGO system role
            role: 'ngo',
            // Defaulting onboarding to complete since NGO has different flow
            onboardingComplete: true
        // Closing the user create parameters
        });

        // Creating the internal NGO organization profile linked to the new user account
        const newNGO = await NGO.create({
            // Establishing the relationship between the organization and the user ID
            userId: newUser._id,
            // Setting the official NGO name
            name,
            // Saving the storytelling biography explaining their mission
            bio,
            // Storing the brand logo URL or defaulting to a placeholder
            logo: logoUrl || '',
            // Saving the 80G certification link
            doc80G: doc80GUrl || '',
            // Saving the FCRA certification link
            docFCRA: docFCRAUrl || '',
            // Storing the geographic headquarters or service location
            location,
            // Categorizing the NGO for easier discovery and filtering
            category,
            // Initializing the status as pending until manually reviewed by an admin
            status: 'pending'
        // Closing the NGO create parameters
        });

        // Updating the user document to reference their new NGO profile document
        await User.findByIdAndUpdate(newUser._id, { $set: { ngoProfile: newNGO._id } });

        // Generating a session token and setting the login cookie
        generateTokenAndSetCookie(res, newUser);
        
        // Scrubbing the password for security before sending the response
        newUser.password = undefined;

        // Returning the success response with both the user and NGO profile data
        return res.status(201).json({
            // Success flag
            success: true,
            // Confirmation alert
            message: 'NGO registration submitted. Profile is now pending administrative verification.',
            // The person behind the account
            user: newUser,
            // The organization profile itself
            ngo: newNGO
        // Closing the success JSON
        });
    // Catching any update failures or database schema violations
    } catch (error) {
        // Returning a 500 status message for server-side processing errors
        return res.status(500).json({ success: false, message: error.message });
    // Closing the try-catch block
    }
// Closing the registerNGO controller
};

// End-point to authenticate and provide a session cookie for all users (Admin, NGO, Donor)
export const login = async (req, res) => {
    // Extracting credentials from the request body
    const { email, password } = req.body;
    // Starting the authentication process
    try {
        // Validating that both email and password were provided in the login form
        if (!email || !password) {
            // Returning 400 if the credentials are missing
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        // Closing the credentials block
        }

        // Searching for the user in the database by their unique email
        const user = await User.findOne({ email }).select('+password').populate('ngoProfile');
        // Handling the missing account scenario
        if (!user) {
            // Returning a 401 Unauthorized error for invalid account records
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        // Closing the user check block
        }

        // Verifying the provided password against the stored bcrypt hash
        const isMatch = await comparePassword(password, user.password);
        // Handling incorrect password attempts
        if (!isMatch) {
            // Returning a 401 Unauthorized error for mismatched credentials
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        // Closing the match check block
        }

        // Generating a secure JWT and attaching it to the session cookie
        generateTokenAndSetCookie(res, user);
        
        // Removing the password from the user object for the response
        user.password = undefined;

        // Returning the successful login response including the profile details
        return res.status(200).json({
            // Success flag
            success: true,
            // Personal greeting
            message: `Welcome back, ${user.name}!`,
            // Authenticated user data
            user 
        // Closing the success JSON
        });
    // Catching any database query or cryptographic comparison errors
    } catch (error) {
        // Returning a 500 error status with specific details
        return res.status(500).json({ success: false, message: error.message });
    // Closing the try-catch block
    }
// Closing the login controller
};

// End-point to log out an authenticated user and clear their secure session cookie
export const logout = async (req, res) => {
    // Instructing the response to clear the 'token' cookie immediately
    res.cookie('token', '', {
        // Setting an expiration date from the past to force immediate deletion
        expires: new Date(0),
        // Ensuring security flags remain consistent with a deleted cookie
        httpOnly: true,
        // Transport flag
        secure: process.env.NODE_ENV === 'production',
        // Cross-site flag
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    // Closing the cookie parameters
    });
    // Acknowledging the successful termination of the session
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
// Closing the logout controller
};


// End-point to initiate a secure password reset via OTP (One-Time Password) to email
export const passwordResetOTP = async (req, res) => {
    // Extracting the target email address from the request body
    const { email } = req.body;
    // Starting the password reset workflow
    try {
        // Searching for the user in the database
        const user = await User.findOne({ email });
        // Guard clause ensuring we only send codes to registered users
        if (!user) {
            // Returning a 404 response if the email is not registered
            return res.status(404).json({ success: false, message: 'No user found with this email' });
        // Closing the user check
        }

        // Generating a secure 6-digit random code for the reset process
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Encrypting the OTP before saving it to the database (stored as string)
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
        
        // Setting an expiration for the code (3 minutes from now)
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

        // Updating the user record with the recovery information
        user.otp = hashedOtp;
        // Updating the expiration timestamp
        user.otpExpires = expiresAt;
        // Committing the recovery state changes to the database
        await user.save();

        sendEmail(email, 'Password Reset Otp'+ otp +'is valid for 3 minutes.');

        // LOGIC: At this point, we would call an email service (like SendGrid or AWS SES)
        // For demonstration, we'll return the OTP directly in the response (INSECURE - FOR DEV ONLY)
        return res.status(200).json({  
            // Flag success
            success: true, 
            // Informative message
            message: 'OTP sent to email successfully', 
            // Sensitive: returning code for development testing
            otp: process.env.NODE_ENV === 'development' ? otp : 'SENT_TO_EMAIL'
        // Closing the success JSON
        });
    // Catching any database update or cryptographic errors
    } catch (error) {
        // Returning 500 status message
        return res.status(500).json({ success: false, message: error.message });
    // Closing the try-catch block
    }
// Closing the passwordResetOTP controller
};

// End-point to finalize a password update using a valid email and OTP proof
export const resetPassword = async (req, res) => {
    // Extracting the repair data: email, the code provided by user, and the new password
    const { email, otp, newPassword } = req.body;
    // Starting the password rotation with security checks
    try {
        // Validating the input presence
        if ( !otp || !newPassword) {
            // Returning 400 if any field is missing
            return res.status(400).json({ success: false, message: 'All fields are required' });
        // Closing the presence check
        }

        // Searching for the user in the collection
        const user = await User.findOne({ email }).select('+otp +otpExpires');
        // Checking for user existence
        if (!user) {
            // Returning 404 if not found
            return res.status(404).json({ success: false, message: 'User not found' });
        // Closing the user check block
        }

        // Encrypting the provided OTP to compare it with the stored hash
        const hashedOtpInput = crypto.createHash('sha256').update(otp).digest('hex');
        // Comparing the hashes and checking the expiration status
        if (user.otp !== hashedOtpInput || user.otpExpires < new Date()) {
            // Returning 401 Unauthorized if the code is invalid or expired
            return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
        // Closing the OTP verification check
        }

        // Updating the account with the new secure password hash
        user.password = await hashPassword(newPassword);
        // Clearing the OTP fields now that they've been successfully used
        user.otp = undefined;
        // Deleting the expiration timestamp
        user.otpExpires = undefined;
        
        // Committing the newly secured credentials back to the database
        await user.save();

        // Returning a notification that the account is now secured with a new password
        return res.status(200).json({ success: true, message: 'Password reset successfully' });
    // Catching any hash generation or DB save failures
    } catch (error) {
        // Returning a 500 status message
        return res.status(500).json({ success: false, message: error.message });
    // Closing the try-catch block
    }
// Closing the resetPassword controller
};

// Administrative end-point to approve or reject organizations awaiting review
export const verifyNGO = async (req, res) => {
    // Extracting the organization ID and the admin's decision from the request
    const { ngoId, status } = req.body; // status: 'approved' or 'rejected'
    // Starting the administrative verification mission
    try {
        // Guard clause ensuring the decision is either 'approved' or 'rejected'
        if (!['approved', 'rejected'].includes(status)) {
            // Returning 400 for invalid administrative status choices
            return res.status(400).json({ success: false, message: 'Status must be either approved or rejected' });
        // Closing the status check
        }

        // Finding the target NGO document in the database
        const ngo = await NGO.findById(ngoId);
        // Checking if the organization actually exists
        if (!ngo) {
            // Returning a 404 response
            return res.status(404).json({ success: false, message: 'NGO not found' });
        // Closing the NGO existence check
        }

        // Updating the NGO's global status based on the admin's clinical review
        ngo.status = status;
        // Toggle the 'verified' boolean flag if the status was approved
        ngo.verified = status === 'approved';
        // Committing the review decision to the database
        await ngo.save();

        // Returning a summary of the action taken
        return res.status(200).json({ 
            // Success flag
            success: true, 
            // Descriptive action message
            message: `NGO status updated to ${status}`, 
            // The modified record for verification
            ngo 
        // Closing the success JSON
        });
    // Catching any database update or authorization errors
    } catch (error) {
        // Returning 500 status message
        return res.status(500).json({ success: false, message: error.message });
    // Closing the try-catch block
    }
// Closing the verifyNGO controller
};

// Administrative end-point to list all NGO registration requests currently pending review
export const getPendingNGOs = async (req, res) => {
    // Starting the cleanup and retrieval for the admin dashboard
    try {
        // Searching for NGO profiles that are strictly in the 'pending' verification state
        const ngos = await NGO.find({ status: 'pending' }).populate('userId', 'name email');
        // Returning the list of organizations needing attention along with a count
        return res.status(200).json({ success: true, count: ngos.length, ngos });
    // Catching any database query errors
    } catch (error) {
        // Returning a 500 status with specific details
        return res.status(500).json({ success: false, message: error.message });
    // Closing the try-catch block
    }
// Closing the getPendingNGOs controller
};

// End-point for admins to retrieve the entire user-base for moderation and oversight
export const getAllUsers = async (req, res) => {
    // Starting the mission-critical search for all registered identities
    try {
        // Querying every account from the core user ledger
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        // Returning the full list of agents currently in the ecosystem
        return res.status(200).json({ success: true, count: users.length, users });
    // Catching any processing timeouts or database malfunctions
    } catch (error) {
        // Returning a 500 status message for service failures
        return res.status(500).json({ success: false, message: error.message });
    // Closing the try-catch block
    }
// Closing the getAllUsers controller
};
