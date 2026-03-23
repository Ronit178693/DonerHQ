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

// Defining a helper function to send emails from our application
const sendEmail = async (to, subject, htmlContent) => {
    // Constructing the mail options with recipients and content
    const mailOptions = {
        // Setting the sender display name and email address
        from: `"DonerHQ" <${process.env.EMAIL_USER}>`,
        // Setting the target email address
        to,
        // Setting the subject line of the email
        subject,
        // Setting the main body of the email as HTML content
        html: htmlContent
    };
    // Attempting to send the email using our transport instance
    await transporter.sendMail(mailOptions);
};

// Exporting the sendEmail helper as default
export default sendEmail;
