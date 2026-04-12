// Importing the nodemailer library to coordinate email sending
import nodemailer from 'nodemailer';

// Creating a reusable email transporter instance for our application
const transporter = nodemailer.createTransport({
    // Using Gmail as our service provider
    service: 'gmail',
    // Authenticating into the Google account with environment variables
    auth: {
        // User login for SMTP server
        user: process.env.EMAIL_USER,
        // Application specific password
        pass: process.env.EMAIL_PASS
    }
});

// Defined a helper function to send emails from our application
const sendEmail = async (to, subject, htmlContent) => {
    try {
        // Constructing the mail options with recipients and content
        const mailOptions = {
            from: `"DonerHQ Impact" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent
        };
        
        // Attempting to send the email using our transport instance
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ Nodemailer Error sending to ${to}:`, error.message);
        // We don't throw here to avoid crashing the whole request, 
        // but we'll know it failed via logs.
        return null;
    }
};

// Exporting the sendEmail helper as default
export default sendEmail;
