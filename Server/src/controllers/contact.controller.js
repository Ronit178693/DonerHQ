import nodemailer from 'nodemailer';

export const contact = async (req, res) => {
    const { name, email, subject, message } = req.body;
    try {
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"DonerHQ Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `[DonerHQ Contact] ${subject}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #00e9bf;">New Contact Message Received</h2>
                    <hr style="border: 0; border-top: 1px solid #eee;" />
                    <p><b>Sender Name:</b> ${name}</p>
                    <p><b>Sender Email:</b> <a href="mailto:${email}">${email}</a></p>
                    <p><b>Subject:</b> ${subject}</p>
                    <p><b>Message:</b></p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #00e9bf; font-style: italic;">
                        ${message.replace(/\n/g, '<br/>')}
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Email sent successfully!' });
    }
    catch (err) {
        console.error("Nodemailer Error:", err);
        return res.status(500).json({ success: false, message: 'Failed to dispatch email.' });
    }
};