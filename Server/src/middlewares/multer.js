// Importing the multer library for handling multi-part form data (file uploads)
import multer from 'multer';
// Importing the native Node.js path module for file extension handling
import path from 'path';

/**
 * Disk Storage Configuration
 * We tell Multer to store incoming files temporarily on the server's hard drive
 * using the 'public/temp' directory (ensure this exists or is created).
 */
const storage = multer.diskStorage({
    // Defining the destination for the temporarily uploaded files
    destination: function (req, file, cb) {
        // Storing them in a 'public/temp' folder for Cloudinary to pick up
        cb(null, './public/temp');
    },
    // Defining the filename structure for the temporary storage
    filename: function (req, file, cb) {
        // Creating a unique filename with the current timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Concatenating the original name's extension for file integrity
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

/**
 * File Filtering Logic (Optional but recommended)
 * Only allowing specific image and video formats to prevent server exploits.
 */
const fileFilter = (req, file, cb) => {
    // List of allowed file extension types
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|wmv/;
    // Checking the extension and mimetype for a security match
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        // If the file is valid, proceed with the upload
        return cb(null, true);
    } else {
        // If the file is invalid, reject it with an error message
        cb(new Error('Only images (jpg, png, gif) and videos (mp4, mov, avi) are allowed.'));
    }
};

/**
 * Initializing the Multer Upload Middleware
 * This instance will be reused across routes that need file handling.
 */
export const upload = multer({ 
    // Attaching our storage settings
    storage,
    // Attaching our file filtering security
    fileFilter,
    // Setting a size limit for the file upload (e.g., 50MB for videos)
    limits: { fileSize: 50 * 1024 * 1024 } 
});
