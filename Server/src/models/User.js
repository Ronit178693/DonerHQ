// Importing the mongoose library to interact with MongoDB
import mongoose from 'mongoose';
// Importing bcryptjs for password hashing and comparison
import bcrypt from 'bcryptjs';

// Defining a constant array of valid interest categories for donor onboarding
export const INTEREST_CATEGORIES = [
    // Education related causes
    'education',
    // Environment and sustainability causes
    'environment',
    // Health and medical causes
    'health',
    // Women empowerment causes
    'women',
    // Animal welfare causes
    'animals',
    // Hunger and food security causes
    'hunger'
];

// Creating a new mongoose schema for the User model
const userSchema = new mongoose.Schema({
    // Name field for the user
    name: {
        // Data type is string
        type: String,
        // Field is required with a custom error message
        required: [true, 'Please provide a name'],
        // Trims whitespace from both ends
        trim: true,
        // Minimum length of 2 characters with a custom error message
        minlength: [2, 'Name must be at least 2 characters long']
    },

    // Email field for the user
    email: {
        // Data type is string
        type: String,
        // Field is required with a custom error message
        required: [true, 'Please provide an email'],
        // Ensures email uniqueness in the collection
        unique: true,
        // Converts email to lowercase before saving
        lowercase: true,
        // Regex validation for email format with a custom error message
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },

    // Password field for the user
    password: {
        // Data type is string
        type: String,
        // Field is required with a custom error message
        required: [true, 'Please provide a password'],
        // Minimum password length of 6 characters
        minlength: [6, 'Password must be at least 6 characters long'],
        // Excludes this field from query results by default for security
        select: false
    },

    // Role field to distinguish user types
    role: {
        // Data type is string
        type: String,
        // Restricts values to donor, ngo, or admin
        enum: ['donor', 'ngo', 'admin'],
        // Default role is donor
        default: 'donor'
    },

    // Interests field for donor-specific preferences
    interests: [{
        // Data type is string
        type: String,
        // Restricts values to the predefined interest categories
        enum: INTEREST_CATEGORIES
    }],
    // Stores the raw text input given by the user
    rawPreferenceDescription: {
        type: String,
        default: ''
    },

    // Flag to track if the onboarding quiz is completed
    onboardingComplete: {
        // Data type is boolean
        type: Boolean,
        // Defaults to false
        default: false
    },

    // Additional interest tags as strings
    interestTags: [{
        // Data type is string
        type: String
    }],

    // List of NGO IDs the user is following
    following: [{
        // References the ObjectId of another document
        type: mongoose.Schema.Types.ObjectId,
        // References the NGO model
        ref: 'NGO'
    }],

    // List of NGO IDs the user has saved
    savedNGOs: [{
        // References the ObjectId of another document
        type: mongoose.Schema.Types.ObjectId,
        // References the NGO model
        ref: 'NGO'
    }],

    // List of donation IDs associated with the user
    donationHistory: [{
        // References the ObjectId of another document
        type: mongoose.Schema.Types.ObjectId,
        // References the Donation model
        ref: 'Donation'
    }],

    // Counter for user's activity streak
    streak: {
        // Data type is number
        type: Number,
        // Defaults to 0
        default: 0
    },

    // Score for leaderboard rankings
    leaderboardScore: {
        // Data type is number
        type: Number,
        // Defaults to 0
        default: 0
    },

    // Reference to a fundraising team
    teamId: {
        // References the ObjectId of another document
        type: mongoose.Schema.Types.ObjectId,
        // References the Team model
        ref: 'Team'
    },

    // Link to an NGO profile if the user is an NGO
    ngoProfile: {
        // References the ObjectId of another document
        type: mongoose.Schema.Types.ObjectId,
        // References the NGO model
        ref: 'NGO'
    },

    // OTP for password reset functionality
    otp: {
        // Data type is string (to store hashed hex)
        type: String,
        // Defaults to null
        default: null
    },
    // Expiration timestamp for the OTP
    otpExpires: {
        // Data type is date
        type: Date,
        // Defaults to null
        default: null
    }

}, {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
});

// Helper function to hash a plain text password
export const hashPassword = async (password) => {
    // Generating a salt with 10 rounds
    const salt = await bcrypt.genSalt(10);
    // Hashing the password with the generated salt
    return await bcrypt.hash(password, salt);
};

// Helper function to compare a plain text password with a hashed one
export const comparePassword = async (password, hashedPassword) => {
    // Using bcrypt to compare the two passwords
    return await bcrypt.compare(password, hashedPassword);
};

// Creating the User model from the schema
const User = mongoose.model('User', userSchema);
// Exporting the User model as default
export default User;
