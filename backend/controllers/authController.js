const User = require("../models/User");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Register a new user (participants only)
exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, participantType, collegeOrOrgName, contactNumber } = req.body;

        // Only participants can self-register
        const role = "participant";

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !participantType || !contactNumber) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate 10-digit contact number
        if (!/^\d{10}$/.test(contactNumber)) {
            return res.status(400).json({ message: "Contact number must be exactly 10 digits" });
        }

        // IIIT email validation
        if (participantType === "iiit") {
            const iiitEmailRegex = /@(students\.|research\.)?iiit\.ac\.in$/i;
            if (!iiitEmailRegex.test(email)) {
                return res.status(400).json({ message: "IIIT participants must use an IIIT-issued email ID" });
            }
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user object
        const userData = {
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            firstName,
            lastName,
            participantType,
            collegeOrOrgName: participantType === 'iiit' ? 'IIIT Hyderabad' : collegeOrOrgName,
            contactNumber
        };

        // Create new user
        const user = new User(userData);
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                participantType: user.participantType
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Check if user exists (case-insensitive email)
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Block disabled organizers from logging in
        if (user.role === 'organizer' && !user.isApproved) {
            return res.status(403).json({ message: "Your account has been disabled by the admin. Contact support." });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                organizerName: user.organizerName,
                isApproved: user.isApproved
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Forgot Password - Participants only can self-reset via email
// Organizers must request reset through Admin (Section 4.1.2)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({
                message: "If an account exists with this email, a password reset link will be sent"
            });
        }

        // Organizers cannot self-reset - must go through admin
        if (user.role === "organizer") {
            return res.status(403).json({
                message: "Organizer password resets must be requested through the Admin"
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash token before storing
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        // Remove any existing reset request for this user
        await PasswordResetRequest.deleteMany({ user: user._id });

        await PasswordResetRequest.create({
            user: user._id,
            token: hashedToken,
            expiresAt: Date.now() + 3600000, // 1 hour
            type: "email"
        });

        // Send email with reset link
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            family: 4,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const sendMailAsync = async (transporter, mailOptions) => {
            return new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.error("sendMail error:", err);
                        reject(err);
                    } else {
                        resolve(info);
                    }
                });
            });
        };

        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Password Reset Request",
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your account.</p>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await sendMailAsync(transporter, mailOptions);

        res.status(200).json({
            message: "If an account exists with this email, a password reset link will be sent"
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Organizer requests password reset from admin
exports.requestPasswordReset = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user || user.role !== "organizer") {
            return res.status(403).json({ message: "Only organizers use this endpoint" });
        }

        const { reason, newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ message: "New password is required" });
        }

        // Hash the new password before storing
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Remove any existing reset request for this user
        await PasswordResetRequest.deleteMany({ user: user._id });

        const requestToken = crypto.randomBytes(16).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(requestToken).digest("hex");

        await PasswordResetRequest.create({
            user: user._id,
            token: hashedToken,
            expiresAt: Date.now() + 7 * 24 * 3600000, // 7 days for admin to respond
            reason: reason || "No reason provided",
            newPasswordHash,
            type: "admin"
        });

        res.json({ message: "Password reset request submitted. Admin will review it." });
    } catch (error) {
        console.error("Request password reset error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Reset Password - Verify token and update password (participants only)
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

        // Hash the token to compare with stored hash
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const resetRequest = await PasswordResetRequest.findOne({
            token: hashedToken,
            expiresAt: { $gt: Date.now() }
        });

        if (!resetRequest) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        const user = await User.findById(resetRequest.user);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        // Clean up the request
        await PasswordResetRequest.findByIdAndDelete(resetRequest._id);

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};