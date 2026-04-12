// Importing the fs module for managing local file system operations
import fs from 'fs';
// Importing path for file manipulation
import path from 'path';
// Importing the configured Cloudinary version 2 library instance
import cloudinary from '../config/cloudinary.js';

/**
 * Cloudinary Upload Helper
 * This function takes a local file path, uploads it to the Cloudinary CMS,
 * and then cleans up the temporary local file regardless of the result.
 * Falls back to local storage if Cloudinary is unavailable.
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
        console.log("✅ File uploaded to Cloudinary:", response.secure_url);
        
        // Deleting the temporary file from the local server to save disk space
        fs.unlinkSync(localFilePath);
        
        // Returning the Cloudinary response object which includes the secure URL
        return response;
        
    // Catching any Cloudinary or upload process errors
    } catch (error) {
        // Log the full error so we can diagnose upload failures
        console.error("❌ Cloudinary upload FAILED:", error.message || error);
        console.log("📂 Falling back to local file storage...");
        
        // ─── LOCAL FALLBACK ───
        // Move the file from temp to a persistent uploads directory
        try {
            const uploadsDir = path.resolve('./public/uploads');
            // Ensure the uploads directory exists
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            
            const filename = path.basename(localFilePath);
            const destPath = path.join(uploadsDir, filename);
            
            // Move the file (rename it from temp to uploads)
            fs.renameSync(localFilePath, destPath);
            
            // Build a local URL that Express will serve
            const localUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${filename}`;
            console.log("✅ File saved locally:", localUrl);
            
            // Return an object mimicking Cloudinary's response shape
            return { secure_url: localUrl, url: localUrl };
        } catch (fallbackError) {
            console.error("❌ Local fallback also failed:", fallbackError.message);
            // Clean up the temp file if it still exists
            if (localFilePath && fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
            return null;
        }
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
