const axios = require("axios");

const verifyCaptcha = async (req, res, next) => {
    const captchaToken = req.body.captchaToken;

    // If no secret key is configured, skip verification (dev mode)
    if (!process.env.RECAPTCHA_SECRET_KEY) {
        return next();
    }

    if (!captchaToken) {
        return res.status(400).json({ message: "CAPTCHA verification required" });
    }

    try {
        const response = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: captchaToken
                }
            }
        );

        const { success, score } = response.data;

        if (!success) {
            return res.status(400).json({ message: "CAPTCHA verification failed" });
        }

        // reCAPTCHA v3: score 0.0 (bot) to 1.0 (human), reject below 0.5
        if (score !== undefined && score < 0.5) {
            return res.status(400).json({ message: "Suspicious activity detected. Please try again." });
        }

        next();
    } catch (error) {
        console.error("CAPTCHA verification error:", error.message);
        next(); // fail open if Google is unreachable
    }
};

module.exports = verifyCaptcha;
