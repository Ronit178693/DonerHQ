// Importing the fs module for managing local file system operations
import fs from 'fs';
// Importing the configured Cloudinary version 2 library instance
import cloudinary from '../config/cloudinary.js';

/**
 * Cloudinary Upload Helper
 * This function takes a local file path, uploads it to the Cloudinary CMS,
 * and then cleans up the temporary local file regardless of the result.
 */
const uploadOnCloudinary = async (localFilePath) => {
    // Starting the try block to process the upload
    try {
        // Checking if a valid file path has been provided
        if (!localFilePath) return null;
        
        // Uploading the target file to the Cloudinary cloud instance
        const response = await cloudinary.uploader.upload(localFilePath, {
            // Automatically detecting the file type (image or video)
            resource_type: "auto",
            // Storing all app-related media in a dedicated folder on Cloudinary
            folder: "donerhq_media"
        });

        // Logging the successful upload secure URL for debugging purposes
        console.log("✅ File uploaded to Cloudinary Successfully:", response.url);
        
        // Deleting the temporary file from the local server to save disk space
        fs.unlinkSync(localFilePath);
        
        // Returning the Cloudinary response object which includes the secure URL
        return response;
        
    // Catching any Cloudinary or upload process errors
    } catch (error) {
        // Checking if the file exists before attempting to clean up on failure
        if (fs.existsSync(localFilePath)) {
            // Deleting the temporary file on local server to maintain clean storage
            fs.unlinkSync(localFilePath);
        }
        // Propagating the error information back to the controller
        return null; 
    }
};

/**
 * Cloudinary Deletion Helper (Optional)
 * This function handles media cleanup for when content is deleted.
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    // Starting the try block to process the deletion
    try {
        // Calling the Cloudinary uploader to destroy the asset
        const result = await cloudinary.uploader.destroy(publicId, {
            // Specifying whether it was an image, video, or raw file
            resource_type: resourceType
        });
        // Returning the status code of the deletion
        return result;
    // Catching any deletion process errors
    } catch (error) {
        // Returning null if the deletion fails for any reason
        return null;
    }
};

// Exporting the upload helper functions for use in our controllers
export { uploadOnCloudinary, deleteFromCloudinary };
