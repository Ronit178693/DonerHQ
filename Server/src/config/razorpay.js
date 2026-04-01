// Importing the Razorpay library to initialize the payment gateway client
import Razorpay from 'razorpay';
// Importing dotenv to ensure our gateway credentials are loaded
import 'dotenv/config';

/**
 * Razorpay Client Initialization
 * This creates a reusable instance of the Razorpay SDK to interact
 * with the payment gateway using your unique API credentials.
 */
const razorpay = new Razorpay({
    // Fetching the public Key ID from the environment variables
    key_id: process.env.RAZORPAY_KEY_ID,
    // Fetching the private Key Secret from the environment variables
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Exporting the configured instance to be used in donation controllers
export default razorpay;
