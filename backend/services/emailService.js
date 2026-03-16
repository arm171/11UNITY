/**
 * EMAIL SERVICE
 * Sends transactional emails via Gmail SMTP using nodemailer.
 * Works for any recipient email provider (Gmail, mail.ru, Yahoo, etc.)
 */

const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Gmail App Password (16 chars, no spaces)
    }
});

/**
 * Send email verification link to new user.
 * @param {string} toEmail - recipient email address
 * @param {string} name    - recipient display name
 * @param {string} token   - unique verification token stored in DB
 */
async function sendVerificationEmail(toEmail, name, token) {
    const verifyUrl = `http://localhost:3000/api/auth/verify/${token}`;

    await transporter.sendMail({
        from: `"11UNITY" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Verify your 11UNITY account',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#1a1a2e;color:#ffffff;padding:40px;border-radius:12px;">
                <h1 style="color:#2ecc71;text-align:center;margin-bottom:4px;">⚽ 11UNITY</h1>
                <h2 style="text-align:center;font-weight:400;margin-bottom:32px;">Verify your email address</h2>

                <p>Hello, <strong>${name}</strong>!</p>
                <p style="color:#ccc;line-height:1.7;">
                    Thank you for registering. Click the button below to verify your email
                    and get instantly logged into your account.
                </p>

                <div style="text-align:center;margin:36px 0;">
                    <a href="${verifyUrl}"
                       style="background:#2ecc71;color:#000;padding:14px 40px;border-radius:8px;
                              text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
                        Verify Email & Sign In
                    </a>
                </div>

                <p style="color:#666;font-size:13px;">
                    Or copy this link into your browser:<br>
                    <span style="color:#888;">${verifyUrl}</span>
                </p>
                <p style="color:#555;font-size:12px;margin-top:24px;">
                    If you did not register on 11UNITY, you can safely ignore this email.
                </p>
            </div>
        `
    });

    console.log(`Verification email sent to: ${toEmail}`);
}

/**
 * Send password reset link to user.
 */
async function sendPasswordResetEmail(toEmail, name, token) {
    const resetUrl = `http://127.0.0.1:5500/frontend/index.html?reset_token=${token}`;

    await transporter.sendMail({
        from: `"11UNITY" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Reset your 11UNITY password',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#1a1a2e;color:#ffffff;padding:40px;border-radius:12px;">
                <h1 style="color:#2ecc71;text-align:center;margin-bottom:4px;">⚽ 11UNITY</h1>
                <h2 style="text-align:center;font-weight:400;margin-bottom:32px;">Password Reset</h2>

                <p>Hello, <strong>${name}</strong>!</p>
                <p style="color:#ccc;line-height:1.7;">
                    We received a request to reset your password. Click the button below to set a new password.
                    This link expires in <strong>1 hour</strong>.
                </p>

                <div style="text-align:center;margin:36px 0;">
                    <a href="${resetUrl}"
                       style="background:#2ecc71;color:#000;padding:14px 40px;border-radius:8px;
                              text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
                        Reset Password
                    </a>
                </div>

                <p style="color:#666;font-size:13px;">
                    Or copy this link into your browser:<br>
                    <span style="color:#888;">${resetUrl}</span>
                </p>
                <p style="color:#555;font-size:12px;margin-top:24px;">
                    If you did not request a password reset, you can safely ignore this email.
                </p>
            </div>
        `
    });

    console.log(`Password reset email sent to: ${toEmail}`);
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
