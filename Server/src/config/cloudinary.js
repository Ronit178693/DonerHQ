// Importing the Cloudinary version 2 library for configuration
import { v2 as cloudinary } from 'cloudinary';
// Importing dotenv to ensure environment variables are available (redundant but safe)
import 'dotenv/config';

/**
 * Cloudinary Configuration
 * This connects your application to the Cloudinary cloud storage service
 * using the credentials provided in the .env file.
 */
cloudinary.config({
    // Fetching the Cloud Name from our environment variables
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    // Fetching the API Key from our environment variables
    api_key: process.env.CLOUDINARY_API_KEY,
    // Fetching the API Secret from our environment variables
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Exporting the configured cloudinary instance to be used throughout the app
export default cloudinary;
