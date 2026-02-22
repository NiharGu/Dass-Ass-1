const nodemailer = require("nodemailer");

let transporter = null;

try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        console.log("Email service configured successfully with:", process.env.EMAIL_USER);
    } else {
        console.log("Email credentials not found in environment variables.");
    }
} catch (error) {
    console.log("Error configuring email service:", error.message);
}

const sendMailWrapper = async (mailOptions) => {
    try {
        if (!transporter) {
            console.log("Email service not configured. Skipping email send.");
            return false;
        }
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${mailOptions.to}`);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error; // Or return false depending on if we want to crash
    }
};

module.exports = { transporter, sendMailWrapper };
