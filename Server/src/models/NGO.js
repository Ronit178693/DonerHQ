// Importing mongoose to manage MongoDB interactions
import mongoose from 'mongoose';

// Array for predefined validation statuses for NGOs
export const NGO_STATUSES = ['pending', 'approved', 'rejected'];

// Defining the schema for an NGO profile
const ngoSchema = new mongoose.Schema({
    // Name of the NGO
    name: {
        // Data type is string
        type: String,
        // Field is required with a custom error message
        required: true
    },

    // A short biography or mission statement
    bio: {
        // Data type is string
        type: String
    },

    // Reference to a logo file, often a Cloudinary URL
    logo: {
        // Data type is string
        type: String
    },

    // Category for classification and filtering
    categories: [{
        // Data type is string
        type: String
    }],
    tags: [{
    type: String
}],

    // Main location of the NGO
    location: {
        // Data type is string
        type: String
    },

    // Verification status for the NGO profile
    status: {
        // Data type is string
        type: String,
        // Restricts values to pending, approved, or rejected
        enum: NGO_STATUSES,
        // Default status is pending upon registration
        default: 'pending'
    },

    // Link to the 80G document
    doc80G: {
        // Data type is string
        type: String
    },

    // Link to the FCRA document
    docFCRA: {
        // Data type is string
        type: String
    },

    // Optional remarks or notes from an administrator
    adminRemarks: {
        // Data type is string
        type: String
    },

    // Foreign key reference to the managing user's account
    userId: {
        // References the ObjectId of another document
        type: mongoose.Schema.Types.ObjectId,
        // References the User model
        ref: 'User',
        // User identification is required
        required: true
    },

    // Boolean flag to quickly check if the NGO is verified
    verified: {
        // Data type is boolean
        type: Boolean,
        // Defaults to false
        default: false
    },

    // Score for transparency or reporting performance
    transparencyScore: {
        // Data type is number
        type: Number,
        // Defaults to 0
        default: 0
    },

    // Count of followers for this NGO
    followerCount: {
        // Data type is number
        type: Number,
        // Defaults to 0
        default: 0
    },

    // Total amount raised across all causes
    totalRaised: {
        // Data type is number
        type: Number,
        // Defaults to 0
        default: 0
    },

    // List of charitable causes managed by this NGO
    causes: [{
        // References the ObjectId of another document
        type: mongoose.Schema.Types.ObjectId,
        // References the Cause model
        ref: 'Cause'
    }],

    // List of social feed posts authored by this NGO
    posts: [{
        // References the ObjectId of another document
        type: mongoose.Schema.Types.ObjectId,
        // References the Post model
        ref: 'Post'
    }]

}, {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
});

// Middleware function to synchronize the verified flag with the status
ngoSchema.pre('save', function () {
    // Setting verified to true only if the status is 'approved'
    this.verified = this.status === 'approved';
});

// Creating an index on the category field for faster searching
ngoSchema.index({ category: 1 });
// Creating an index on the status field for faster admin lookups
ngoSchema.index({ status: 1 });
// Creating an index on userId for fast NGO profile lookup by user account
ngoSchema.index({ userId: 1 });
// Creating an index on tags for category/tag discovery
ngoSchema.index({ tags: 1 });

// Compiling the NGO model from the schema
const NGO = mongoose.model('NGO', ngoSchema);
// Exporting the NGO model as default
export default NGO;
